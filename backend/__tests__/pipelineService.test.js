/**
 * Unit tests for pipelineService.js
 * The database pool is fully mocked — no real DB connection needed.
 */

jest.mock('../db');

const pool = require('../db');
const { NotFoundError, ConflictError, GoneError } = require('../utils/AppError');

/**
 * Builds a mock pg client that skips transaction control statements
 * (BEGIN, COMMIT, ROLLBACK) and feeds real query responses in order.
 */
function makeMockClient(queryResponses = []) {
  let callIndex = 0;
  const CONTROL = new Set(['BEGIN', 'COMMIT', 'ROLLBACK']);
  return {
    query: jest.fn(async (sql) => {
      if (CONTROL.has(sql)) return { rows: [] };
      const response = queryResponses[callIndex++];
      if (response instanceof Error) throw response;
      return response ?? { rows: [] };
    }),
    release: jest.fn()
  };
}

const {
  applyForJob,
  exitApplicant,
  acknowledgePromotion,
  getApplicantStatus,
  getApplicantLog
} = require('../services/pipelineService');

afterEach(() => jest.clearAllMocks());

// ─── getApplicantStatus ───────────────────────────────────────────────────────

describe('getApplicantStatus', () => {
  test('returns applicant data when found', async () => {
    const mockApplicant = {
      id: 'uuid-1', name: 'Alice', email: 'alice@test.com',
      status: 'active', waitlist_position: null
    };
    pool.query = jest.fn().mockResolvedValue({ rows: [mockApplicant] });

    const result = await getApplicantStatus('uuid-1');
    expect(result).toEqual(mockApplicant);
    expect(pool.query).toHaveBeenCalledWith(expect.stringMatching(/SELECT[\s\S]*FROM applicants/), ['uuid-1']);
    expect(result.name).toBe('Alice');
  });

  test('throws NotFoundError when applicant does not exist', async () => {
    pool.query = jest.fn().mockResolvedValue({ rows: [] });
    await expect(getApplicantStatus('bad-id')).rejects.toThrow(NotFoundError);
    expect(pool.query).toHaveBeenCalledWith(expect.any(String), ['bad-id']);
    try {
      await getApplicantStatus('bad-id');
    } catch (e) {
      expect(e.status).toBe(404);
    }
  });

  test('NotFoundError has status 404', async () => {
    pool.query = jest.fn().mockResolvedValue({ rows: [] });
    try {
      await getApplicantStatus('bad-id');
    } catch (e) {
      expect(e.status).toBe(404);
    }
  });
});

// ─── getApplicantLog ──────────────────────────────────────────────────────────

describe('getApplicantLog', () => {
  test('returns empty array when no events exist', async () => {
    pool.query = jest.fn().mockResolvedValue({ rows: [] });
    const result = await getApplicantLog('uuid-1');
    expect(result).toEqual([]);
  });

  test('returns audit events in order', async () => {
    const events = [{ id: 'e1', event: 'applied' }, { id: 'e2', event: 'promoted' }];
    pool.query = jest.fn().mockResolvedValue({ rows: events });
    const result = await getApplicantLog('uuid-1');
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
    expect(result[0].event).toBe('applied');
    expect(pool.query).toHaveBeenCalledWith(expect.stringMatching(/FROM audit_log/), ['uuid-1']);
  });
});

// ─── applyForJob ─────────────────────────────────────────────────────────────

describe('applyForJob', () => {
  /**
   * applyForJob real query order (after BEGIN skipped):
   * 1. lock hash  → { rows: [{ lock_id: 1 }] }
   * 2. advisory lock → { rows: [{ pg_try_advisory_xact_lock: true }] }
   * 3. active count → { rows: [{ count: '0' }] }
   * 4. job lookup → { rows: [{ active_capacity: 3 }] }
   * 5. dup check → { rows: [] }
   * 6. INSERT → { rows: [{ id: 'a1', status: 'active', waitlist_position: null }] }
   * 7. logEvent INSERT → { rows: [] }
   */
  function makeActiveClient() {
    return makeMockClient([
      { rows: [{ lock_id: 1 }] },
      { rows: [{ pg_try_advisory_xact_lock: true }] },
      { rows: [{ count: '0' }] },
      { rows: [{ active_capacity: 3 }] },
      { rows: [] },
      { rows: [{ id: 'a1', status: 'active', waitlist_position: null }] },
      { rows: [] }
    ]);
  }

  test('places applicant as active when capacity available', async () => {
    const client = makeActiveClient();
    pool.connect = jest.fn().mockResolvedValue(client);

    const result = await applyForJob('job-1', 'Alice', 'alice@test.com');
    expect(result).toHaveProperty('id', 'a1');
    expect(result.status).toBe('active');
    expect(client.query).toHaveBeenCalledWith('COMMIT');
    expect(client.query).toHaveBeenCalledWith(expect.stringMatching(/INSERT INTO applicants/), expect.anything());
    expect(client.release).toHaveBeenCalled();
  });

  test('throws NotFoundError when job does not exist', async () => {
    const client = makeMockClient([
      { rows: [{ lock_id: 1 }] },
      { rows: [{ pg_try_advisory_xact_lock: true }] },
      { rows: [{ count: '0' }] },
      { rows: [] }                   // job not found
    ]);
    pool.connect = jest.fn().mockResolvedValue(client);

    await expect(applyForJob('bad-job', 'Bob', 'b@b.com')).rejects.toThrow(NotFoundError);
    expect(client.query).toHaveBeenCalledWith('ROLLBACK');
    expect(client.query).toHaveBeenCalledWith(expect.stringMatching(/FROM jobs/), expect.arrayContaining(['bad-job']));
    expect(client.release).toHaveBeenCalled();
  });

  test('throws ConflictError on duplicate email', async () => {
    const client = makeMockClient([
      { rows: [{ lock_id: 1 }] },
      { rows: [{ pg_try_advisory_xact_lock: true }] },
      { rows: [{ count: '0' }] },
      { rows: [{ active_capacity: 3 }] },
      { rows: [{ id: 'existing' }] }  // duplicate found
    ]);
    pool.connect = jest.fn().mockResolvedValue(client);

    await expect(applyForJob('job-1', 'Alice', 'alice@test.com')).rejects.toThrow(ConflictError);
    expect(client.query).toHaveBeenCalledWith('ROLLBACK');
    expect(client.query).toHaveBeenCalledWith(expect.stringMatching(/FROM applicants[\s\S]*email/), expect.arrayContaining(['job-1', 'alice@test.com']));
  });

  test('places applicant on waitlist when at capacity', async () => {
    /**
     * Extra queries when waitlisted:
     * 5. dup check → { rows: [] }
     * 6. max waitlist pos → { rows: [{ next_pos: 1 }] }
     * 7. INSERT → { rows: [{ id: 'wl', status: 'waitlisted', waitlist_position: 1 }] }
     * 8. logEvent → { rows: [] }
     */
    const client = makeMockClient([
      { rows: [{ lock_id: 1 }] },
      { rows: [{ pg_try_advisory_xact_lock: true }] },
      { rows: [{ count: '3' }] },            // at capacity
      { rows: [{ active_capacity: 3 }] },
      { rows: [] },                           // no duplicate
      { rows: [{ next_pos: 1 }] },           // waitlist position
      { rows: [{ id: 'wl', status: 'waitlisted', waitlist_position: 1 }] },
      { rows: [] }                            // logEvent
    ]);
    pool.connect = jest.fn().mockResolvedValue(client);

    const result = await applyForJob('job-1', 'Carol', 'carol@test.com');
    expect(result.status).toBe('waitlisted');
    expect(result.waitlist_position).toBe(1);
    expect(client.query).toHaveBeenCalledWith(expect.stringMatching(/MAX\(waitlist_position\)/), ['job-1']);
    expect(client.query).toHaveBeenCalledWith('COMMIT');
  });
});

