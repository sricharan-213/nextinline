const router = require('express').Router();
const { ValidationError } = require('../utils/AppError');
const { createCompany, getCompanyById } = require('../services/companyService');

// POST /api/companies
router.post('/', async (req, res, next) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) throw new ValidationError('name and email are required');
    const company = await createCompany({ name, email });
    res.status(201).json(company);
  } catch (err) { next(err); }
});

// GET /api/companies/:id
router.get('/:id', async (req, res, next) => {
  try {
    const company = await getCompanyById(req.params.id);
    res.json(company);
  } catch (err) { next(err); }
});

module.exports = router;
