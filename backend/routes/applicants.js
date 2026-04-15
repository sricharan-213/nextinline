const router = require('express').Router();
const pool = require('../db');
const { applyForJob, exitApplicant, acknowledgePromotion } = require('../services/pipelineService');

// POST /api/applicants — submit application
router.post('/', async (req, res, next) => {
  try {
    const { job_id, name, email } = req.body;
    if (!job_id || !name || !email) return res.status(400).json({ error: 'job_id, name, email required' });

    const applicant = await applyForJob(job_id, name, email);
    res.status(201).json(applicant);
  } catch (err) { next(err); }
});

// GET /api/applicants/:id/status
router.get('/:id/status', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, status, waitlist_position, acknowledge_deadline, applied_at, updated_at
       FROM applicants WHERE id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Applicant not found' });
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

// POST /api/applicants/:id/exit
router.post('/:id/exit', async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!['withdrawn', 'rejected', 'hired'].includes(reason)) {
      return res.status(400).json({ error: 'reason must be withdrawn, rejected, or hired' });
    }
    const result = await exitApplicant(req.params.id, reason);
    res.json(result);
  } catch (err) { next(err); }
});

// GET /api/applicants/:id/log
router.get('/:id/log', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT * FROM audit_log WHERE applicant_id = $1 ORDER BY created_at ASC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

module.exports = router;
