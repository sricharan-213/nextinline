const pool = require('../db');
const { NotFoundError, ConflictError, GoneError, AppError } = require('../utils/AppError');

const MAX_LOCK_RETRIES = 5;

/**
 * Writes a state transition to audit_log.
 * `client` is optional — if omitted, the pool is used directly (for non-transactional audit writes).
 */
async function logEvent({ client, applicantId, jobId, event, oldStatus, newStatus, oldPosition, newPosition, metadata }) {
  const executor = client || pool;
  await executor.query(
    `INSERT INTO audit_log (applicant_id, job_id, event, old_status, new_status, old_position, new_position, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [applicantId, jobId, event, oldStatus || null, newStatus || null, oldPosition || null, newPosition || null,
      metadata ? JSON.stringify(metadata) : null]
  );
}

// Gets the next waitlisted applicant (lowest position)
async function getNextWaitlisted(client, jobId) {
  const result = await client.query(
    `SELECT * FROM applicants WHERE job_id = $1 AND status = 'waitlisted' ORDER BY waitlist_position ASC LIMIT 1`,
    [jobId]
  );
  return result.rows[0] || null;
}

// Promotes the next waitlisted person to pending_acknowledgment
async function promoteNext(client, jobId) {
  const next = await getNextWaitlisted(client, jobId);
  if (!next) return null;

  const window = await client.query(`SELECT acknowledge_window_minutes FROM jobs WHERE id = $1`, [jobId]);
  const minutes = window.rows[0]?.acknowledge_window_minutes || 60;
  const deadline = new Date(Date.now() + minutes * 60 * 1000);
  const oldPosition = next.waitlist_position;

  await client.query(
    `UPDATE applicants
     SET status = 'pending_acknowledgment', waitlist_position = NULL,
         promoted_at = NOW(), acknowledge_deadline = $1, updated_at = NOW()
     WHERE id = $2`,
    [deadline, next.id]
  );

  await logEvent({
    client,
    applicantId: next.id,
    jobId,
    event: 'promoted',
    oldStatus: 'waitlisted',
    newStatus: 'pending_acknowledgment',
    oldPosition,
    newPosition: null,
    metadata: { acknowledge_deadline: deadline }
  });

  return next;
}

// Returns full status info for a single applicant
async function getApplicantStatus(applicantId) {
  const result = await pool.query(
    `SELECT id, name, email, status, waitlist_position, acknowledge_deadline, applied_at, updated_at
     FROM applicants WHERE id = $1`,
    [applicantId]
  );
  if (!result.rows[0]) throw new NotFoundError('Applicant not found');
  return result.rows[0];
}

// Returns the full audit trail for a single applicant
async function getApplicantLog(applicantId) {
  const result = await pool.query(
    `SELECT * FROM audit_log WHERE applicant_id = $1 ORDER BY created_at ASC`,
    [applicantId]
  );
  return result.rows;
}

/**
 * Attempts to acquire a pg advisory lock with exponential backoff.
 * Retries up to MAX_LOCK_RETRIES times before throwing 503.
 * Each retry uses a fresh transaction-level connection attempt.
 */
async function acquireAdvisoryLock(client, lockId, attempt = 0) {
  const acquired = await client.query(`SELECT pg_try_advisory_xact_lock($1)`, [lockId]);
  if (acquired.rows[0].pg_try_advisory_xact_lock) return true;

  if (attempt >= MAX_LOCK_RETRIES - 1) {
    throw new AppError('Pipeline slot is busy — retry shortly', 503);
  }

  // Exponential backoff: 100ms, 200ms, 400ms, 800ms, 1600ms (capped at 2s)
  const delay = Math.min(100 * Math.pow(2, attempt), 2000);
  await new Promise(r => setTimeout(r, delay));

  return acquireAdvisoryLock(client, lockId, attempt + 1);
}

// Submits a new application — uses advisory lock with retry
async function applyForJob(jobId, name, email, userId = null) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const lockResult = await client.query(
      `SELECT ('x' || substr(md5($1), 1, 16))::bit(64)::bigint AS lock_id`, [jobId]
    );
    const lockId = lockResult.rows[0].lock_id;

    // Acquire with retry + exponential backoff (max 5 attempts)
    await acquireAdvisoryLock(client, lockId);

    const countResult = await client.query(
      `SELECT COUNT(*) FROM applicants WHERE job_id = $1 AND status = 'active'`, [jobId]
    );
    const activeCount = parseInt(countResult.rows[0].count);

    const jobResult = await client.query(
      `SELECT active_capacity FROM jobs WHERE id = $1 AND is_open = TRUE`, [jobId]
    );
    if (!jobResult.rows[0]) throw new NotFoundError('Job not found or closed');

    const capacity = jobResult.rows[0].active_capacity;

    const dupCheck = await client.query(
      `SELECT id FROM applicants WHERE job_id = $1 AND email = $2`, [jobId, email]
    );
    if (dupCheck.rows.length > 0) throw new ConflictError('You have already applied for this job');

    let status, waitlistPosition;
    if (activeCount < capacity) {
      status = 'active';
      waitlistPosition = null;
    } else {
      status = 'waitlisted';
      const posResult = await client.query(
        `SELECT COALESCE(MAX(waitlist_position), 0) + 1 AS next_pos FROM applicants WHERE job_id = $1 AND status = 'waitlisted'`,
        [jobId]
      );
      waitlistPosition = posResult.rows[0].next_pos;
    }

    const insertResult = await client.query(
      `INSERT INTO applicants (job_id, name, email, status, waitlist_position) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [jobId, name, email, status, waitlistPosition]
    );
    const applicant = insertResult.rows[0];

    await logEvent({
      client,
      applicantId: applicant.id,
      jobId,
      event: 'applied',
      oldStatus: null,
      newStatus: status,
      newPosition: waitlistPosition
    });

    await client.query('COMMIT');
    return applicant;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Exits an active applicant and promotes the next waitlisted person
async function exitApplicant(applicantId, reason) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      `SELECT * FROM applicants WHERE id = $1 AND status = 'active'`, [applicantId]
    );
    if (!result.rows[0]) throw new NotFoundError('Applicant not found or not active');

    const applicant = result.rows[0];

    await client.query(
      `UPDATE applicants SET status = $1, updated_at = NOW() WHERE id = $2`, [reason, applicantId]
    );

    await logEvent({ client, applicantId, jobId: applicant.job_id, event: reason, oldStatus: 'active', newStatus: reason });
    await promoteNext(client, applicant.job_id);

    await client.query('COMMIT');
    return { success: true };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Acknowledges promotion — transitions from pending_acknowledgment to active
async function acknowledgePromotion(applicantId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      `SELECT * FROM applicants WHERE id = $1 AND status = 'pending_acknowledgment'`, [applicantId]
    );
    if (!result.rows[0]) throw new NotFoundError('No pending acknowledgment found');

    const applicant = result.rows[0];
    if (new Date() > new Date(applicant.acknowledge_deadline)) {
      throw new GoneError('Acknowledgment window has expired');
    }

    await client.query(
      `UPDATE applicants SET status = 'active', acknowledge_deadline = NULL, updated_at = NOW() WHERE id = $1`,
      [applicantId]
    );

    await logEvent({
      client,
      applicantId,
      jobId: applicant.job_id,
      event: 'acknowledged',
      oldStatus: 'pending_acknowledgment',
      newStatus: 'active'
    });

    await client.query('COMMIT');
    return { success: true };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  applyForJob,
  exitApplicant,
  acknowledgePromotion,
  promoteNext,
  logEvent,
  getApplicantStatus,
  getApplicantLog
};
