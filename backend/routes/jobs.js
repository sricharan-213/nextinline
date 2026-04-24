const router = require('express').Router();
const pool = require('../db');
const { z } = require('zod');
const { requireAdmin } = require('../middleware/auth');

// Schemas
const jobSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().optional(),
  active_capacity: z.number().int().min(1).default(3),
  acknowledge_window_minutes: z.number().int().min(1).default(60),
  decay_penalty: z.number().int().min(1).default(5)
});

// GET /api/jobs — PUBLIC — Lists all open jobs with summary counts
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT j.*, 
             (SELECT COUNT(*) FROM applicants WHERE job_id = j.id AND status = 'active') as active_count,
             (SELECT COUNT(*) FROM applicants WHERE job_id = j.id AND status = 'waitlisted') as waitlist_count
      FROM jobs j
      WHERE j.is_open = TRUE
      ORDER BY j.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// GET /api/jobs/admin/all — ADMIN ONLY
router.get('/admin/all', requireAdmin, async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT j.*, 
             (SELECT COUNT(*) FROM applicants WHERE job_id = j.id AND status = 'active') as active_count,
             (SELECT COUNT(*) FROM applicants WHERE job_id = j.id AND status = 'waitlisted') as waitlist_count,
             (SELECT COUNT(*) FROM applicants WHERE job_id = j.id) as total_applicants
      FROM jobs j
      ORDER BY j.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// POST /api/jobs — ADMIN ONLY
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const data = jobSchema.parse(req.body);
    const { title, description, active_capacity, acknowledge_window_minutes, decay_penalty } = data;
    
    // Using the hardcoded company_id from seeding for now
    const company_id = '00000000-0000-0000-0000-000000000001';

    const result = await pool.query(
      `INSERT INTO jobs (company_id, title, description, active_capacity, acknowledge_window_minutes, decay_penalty)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [company_id, title, description, active_capacity, acknowledge_window_minutes, decay_penalty]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    next(err);
  }
});

// GET /api/jobs/:id/pipeline — ADMIN ONLY — Full pipeline state
router.get('/:id/pipeline', requireAdmin, async (req, res, next) => {
  try {
    const job = await pool.query('SELECT * FROM jobs WHERE id = $1', [req.params.id]);
    if (!job.rows[0]) return res.status(404).json({ error: 'Job not found' });

    const applicants = await pool.query(
      `SELECT * FROM applicants WHERE job_id = $1 ORDER BY applied_at ASC`,
      [req.params.id]
    );

    const data = {
      job: job.rows[0],
      active: applicants.rows.filter(a => a.status === 'active'),
      pending_acknowledgment: applicants.rows.filter(a => a.status === 'pending_acknowledgment'),
      waitlist: applicants.rows.filter(a => a.status === 'waitlisted').sort((a, b) => a.waitlist_position - b.waitlist_position),
      counts: {
        active: applicants.rows.filter(a => a.status === 'active').length,
        pending: applicants.rows.filter(a => a.status === 'pending_acknowledgment').length,
        waitlisted: applicants.rows.filter(a => a.status === 'waitlisted').length,
        capacity: job.rows[0].active_capacity
      }
    };
    res.json(data);
  } catch (err) { next(err); }
});

// GET /api/jobs/:id/audit — ADMIN ONLY
router.get('/:id/audit', requireAdmin, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT al.*, a.name as applicant_name, a.email as applicant_email
       FROM audit_log al
       JOIN applicants a ON a.id = al.applicant_id
       WHERE al.job_id = $1
       ORDER BY al.created_at DESC LIMIT 100`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

module.exports = router;
