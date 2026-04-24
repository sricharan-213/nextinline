const router = require('express').Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { requireAdmin, requireApplicant } = require('../middleware/auth');
const { applyForJob, exitApplicant, acknowledgePromotion } = require('../services/pipelineService');
const { jwtSecret } = require('../config');

// Schemas
const identifySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email format")
});

const applySchema = z.object({
  job_id: z.string().uuid("Invalid job ID format")
});

const exitSchema = z.object({
  reason: z.enum(['rejected', 'hired', 'withdrawn'])
});

// POST /api/applicants/identify
router.post('/identify', async (req, res, next) => {
  try {
    const { name, email } = identifySchema.parse(req.body);

    const trimmedEmail = email.toLowerCase().trim();
    const trimmedName = name.trim();

    let profile = await pool.query('SELECT * FROM applicant_profiles WHERE email = $1', [trimmedEmail]);
    
    if (profile.rows.length === 0) {
      const inserted = await pool.query(
        'INSERT INTO applicant_profiles (name, email) VALUES ($1, $2) RETURNING *',
        [trimmedName, trimmedEmail]
      );
      profile = inserted;
    }

    const token = jwt.sign(
      { email: profile.rows[0].email, name: profile.rows[0].name },
      jwtSecret,
      { expiresIn: '24d' }
    );

    res.json({ token, name: profile.rows[0].name, email: profile.rows[0].email });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    next(err);
  }
});

// GET /api/applicants/my-applications
router.get('/my-applications', requireApplicant, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT a.id as applicant_id, a.status, a.waitlist_position, a.acknowledge_deadline, a.applied_at,
              j.title as job_title, j.id as job_id, c.name as company_name
       FROM applicants a
       JOIN jobs j ON j.id = a.job_id
       JOIN companies c ON c.id = j.company_id
       WHERE a.email = $1
       ORDER BY a.applied_at DESC`,
      [req.applicant.email]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

// POST /api/applicants/apply
router.post('/apply', requireApplicant, async (req, res, next) => {
  try {
    const { job_id } = applySchema.parse(req.body);
    const { name, email } = req.applicant;
    
    const applicant = await applyForJob(job_id, name, email);
    res.status(201).json(applicant);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    next(err);
  }
});

// GET /api/applicants/:id/status
router.get('/:id/status', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT a.id, a.name, a.email, a.status, a.waitlist_position, 
              a.acknowledge_deadline, a.applied_at, a.updated_at,
              j.title as job_title
       FROM applicants a
       JOIN jobs j ON j.id = a.job_id
       WHERE a.id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Application not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// POST /api/applicants/:id/acknowledge
router.post('/:id/acknowledge', async (req, res, next) => {
  try {
    const result = await acknowledgePromotion(req.params.id);
    res.json(result);
  } catch (err) { next(err); }
});

// POST /api/applicants/:id/withdraw
router.post('/:id/withdraw', requireApplicant, async (req, res, next) => {
  try {
    const check = await pool.query(
      `SELECT * FROM applicants WHERE id = $1`,
      [req.params.id]
    );
    if (!check.rows[0]) return res.status(404).json({ error: 'Application not found' });
    
    const app = check.rows[0];
    if (app.email !== req.applicant.email) {
      return res.status(403).json({ error: 'You do not have permission to withdraw this application' });
    }

    if (['withdrawn', 'rejected', 'hired'].includes(app.status)) {
      return res.status(400).json({ error: 'Application is already closed' });
    }
    await exitApplicant(req.params.id, 'withdrawn');
    res.json({ success: true, message: 'Application withdrawn successfully' });
  } catch (err) { next(err); }
});

// POST /api/applicants/:id/exit (ADMIN)
router.post('/:id/exit', requireAdmin, async (req, res, next) => {
  try {
    const { reason } = exitSchema.parse(req.body);
    const result = await exitApplicant(req.params.id, reason);
    res.json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    next(err);
  }
});

module.exports = router;
