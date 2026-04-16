const router = require('express').Router();
const { ValidationError } = require('../utils/AppError');
const { createJob, getJobById, getPipelineState, getAuditLog, getAllJobs } = require('../services/jobService');

// GET /api/jobs
router.get('/', async (req, res, next) => {
  try {
    const jobs = await getAllJobs();
    res.json(jobs);
  } catch (err) { next(err); }
});

// POST /api/jobs
router.post('/', async (req, res, next) => {
  try {
    const { company_id, title, active_capacity, acknowledge_window_minutes, decay_penalty } = req.body;
    if (!company_id || !title || !active_capacity) {
      throw new ValidationError('company_id, title, and active_capacity are required');
    }
    const job = await createJob({ company_id, title, active_capacity, acknowledge_window_minutes, decay_penalty });
    res.status(201).json(job);
  } catch (err) { next(err); }
});

// GET /api/jobs/:id
router.get('/:id', async (req, res, next) => {
  try {
    const job = await getJobById(req.params.id);
    res.json(job);
  } catch (err) { next(err); }
});

// GET /api/jobs/:id/pipeline
router.get('/:id/pipeline', async (req, res, next) => {
  try {
    const pipeline = await getPipelineState(req.params.id);
    res.json(pipeline);
  } catch (err) { next(err); }
});

// GET /api/jobs/:id/audit
router.get('/:id/audit', async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const log = await getAuditLog(req.params.id, page, limit);
    res.json(log);
  } catch (err) { next(err); }
});

module.exports = router;
