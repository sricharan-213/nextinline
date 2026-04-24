const request = require('supertest');
const pool = require('../db');
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');

// Mock decayService to prevent background loop from consuming mocks
jest.mock('../services/decayService', () => ({
  startDecayChecker: jest.fn(),
  checkDecay: jest.fn()
}));

jest.mock('../db', () => ({
  query: jest.fn(),
  connect: jest.fn()
}));

const app = require('../server');

describe('Integration Tests — API Routes', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('POST /api/applicants/identify', () => {
    it('should create or find profile and return JWT', async () => {
      const mockProfile = { id: 'p1', name: 'John Doe', email: 'john@test.com' };
      pool.query.mockResolvedValueOnce({ rows: [mockProfile] }); // Find existing

      const res = await request(app)
        .post('/api/applicants/identify')
        .send({ name: 'John Doe', email: 'john@test.com' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.name).toBe('John Doe');
    });

    it('should return 400 for invalid email', async () => {
      const res = await request(app)
        .post('/api/applicants/identify')
        .send({ name: 'J', email: 'not-an-email' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /api/applicants/apply', () => {
    it('should require applicant token', async () => {
      const res = await request(app)
        .post('/api/applicants/apply')
        .send({ job_id: '00000000-0000-0000-0000-000000000001' });

      expect(res.status).toBe(401);
    });

    it('should apply successfully with valid token', async () => {
      const token = jwt.sign({ name: 'John', email: 'john@test.com' }, jwtSecret);
      const mockApplicant = { id: 'a1', status: 'active' };
      
      const mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };
      pool.connect.mockResolvedValue(mockClient);

      // Mock queries for applyForJob
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [{ lock_id: '123' }] }) // Hash
        .mockResolvedValueOnce({ rows: [{ pg_try_advisory_xact_lock: true }] }) // Lock
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // Active count
        .mockResolvedValueOnce({ rows: [{ active_capacity: 5, is_open: true }] }) // Job lookup
        .mockResolvedValueOnce({ rows: [] }) // Dup check
        .mockResolvedValueOnce({ rows: [mockApplicant] }) // Insert
        .mockResolvedValueOnce({ rows: [] }) // Log
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      const res = await request(app)
        .post('/api/applicants/apply')
        .set('Authorization', `Bearer ${token}`)
        .send({ job_id: '00000000-0000-0000-0000-000000000001' });

      expect(res.status).toBe(201);
      expect(res.body.id).toBe('a1');
    });
  });

  describe('GET /api/jobs', () => {
    it('should return 200 and a list of jobs', async () => {
      const mockJobs = [{ id: 'j1', title: 'Software Engineer' }];
      pool.query.mockResolvedValueOnce({ rows: mockJobs });

      const res = await request(app).get('/api/jobs');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].title).toBe('Software Engineer');
    });
  });
});
