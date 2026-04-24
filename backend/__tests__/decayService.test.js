/**
 * Unit tests for decayService.js
 * DB pool is mocked — validates decay logic without a real database.
 */

jest.mock('../db');
jest.mock('../services/pipelineService', () => ({
  promoteNext: jest.fn().mockResolvedValue(null),
  logEvent: jest.fn().mockResolvedValue(undefined)
}));

const pool = require('../db');
const { promoteNext, logEvent } = require('../services/pipelineService');
const { checkDecay } = require('../services/decayService');

function makeMockClient(queryResponses = []) {
  let callIndex = 0;
  return {
    query: jest.fn(async (sql) => {
      if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') return { rows: [] };
      const response = queryResponses[callIndex++];
      if (response instanceof Error) throw response;
      return response || { rows: [] };
    }),
    release: jest.fn()
  };
}

describe('checkDecay', () => {
  afterEach(() => jest.clearAllMocks());

  test('does nothing when no expired acknowledgments exist', async () => {
    const client = makeMockClient([{ rows: [] }]);
    pool.connect = jest.fn().mockResolvedValue(client);

    await checkDecay();
    expect(promoteNext).not.toHaveBeenCalled();
    expect(logEvent).not.toHaveBeenCalled();
    expect(client.query).toHaveBeenCalledWith(expect.stringMatching(/FROM applicants[\s\S]*WHERE[\s\S]*status = 'pending_acknowledgment'/));
    expect(client.release).toHaveBeenCalled();
  });

  test('re-queues expired applicant at penalized position', async () => {
    const expiredApplicant = {
      id: 'a1',
      job_id: 'j1',
      decay_penalty: 10
    };
    const client = makeMockClient([
      { rows: [expiredApplicant] },          // find expired
      { rows: [{ max_pos: 5 }] },            // max waitlist position = 5
      { rows: [] },                           // UPDATE applicant
      { rows: [] }                            // promoteNext (mocked above)
    ]);
    pool.connect = jest.fn().mockResolvedValue(client);

    await checkDecay();
    // Should have updated the applicant with penalized position (5 + 10 = 15)
    const updateCall = client.query.mock.calls.find(
      call => typeof call[0] === 'string' && call[0].includes('UPDATE applicants')
    );
    expect(updateCall).toBeDefined();
    expect(updateCall[1][0]).toBe(15); 
    expect(updateCall[1][1]).toBe('a1');

    expect(logEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        client,
        applicantId: 'a1',
        jobId: 'j1',
        event: 'decayed',
        newPosition: 15,
        metadata: expect.objectContaining({ penalty: 10 })
      })
    );
    expect(promoteNext).toHaveBeenCalledWith(client, 'j1');
    expect(client.query).toHaveBeenCalledWith('COMMIT');
    expect(client.release).toHaveBeenCalled();
  });

  test('continues processing other applicants if one fails', async () => {
    const applicants = [
      { id: 'a1', job_id: 'j1', decay_penalty: 5 },
      { id: 'a2', job_id: 'j2', decay_penalty: 5 }
    ];

    let queryCount = 0;
    const client = {
      query: jest.fn(async (sql, params) => {
        if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') return { rows: [] };
        queryCount++;
        if (queryCount === 1) return { rows: applicants };   // find expired
        if (queryCount === 2) throw new Error('DB error for a1'); // fail a1
        return { rows: [{ max_pos: 0 }] };                   // max pos for a2
      }),
      release: jest.fn()
    };
    pool.connect = jest.fn().mockResolvedValue(client);

    // Should NOT throw — loop should continue for a2 even if a1 fails
    await expect(checkDecay()).resolves.not.toThrow();
    expect(queryCount).toBeGreaterThan(2); 
    expect(client.release).toHaveBeenCalled();
    expect(promoteNext).toHaveBeenCalledTimes(1); // called once for a2 since a1 failed
  });
});
