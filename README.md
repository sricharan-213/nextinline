# ⚡ NextInLine

> **Hiring pipelines that move themselves.**

A full-stack hiring pipeline management tool built with the **PERN stack** (PostgreSQL, Express, React, Node.js). NextInLine automates candidate promotion, acknowledgment windows, and decay penalties — ensuring zero manual intervention for stale pipelines.

---

## ✨ Features

| Feature | Details |
|---|---|
| 🎯 **Active Pipeline** | Fixed-capacity slots with automatic promotion from waitlist |
| ⏱ **Acknowledgment Windows** | Promoted candidates must acknowledge within a configurable window |
| 📉 **Decay Penalties** | Late acknowledgments send candidates back to waitlist at a penalized position |
| 🔐 **Concurrency Guard** | PostgreSQL `pg_advisory_xact_lock` prevents "Last Slot" race conditions |
| 📋 **Full Audit Log** | Every state transition is recorded with timestamps and metadata |
| 🔄 **Auto Cascade** | Decay triggers the next promotion automatically in a self-healing loop |

---

## 🏗 Project Structure

```
nextinline/
├── backend/
│   ├── db.js                      # PostgreSQL pool
│   ├── server.js                  # Express app + server
│   ├── services/
│   │   ├── pipelineService.js     # Core state machine logic
│   │   └── decayService.js        # 30s polling decay checker
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.jsx      # Live pipeline view (10s polling)
│       │   └── Status.jsx         # Candidate status + acknowledge
└── migrations/
    └── init.sql                   # Full DB schema
```

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 2. Setup Database
```bash
createdb nextinline
psql -d nextinline -f migrations/init.sql
```

### 3. Install & Run
**Backend:**
```bash
npm install && npm run dev
```

**Frontend:**
```bash
cd frontend && npm install && npm run dev
```

---

## 🔬 Technical Design Decisions

## 🏗 Architecture & Design Decisions

### 1. The Concurrency Problem: Solving the "Last Slot" Race (Requirement #5)
**The Scenario**: A job has 1 slot left. Two applicants submit at the exact same millisecond.
**The Risk**: Both requests read the database, see `count < capacity`, and both proceed to `INSERT` as `active`. The pipeline is now over-capacity.
**The Solution**: We implement **Transactional Advisory Locks** (`pg_try_advisory_xact_lock`). 
- Instead of locking the whole `applicants` table (which would stop all applications globally), we generate a deterministic lock ID based on the `job_id`.
- The first request to hit the block acquires the lock; the second request is forced to wait or retry using our **exponential backoff** mechanism.
- This ensures that capacity checks and insertions are atomic per job.

### 2. The Decay Algorithm (Requirement #7)
When an applicant is promoted, they enter a `pending_acknowledgment` state. We define a **30-minute window** (configurable per job) for them to respond.
**The Penalty Model**: If they miss the window, they aren't rejected (keeping the system human-centric). Instead, they are moved back to the waitlist.
- **Logic**: `new_position = MAX(waitlist_position) + penalty_buffer`
- **Rationale**: Simply putting them at the back (`MAX`) isn't enough of a deterrent. Adding a `penalty_buffer` creates a "cooling off" period, ensuring that active waitlisted candidates who *are* paying attention get a fair chance to move up even if a decaying candidate has a low original ID.
- **The Cascade**: The `decayService` doesn't just penalize; it immediately triggers `promoteNext()` within the same transaction. This creates a **self-healing cascade** where one person's delay instantly becomes another person's opportunity.

### 3. Frontend Strategy: "Right-Sized" Infrastructure
**Context**: Hiring managers operate at "human speed," not sub-second trading frequency.
**Decision**: We chose **10-second polling** over WebSockets.
- **Why?** WebSockets require persistent connections and often a Pub/Sub layer (like Redis) to scale. Polling is stateless, leverages browser caching efficiently, and significantly reduces backend complexity.
- **Implementation**: The dashboard reflects the live pipeline state within 10 seconds, providing a "live enough" feel without the infrastructure overhead of real-time protocols.

---

## 🔌 API Documentation (Requirement #14)

### Companies
- **POST `/api/companies`**
  - **Input**: `{ "name": "Google", "email": "hr@google.com" }`
  - **Output**: The created company object (201 Created).

### Jobs
- **POST `/api/jobs`**
  - **Input**: `{ "title": "Senior Engineer", "active_capacity": 3, "acknowledge_window_minutes": 60 }`
  - **Output**: Job object with unique ID.
- **GET `/api/jobs/:id/pipeline`**
  - **Output**: Returns an ordered list of current `active`, `pending`, and `waitlisted` candidates.

### Applicants
- **POST `/api/applicants`**
  - **Input**: `{ "job_id": "uuid", "name": "Alice", "email": "alice@email.com" }`
  - **Output**: Applicant object + initial queue position.
- **POST `/api/applicants/:id/acknowledge`**
  - **Effect**: Moves status to `active`. Fails if window expired.
- **POST `/api/applicants/:id/exit`**
  - **Input**: `{ "reason": "hired" | "rejected" | "withdrawn" }`
  - **Effect**: Triggers the `promoteNext` cascade.

---

## 🚀 Future Improvements (Requirement #15)

If I had more time, the following evolutions would be prioritized:
1. **TypeScript Migration**: The core state machine logic in `pipelineService.js` would benefit immensely from strict typing for status transitions.
2. **Dedicated Worker Thread**: Move the `decayService` polling into a separate worker thread or a cron-based microservice to ensure the main Express event loop remains unblocked during heavy decay sweeps.
3. **Real-time "Urgency" UI**: Enhance the React frontend with a real-time countdown progress bar for promoted applicants, using `framer-motion` for smoother status transitions.
4. **Test Database Isolation**: Implement a dedicated PostgreSQL instance for `npm test` to prevent development data pollution.

---

## 📄 License
MIT
