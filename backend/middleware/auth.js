const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');

function requireAdmin(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Admin access required' });
  }
  
  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, jwtSecret);
    if (payload.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin role required' });
    }
    req.admin = payload;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    res.status(401).json({ error: 'Authentication failed' });
  }
}

function requireApplicant(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Applicant token required' });
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, jwtSecret);
    if (!payload.email) return res.status(401).json({ error: 'Invalid token payload' });
    req.applicant = payload; // { email, name }
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Applicant session expired' });
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid applicant token' });
    }
    res.status(401).json({ error: 'Applicant authentication failed' });
  }
}

module.exports = { requireAdmin, requireApplicant };
