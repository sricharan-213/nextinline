const router = require('express').Router();
const { adminLogin } = require('../services/authService');

// POST /api/auth/login — admin only
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const result = await adminLogin(email, password);
    res.json(result);
  } catch (err) { next(err); }
});

module.exports = router;
