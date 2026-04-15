const router = require('express').Router();
const pool = require('../db');

// POST /api/jobs
router.post('/', async (req, res, next) => {
  try {
    const { company_id, title, active_capacity, acknowledge_window_minutes, decay_penalty } = req.body;
    if (!company_id || !title || !active_capacity) return res.status(400).json({ error: 'company_id, title, active_capacity required' });

    const result = await pool.query(
      `INSERT INTO jobs (company_id, title, active_capacity, acknowledge_window_minutes, decay_penalty)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [company_id, title, active_capacity, acknowledge_window_minutes || 60, decay_penalty || 10]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// GET /api/jobs/:id
router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(`SELECT * FROM jobs WHERE id = $1`, [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Job not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// GET /api/jobs/:id/pipeline — full live pipeline state
router.get('/:id/pipeline', async (req, res, next) => {
  try {
    const { id } = req.params;

    const job = await pool.query(`SELECT * FROM jobs WHERE id = $1`, [id]);
    if (!job.rows[0]) return res.status(404).json({ error: 'Job not found' });

    const active = await pool.query(
      `SELECT * FROM applicants WHERE job_id = $1 AND status = 'active' ORDER BY updated_at ASC`, [id]
    );
    const pending = await pool.query(
      `SELECT * FROM applicants WHERE job_id = $1 AND status = 'pending_acknowledgment' ORDER BY promoted_at ASC`, [id]
    );
    const waitlist = await pool.query(
      `SELECT * FROM applicants WHERE job_id = $1 AND status = 'waitlisted' ORDER BY waitlist_position ASC`, [id]
    );

    res.json({
      job: job.rows[0],
      active: active.rows,
      pending_acknowledgment: pending.rows,
      waitlist: waitlist.rows,
      counts: {
        active: active.rows.length,
        pending: pending.rows.length,
        waitlisted: waitlist.rows.length,
        capacity: job.rows[0].active_capacity
      }
    });
  } catch (err) { next(err); }
});

// GET /api/jobs/:id/audit — full audit log
router.get('/:id/audit', async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT al.*, a.name as applicant_name, a.email as applicant_email
       FROM audit_log al
       LEFT JOIN applicants a ON a.id = al.applicant_id
       WHERE al.job_id = $1
       ORDER BY al.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.params.id, limit, offset]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

module.exports = router;
