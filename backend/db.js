const { Pool } = require('pg');
// dotenv is loaded once in server.js (entry point) — no need to re-load here
// Configuration is imported explicitly from the config module
const { databaseUrl } = require('./config');

const pool = new Pool({ connectionString: databaseUrl });

// Structured pool-level error logging — prevents silent crashes
pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', {
    message: err.message,
    code: err.code || 'UNKNOWN',
    timestamp: new Date().toISOString()
  });
  // Allow graceful shutdown rather than abrupt process exit
  process.exitCode = 1;
});

module.exports = pool;
