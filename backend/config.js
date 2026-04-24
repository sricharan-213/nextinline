/**
 * Dedicated configuration module — centralizes environment variable access.
 * All modules import from here instead of accessing process.env directly,
 * making dependencies explicit and testable.
 */
const config = {
  databaseUrl: process.env.DATABASE_URL,
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'nextinline_secret_2024'
};

module.exports = config;
