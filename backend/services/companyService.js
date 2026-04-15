const pool = require('../db');
const { NotFoundError, ConflictError } = require('../utils/AppError');

/**
 * Creates a new company.
 * @throws {ConflictError} if email already exists
 */
async function createCompany({ name, email }) {
  try {
    const result = await pool.query(
      `INSERT INTO companies (name, email) VALUES ($1, $2) RETURNING *`,
      [name, email]
    );
    return result.rows[0];
  } catch (err) {
    if (err.code === '23505') throw new ConflictError('Email already registered');
    throw err;
  }
}

/**
 * Fetches a company by ID.
 * @throws {NotFoundError} if not found
 */
async function getCompanyById(id) {
  const result = await pool.query(`SELECT * FROM companies WHERE id = $1`, [id]);
  if (!result.rows[0]) throw new NotFoundError('Company not found');
  return result.rows[0];
}

module.exports = { createCompany, getCompanyById };
