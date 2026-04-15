const pool = require('../db');
const { promoteNext, logEvent } = require('./pipelineService');

// Runs every 30 seconds. No external libraries.
// Finds expired pending_acknowledgment applicants, penalizes and re-queues them, then cascades promotions.
async function checkDecay() {
  const client = await pool.connect();
  try {
    // Find all expired pending acknowledgments
    const expired = await client.query(
      `SELECT a.*, j.decay_penalty
       FROM applicants a
       JOIN jobs j ON j.id = a.job_id
       WHERE a.status = 'pending_acknowledgment'
         AND a.acknowledge_deadline < NOW()`
    );

    if (expired.rows.length === 0) return;

    console.log(`[DecayService] Found ${expired.rows.length} expired acknowledgment(s)`);

    for (const applicant of expired.rows) {
      await client.query('BEGIN');
      try {
        // Find the current max waitlist position for this job
        const maxPosResult = await client.query(
          `SELECT COALESCE(MAX(waitlist_position), 0) AS max_pos
           FROM applicants
           WHERE job_id = $1 AND status = 'waitlisted'`,
          [applicant.job_id]
        );
        const penalizedPosition = maxPosResult.rows[0].max_pos + applicant.decay_penalty;

        // Send them back to waitlist at penalized position
        await client.query(
          `UPDATE applicants
           SET status = 'waitlisted',
               waitlist_position = $1,
               acknowledge_deadline = NULL,
               promoted_at = NULL,
               updated_at = NOW()
           WHERE id = $2`,
          [penalizedPosition, applicant.id]
        );

        await logEvent(client, {
          applicantId: applicant.id,
          jobId: applicant.job_id,
          event: 'decayed',
          oldStatus: 'pending_acknowledgment',
          newStatus: 'waitlisted',
          oldPosition: null,
          newPosition: penalizedPosition,
          metadata: { reason: 'acknowledgment_window_expired', penalty: applicant.decay_penalty }
        });

        // This triggers the cascade — promotes the next person, who may also decay later
        await promoteNext(client, applicant.job_id);

        await client.query('COMMIT');
        console.log(`[DecayService] Applicant ${applicant.id} decayed to position ${penalizedPosition}, next person promoted`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[DecayService] Error processing applicant ${applicant.id}:`, err.message);
      }
    }
  } finally {
    client.release();
  }
}

function startDecayChecker() {
  console.log('[DecayService] Started — checking every 30 seconds');
  setInterval(checkDecay, 30 * 1000);
  // Also run immediately on startup to catch any missed decays
  checkDecay();
}

module.exports = { startDecayChecker };