// ─── acknowledgePromotion ─────────────────────────────────────────────────────

describe('acknowledgePromotion', () => {
  test('throws NotFoundError when no pending acknowledgment exists', async () => {
    const client = makeMockClient([{ rows: [] }]);
    pool.connect = jest.fn().mockResolvedValue(client);

    await expect(acknowledgePromotion('bad-id')).rejects.toThrow(NotFoundError);
    expect(client.query).toHaveBeenCalledWith(expect.stringMatching(/FROM applicants/), ['bad-id']);
    expect(client.release).toHaveBeenCalled();
  });

  test('throws GoneError when deadline has passed', async () => {
    const pastDeadline = new Date(Date.now() - 5000).toISOString();
    const client = makeMockClient([
      { rows: [{ id: 'a1', job_id: 'j1', acknowledge_deadline: pastDeadline }] }
    ]);
    pool.connect = jest.fn().mockResolvedValue(client);

    await expect(acknowledgePromotion('a1')).rejects.toThrow(GoneError);
    expect(client.query).toHaveBeenCalledWith('ROLLBACK');
    expect(client.query).toHaveBeenCalledWith(expect.stringMatching(/FROM applicants/), ['a1']);
  });

  test('acknowledges successfully within deadline', async () => {
    const futureDeadline = new Date(Date.now() + 60000).toISOString();
    const client = makeMockClient([
      { rows: [{ id: 'a1', job_id: 'j1', acknowledge_deadline: futureDeadline }] },
      { rows: [] },   // UPDATE
      { rows: [] }    // logEvent INSERT
    ]);
    pool.connect = jest.fn().mockResolvedValue(client);

    const result = await acknowledgePromotion('a1');
    expect(result).toEqual({ success: true });
    expect(client.query).toHaveBeenCalledWith(expect.stringMatching(/UPDATE applicants[\s\S]*SET status = 'active'/), expect.anything());
    expect(client.query).toHaveBeenCalledWith('COMMIT');
    expect(client.release).toHaveBeenCalled();
  });
});

// ─── exitApplicant ────────────────────────────────────────────────────────────

describe('exitApplicant', () => {
  test('throws NotFoundError when applicant is not active', async () => {
    const client = makeMockClient([{ rows: [] }]);
    pool.connect = jest.fn().mockResolvedValue(client);

    await expect(exitApplicant('bad-id', 'hired')).rejects.toThrow(NotFoundError);
    expect(client.query).toHaveBeenCalledWith(expect.stringMatching(/FROM applicants/), expect.arrayContaining(['bad-id']));
    expect(client.release).toHaveBeenCalled();
  });

  test('exits applicant and returns success', async () => {
    /**
     * exitApplicant query order:
     * 1. SELECT applicant → found
     * 2. UPDATE status
     * 3. logEvent INSERT
     * 4. getNextWaitlisted SELECT → empty (no one to promote)
     */
    const client = makeMockClient([
      { rows: [{ id: 'a1', job_id: 'j1', status: 'active' }] },
      { rows: [] },   // UPDATE
      { rows: [] },   // logEvent
      { rows: [] }    // getNextWaitlisted
    ]);
    pool.connect = jest.fn().mockResolvedValue(client);

    const result = await exitApplicant('a1', 'hired');
    expect(result).toEqual({ success: true });
    expect(client.query).toHaveBeenCalledWith(expect.stringMatching(/UPDATE applicants.*status = \$1/), expect.arrayContaining(['hired', 'a1']));
    expect(client.query).toHaveBeenCalledWith('COMMIT');
    expect(client.release).toHaveBeenCalled();
  });
});
