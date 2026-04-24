const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'nextinline_secret_2024';

async function adminLogin(email, password) {
  const result = await pool.query(
    `SELECT a.*, c.name as company_name 
     FROM admin_users a 
     JOIN companies c ON c.id = a.company_id 
     WHERE a.email = $1`,
    [email]
  );
  
  const admin = result.rows[0];
  if (!admin) throw Object.assign(new Error('Invalid email or password'), { status: 401 });

  const valid = await bcrypt.compare(password, admin.password_hash);
  if (!valid) throw Object.assign(new Error('Invalid email or password'), { status: 401 });

  const token = jwt.sign(
    { adminId: admin.id, email: admin.email, company_id: admin.company_id, role: 'admin' },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  return {
    token,
    admin: {
      id: admin.id,
      email: admin.email,
      company_name: admin.company_name,
      company_id: admin.company_id
    }
  };
}

module.exports = { adminLogin };
