const router = require('express').Router();
const pool = require('../db');

// POST /api/companies — create a company
router.post('/', async (req, res, next) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'name and email required' });

    const result = await pool.query(
      `INSERT INTO companies (name, email) VALUES ($1, $2) RETURNING *`,
      [name, email]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already registered' });
    next(err);
  }
});

// GET /api/companies/:id
router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(`SELECT * FROM companies WHERE id = $1`, [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Company not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

module.exports = router;
