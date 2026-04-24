/**
 * Dedicated configuration module — centralizes environment variable access.
 * All modules import from here instead of accessing process.env directly,
 * making dependencies explicit and testable.
 */
const config = {
  databaseUrl: process.env.DATABASE_URL,
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'nextinline_secret_2024',
  maxLockRetries: parseInt(process.env.MAX_LOCK_RETRIES, 10) || 5,
  initialLockDelay: parseInt(process.env.INITIAL_LOCK_DELAY, 10) || 100
};

module.exports = config;
