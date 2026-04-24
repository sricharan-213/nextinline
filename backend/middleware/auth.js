const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'nextinline_secret_2024';

function requireAdmin(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Admin access required' });
  }
  try {
    const payload = jwt.verify(header.split(' ')[1], JWT_SECRET);
    if (payload.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    req.admin = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireApplicant(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Applicant token required' });
  }
  try {
    const payload = jwt.verify(header.split(' ')[1], JWT_SECRET);
    if (!payload.email) return res.status(401).json({ error: 'Invalid token' });
    req.applicant = payload; // { email, name }
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { requireAdmin, requireApplicant };
