const router = require('express').Router();
const pool = require('../db');
const { requireAdmin } = require('../middleware/auth');

// GET /api/jobs — PUBLIC — list all open jobs (for applicants to browse)
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT j.*, c.name as company_name,
        (SELECT COUNT(*) FROM applicants WHERE job_id = j.id AND status = 'active') as active_count,
        (SELECT COUNT(*) FROM applicants WHERE job_id = j.id AND status = 'waitlisted') as waitlist_count
       FROM jobs j
       JOIN companies c ON c.id = j.company_id
       WHERE j.is_open = TRUE
       ORDER BY j.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

// GET /api/jobs/:id — PUBLIC — single job details
router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT j.*, c.name as company_name FROM jobs j
       JOIN companies c ON c.id = j.company_id
       WHERE j.id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Job not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// GET /api/jobs/:id/pipeline — ADMIN ONLY — full pipeline state
router.get('/:id/pipeline', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const job = await pool.query(`SELECT * FROM jobs WHERE id = $1`, [id]);
    if (!job.rows[0]) return res.status(404).json({ error: 'Job not found' });

    const [active, pending, waitlist] = await Promise.all([
      pool.query(`SELECT * FROM applicants WHERE job_id = $1 AND status = 'active' ORDER BY updated_at ASC`, [id]),
      pool.query(`SELECT * FROM applicants WHERE job_id = $1 AND status = 'pending_acknowledgment' ORDER BY promoted_at ASC`, [id]),
      pool.query(`SELECT * FROM applicants WHERE job_id = $1 AND status = 'waitlisted' ORDER BY waitlist_position ASC`, [id])
    ]);

    res.json({
      job: job.rows[0],
      active: active.rows,
      pending_acknowledgment: pending.rows,
      waitlist: waitlist.rows,
      counts: {
        active: active.rows.length,
        pending: pending.rows.length,
        waitlisted: waitlist.rows.length,
        capacity: job.rows[0].active_capacity,
        slots_available: Math.max(0, job.rows[0].active_capacity - active.rows.length)
      }
    });
  } catch (err) { next(err); }
});

// GET /api/jobs/:id/audit — ADMIN ONLY
router.get('/:id/audit', requireAdmin, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT al.*, a.name as applicant_name, a.email as applicant_email
       FROM audit_log al
       LEFT JOIN applicants a ON a.id = al.applicant_id
       WHERE al.job_id = $1
       ORDER BY al.created_at DESC
       LIMIT 100`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

// POST /api/jobs — ADMIN ONLY — create a new job
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const { title, description, active_capacity, acknowledge_window_minutes, decay_penalty } = req.body;
    if (!title || !active_capacity) {
      return res.status(400).json({ error: 'title and active_capacity required' });
    }
    const result = await pool.query(
      `INSERT INTO jobs (company_id, title, description, active_capacity, acknowledge_window_minutes, decay_penalty)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.admin.company_id, title, description || '', active_capacity, acknowledge_window_minutes || 60, decay_penalty || 10]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// PATCH /api/jobs/:id/close — ADMIN ONLY
router.patch('/:id/close', requireAdmin, async (req, res, next) => {
  try {
    const result = await pool.query(
      `UPDATE jobs SET is_open = FALSE WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// GET /api/jobs/admin/all — ADMIN ONLY — all jobs including closed
router.get('/admin/all', requireAdmin, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT j.*,
        (SELECT COUNT(*) FROM applicants WHERE job_id = j.id AND status = 'active') as active_count,
        (SELECT COUNT(*) FROM applicants WHERE job_id = j.id AND status = 'waitlisted') as waitlist_count,
        (SELECT COUNT(*) FROM applicants WHERE job_id = j.id) as total_applicants
       FROM jobs j
       ORDER BY j.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

module.exports = router;
