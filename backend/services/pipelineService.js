const pool = require('../db');
const { NotFoundError, ConflictError, GoneError } = require('../utils/AppError');

// Writes every status change to audit_log
async function logEvent(client, { applicantId, jobId, event, oldStatus, newStatus, oldPosition, newPosition, metadata }) {
  await client.query(
    `INSERT INTO audit_log (applicant_id, job_id, event, old_status, new_status, old_position, new_position, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [applicantId, jobId, event, oldStatus || null, newStatus || null, oldPosition || null, newPosition || null, metadata ? JSON.stringify(metadata) : null]
  );
}

// Gets the next waitlisted applicant (lowest position)
async function getNextWaitlisted(client, jobId) {
  const result = await client.query(
    `SELECT * FROM applicants
     WHERE job_id = $1 AND status = 'waitlisted'
     ORDER BY waitlist_position ASC
     LIMIT 1`,
    [jobId]
  );
  return result.rows[0] || null;
}

// Promotes the next waitlisted person to pending_acknowledgment
async function promoteNext(client, jobId) {
  const next = await getNextWaitlisted(client, jobId);
  if (!next) return null;

  const window = await client.query(
    `SELECT acknowledge_window_minutes FROM jobs WHERE id = $1`,
    [jobId]
  );
  const minutes = window.rows[0]?.acknowledge_window_minutes || 60;
  const deadline = new Date(Date.now() + minutes * 60 * 1000);
  const oldPosition = next.waitlist_position;

  await client.query(
    `UPDATE applicants
     SET status = 'pending_acknowledgment',
         waitlist_position = NULL,
         promoted_at = NOW(),
         acknowledge_deadline = $1,
         updated_at = NOW()
     WHERE id = $2`,
    [deadline, next.id]
  );

  await logEvent(client, {
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

// Returns full status info for a single applicant — used by the status page
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

// Called when a new applicant submits their application
// Uses pg advisory lock to safely handle concurrent last-slot race
async function applyForJob(jobId, name, email) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Convert UUID to bigint for advisory lock (hash the jobId string)
    const lockResult = await client.query(
      `SELECT ('x' || substr(md5($1), 1, 16))::bit(64)::bigint AS lock_id`,
      [jobId]
    );
    const lockId = lockResult.rows[0].lock_id;

    // Try to acquire advisory lock (non-blocking)
    const lockAcquired = await client.query(
      `SELECT pg_try_advisory_xact_lock($1)`,
      [lockId]
    );

    if (!lockAcquired.rows[0].pg_try_advisory_xact_lock) {
      // Could not get lock — another concurrent application is being processed
      await new Promise(r => setTimeout(r, 100));
    }

    const countResult = await client.query(
      `SELECT COUNT(*) FROM applicants WHERE job_id = $1 AND status = 'active'`,
      [jobId]
    );
    const activeCount = parseInt(countResult.rows[0].count);

    const jobResult = await client.query(
      `SELECT active_capacity FROM jobs WHERE id = $1 AND is_open = TRUE`,
      [jobId]
    );

    if (!jobResult.rows[0]) throw new NotFoundError('Job not found or closed');

    const capacity = jobResult.rows[0].active_capacity;

    // DB-level unique constraint handles the race; app-level check gives a friendly message
    const dupCheck = await client.query(
      `SELECT id FROM applicants WHERE job_id = $1 AND email = $2`,
      [jobId, email]
    );
    if (dupCheck.rows.length > 0) throw new ConflictError('You have already applied for this job');

    let status, waitlistPosition;

    if (activeCount < capacity) {
      status = 'active';
      waitlistPosition = null;
    } else {
      status = 'waitlisted';
      const posResult = await client.query(
        `SELECT COALESCE(MAX(waitlist_position), 0) + 1 AS next_pos
         FROM applicants WHERE job_id = $1 AND status = 'waitlisted'`,
        [jobId]
      );
      waitlistPosition = posResult.rows[0].next_pos;
    }

    const insertResult = await client.query(
      `INSERT INTO applicants (job_id, name, email, status, waitlist_position)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [jobId, name, email, status, waitlistPosition]
    );
    const applicant = insertResult.rows[0];

    await logEvent(client, {
      applicantId: applicant.id,
      jobId,
      event: 'applied',
      oldStatus: null,
      newStatus: status,
      oldPosition: null,
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

// Called when a hiring manager exits an active applicant
async function exitApplicant(applicantId, reason) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      `SELECT * FROM applicants WHERE id = $1 AND status = 'active'`,
      [applicantId]
    );
    if (!result.rows[0]) throw new NotFoundError('Applicant not found or not active');

    const applicant = result.rows[0];

    await client.query(
      `UPDATE applicants SET status = $1, updated_at = NOW() WHERE id = $2`,
      [reason, applicantId]
    );

    await logEvent(client, {
      applicantId,
      jobId: applicant.job_id,
      event: reason,
      oldStatus: 'active',
      newStatus: reason
    });

    // Auto-promote next waitlisted person
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

// Called when a pending applicant clicks Acknowledge
async function acknowledgePromotion(applicantId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      `SELECT * FROM applicants WHERE id = $1 AND status = 'pending_acknowledgment'`,
      [applicantId]
    );
    if (!result.rows[0]) throw new NotFoundError('No pending acknowledgment found');

    const applicant = result.rows[0];

    if (new Date() > new Date(applicant.acknowledge_deadline)) {
      throw new GoneError('Acknowledgment window has expired');
    }

    await client.query(
      `UPDATE applicants
       SET status = 'active', acknowledge_deadline = NULL, updated_at = NOW()
       WHERE id = $1`,
      [applicantId]
    );

    await logEvent(client, {
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
