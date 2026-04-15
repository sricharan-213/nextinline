/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/backend/__tests__'],
  testMatch: ['**/*.test.js'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['backend/**/*.js', '!backend/server.js'],
  setupFilesAfterEnv: ['<rootDir>/backend/testSetup.js']
};
