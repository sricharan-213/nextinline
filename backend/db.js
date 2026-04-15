const { Pool } = require('pg');
// dotenv is loaded once in server.js (entry point) — no need to re-load here

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.on('error', (err) => {
  console.error('Unexpected DB error', err);
  process.exit(-1);
});

module.exports = pool;
