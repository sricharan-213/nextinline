const pool = require('../db');
const { NotFoundError, ConflictError, ValidationError } = require('../utils/AppError');

/**
 * Creates a new job posting.
 */
async function createJob({ company_id, title, active_capacity, acknowledge_window_minutes = 60, decay_penalty = 10 }) {
  const result = await pool.query(
    `INSERT INTO jobs (company_id, title, active_capacity, acknowledge_window_minutes, decay_penalty)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [company_id, title, active_capacity, acknowledge_window_minutes, decay_penalty]
  );
  return result.rows[0];
}

/**
 * Fetches a single job by ID.
 * @throws {NotFoundError} if job does not exist
 */
async function getJobById(id) {
  const result = await pool.query(`SELECT * FROM jobs WHERE id = $1`, [id]);
  if (!result.rows[0]) throw new NotFoundError('Job not found');
  return result.rows[0];
}

/**
 * Returns full live pipeline state for a job — active, pending, waitlist, and counts.
 * @throws {NotFoundError} if job does not exist
 */
async function getPipelineState(id) {
  const jobResult = await pool.query(`SELECT * FROM jobs WHERE id = $1`, [id]);
  if (!jobResult.rows[0]) throw new NotFoundError('Job not found');

  const [active, pending, waitlist] = await Promise.all([
    pool.query(`SELECT * FROM applicants WHERE job_id = $1 AND status = 'active' ORDER BY updated_at ASC`, [id]),
    pool.query(`SELECT * FROM applicants WHERE job_id = $1 AND status = 'pending_acknowledgment' ORDER BY promoted_at ASC`, [id]),
    pool.query(`SELECT * FROM applicants WHERE job_id = $1 AND status = 'waitlisted' ORDER BY waitlist_position ASC`, [id])
  ]);

  return {
    job: jobResult.rows[0],
    active: active.rows,
    pending_acknowledgment: pending.rows,
    waitlist: waitlist.rows,
    counts: {
      active: active.rows.length,
      pending: pending.rows.length,
      waitlisted: waitlist.rows.length,
      capacity: jobResult.rows[0].active_capacity
    }
  };
}

/**
 * Returns paginated audit log for a job with applicant details joined.
 */
async function getAuditLog(id, page = 1, limit = 50) {
  const offset = (page - 1) * limit;
  const result = await pool.query(
    `SELECT al.*, a.name as applicant_name, a.email as applicant_email
     FROM audit_log al
     LEFT JOIN applicants a ON a.id = al.applicant_id
     WHERE al.job_id = $1
     ORDER BY al.created_at DESC
     LIMIT $2 OFFSET $3`,
    [id, limit, offset]
  );
  return result.rows;
}

/**
 * Returns all jobs.
 */
async function getAllJobs() {
  const result = await pool.query(`SELECT * FROM jobs ORDER BY created_at DESC`);
  return result.rows;
}

module.exports = { createJob, getJobById, getPipelineState, getAuditLog, getAllJobs };
