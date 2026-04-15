const router = require('express').Router();
const pool = require('../db');
const { ValidationError, NotFoundError, ConflictError } = require('../utils/AppError');

// POST /api/companies — create a company
router.post('/', async (req, res, next) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      throw new ValidationError('name and email are required');
    }

    const result = await pool.query(
      `INSERT INTO companies (name, email) VALUES ($1, $2) RETURNING *`,
      [name, email]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    // Remap DB unique constraint violation to typed ConflictError
    if (err.code === '23505') return next(new ConflictError('Email already registered'));
    next(err);
  }
});

// GET /api/companies/:id
router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(`SELECT * FROM companies WHERE id = $1`, [req.params.id]);
    if (!result.rows[0]) throw new NotFoundError('Company not found');
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

module.exports = router;
