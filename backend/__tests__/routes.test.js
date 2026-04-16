const request = require('supertest');
const pool = require('../db');

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

  describe('POST /api/applicants/apply', () => {
    it('should return 201 and applicant data on success', async () => {
      const mockApplicant = { id: 1, name: 'Test User', email: 'test@example.com', job_id: 'j1', status: 'active' };
      
      const mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };
      pool.connect.mockResolvedValue(mockClient);

      // Tracing applyForJob queries:
      // 1. BEGIN (106)
      // 2. GET lock_id (108)
      // 3. Advisory lock check (88)
      // 4. Active count (116)
      // 5. Job capacity check (121)
      // 6. Duplicate email check (128)
      // 7. Insert applicant (146)
      // 8. Log event (152 -> 12)
      // 9. COMMIT (162)

      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // 1
        .mockResolvedValueOnce({ rows: [{ lock_id: '123' }] }) // 2
        .mockResolvedValueOnce({ rows: [{ pg_try_advisory_xact_lock: true }] }) // 3
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // 4
        .mockResolvedValueOnce({ rows: [{ active_capacity: 5, is_open: true }] }) // 5
        .mockResolvedValueOnce({ rows: [] }) // 6
        .mockResolvedValueOnce({ rows: [mockApplicant] }) // 7
        .mockResolvedValueOnce({ rows: [] }) // 8
        .mockResolvedValueOnce({ rows: [] }); // 9

      const res = await request(app)
        .post('/api/applicants/apply')
        .send({ job_id: 'j1', name: 'Test User', email: 'test@example.com' });

      if (res.status !== 201) {
        console.error('POST /apply failed with:', res.body);
      }

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.email).toBe('test@example.com');
      expect(pool.connect).toHaveBeenCalled();
      expect(mockClient.release).toHaveBeenCalled();
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

  describe('GET /api/companies', () => {
    it('should return 200 and a list of companies', async () => {
      const mockCompanies = [{ id: 'c1', name: 'Tech Corp' }];
      pool.query.mockResolvedValueOnce({ rows: mockCompanies });

      const res = await request(app).get('/api/companies');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].name).toBe('Tech Corp');
    });
  });
});
