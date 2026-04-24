const { AppError } = require('../utils/AppError');

module.exports = (err, req, res, next) => {
  // Known application errors — use their built-in status & message
  if (err instanceof AppError || err.status) {
    return res.status(err.status || 400).json({ error: err.message });
  }

  // PostgreSQL unique constraint violation (e.g. duplicate email per job)
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Duplicate entry — resource already exists' });
  }

  // Unexpected errors — log full stack, return generic message
  console.error(`[${new Date().toISOString()}] Unhandled error:`, err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
};
