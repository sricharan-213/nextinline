const router = require('express').Router();
const { ValidationError } = require('../utils/AppError');
const {
  applyForJob,
  exitApplicant,
  acknowledgePromotion,
  getApplicantStatus,
  getApplicantLog
} = require('../services/pipelineService');

// POST /api/applicants/apply — submit application
router.post('/apply', async (req, res, next) => {
  try {
    const { job_id, name, email } = req.body;
    if (!job_id || !name || !email) {
      throw new ValidationError('job_id, name, and email are required');
    }
    const applicant = await applyForJob(job_id, name, email);
    res.status(201).json(applicant);
  } catch (err) { next(err); }
});

// GET /api/applicants/:id/status — delegate to service layer
router.get('/:id/status', async (req, res, next) => {
  try {
    const data = await getApplicantStatus(req.params.id);
    res.json(data);
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
      throw new ValidationError('reason must be one of: withdrawn, rejected, hired');
    }
    const result = await exitApplicant(req.params.id, reason);
    res.json(result);
  } catch (err) { next(err); }
});

// GET /api/applicants/:id/log — delegate to service layer
router.get('/:id/log', async (req, res, next) => {
  try {
    const log = await getApplicantLog(req.params.id);
    res.json(log);
  } catch (err) { next(err); }
});

module.exports = router;
