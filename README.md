# ⚡ NextInLine

> **Hiring pipelines that move themselves.**

A full-stack hiring pipeline management tool built with the **PERN stack** (PostgreSQL, Express, React, Node.js). NextInLine automates candidate promotion, acknowledgment windows, and decay penalties — no manual queue management required.

---

## ✨ Features

| Feature | Details |
|---|---|
| 🎯 **Active Pipeline** | Fixed-capacity slots with automatic promotion from waitlist |
| ⏱ **Acknowledgment Windows** | Promoted candidates must acknowledge within a configurable window |
| 📉 **Decay Penalties** | Late acknowledgments send candidates back to waitlist at a penalized position |
| 🔐 **Advisory Locks** | PostgreSQL `pg_advisory_xact_lock` prevents race conditions on the last slot |
| 📋 **Full Audit Log** | Every status transition is recorded with timestamps and metadata |
| 🔄 **Auto Cascade** | Decay triggers the next promotion automatically |
| 🚫 **Duplicate Guard** | One application per email per job, enforced at DB level |

---

## 🏗 Architecture

```
nextinline/
├── backend/
│   ├── db.js                      # PostgreSQL pool
│   ├── server.js                  # Express app + server
│   ├── routes/
│   │   ├── companies.js           # POST /api/companies, GET /api/companies/:id
│   │   ├── jobs.js                # POST /api/jobs, GET pipeline + audit
│   │   └── applicants.js          # apply, status, acknowledge, exit, log
│   ├── services/
│   │   ├── pipelineService.js     # Core state machine logic
│   │   └── decayService.js        # 30s polling decay checker
│   └── middleware/
│       └── errorHandler.js
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Home.jsx           # Company + Job creation wizard
│       │   ├── Dashboard.jsx      # Live pipeline view (10s polling)
│       │   ├── Apply.jsx          # Candidate application form
│       │   └── Status.jsx         # Candidate status + acknowledge
│       └── components/
│           ├── ApplicantCard.jsx  # Card with exit controls
│           ├── CountdownTimer.jsx # Live countdown with 3-phase colors
│           └── AuditLog.jsx       # Paginated event table
└── migrations/
    └── init.sql                   # Full DB schema
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 1. Clone and Install

```bash
# Install backend dependencies (from root nextinline/)
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 2. Set Up Database

```bash
# Create the database
createdb nextinline

# Run the schema migration
psql -d nextinline -f migrations/init.sql
```

### 3. Configure Environment

```bash
# Copy the example env file
cp .env.example .env
```

Edit `.env` and set your database password:
```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/nextinline
PORT=5000
```

### 4. Run the App

**Terminal 1 — Backend:**
```bash
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend && npm run dev
```

- Backend: http://localhost:5000
- Frontend: http://localhost:3000

---

## 🔌 API Reference

### Companies
- **POST `/api/companies`**
  - Input: `{ "name": "string", "email": "string" }`
  - Output: `{ "id": "uuid", "name": "...", "email": "..." }`
- **GET `/api/companies/:id`**
  - Output: `{ "id": "uuid", "name": "...", "email": "..." }`

### Jobs
- **POST `/api/jobs`**
  - Input: `{ "title": "string", "company_id": "uuid", "active_capacity": number, "acknowledge_window_minutes": number }`
  - Output: Full job object including ID.
- **GET `/api/jobs/:id/pipeline`**
  - Output: `[{ "id": "...", "name": "...", "status": "active|waitlisted|pending_acknowledgment", "waitlist_position": number|null }]`
- **GET `/api/jobs/:id/audit`**
  - Output: Paginated array of transition events.

### Applicants
- **POST `/api/applicants`**
  - Input: `{ "job_id": "uuid", "name": "string", "email": "string" }`
  - Output: Applicant object with status and position.
- **GET `/api/applicants/:id/status`**
  - Output: Current status, deadlines, and waitlist position.
- **POST `/api/applicants/:id/acknowledge`**
  - Output: `{ "success": true }`
- **POST `/api/applicants/:id/exit`**
  - Input: `{ "reason": "hired" | "rejected" | "withdrawn" }`
  - Output: `{ "success": true }`

---

## ⚙️ Pipeline State Machine

```
           ┌─────────────────────────────────┐
           │           applied                │
           ▼                                 │
    [has capacity?]                          │
       /       \                             │
     YES        NO                          │
      │          │                          │
      ▼          ▼                          │
    active    waitlisted ◄──── decayed ──────┤
      │          │            (penalty)     │
      │          │                          │
   [exit]    [promoted]                     │
   /  |  \       │                          │
hired rej with   ▼                          │
            pending_acknowledgment          │
                 │                          │
          [acknowledge] ──────► active      │
                 │                          │
          [timeout] ─────────────────────── ┘
```

---

## 🔧 Design Decisions

1. **No queue libraries** — All scheduling via native `setInterval`.
2. **No WebSockets** — Deliberate 10-second polling; the pipeline is designed for high-thought human interaction, not sub-second trading.
3. **Advisory Locks** — `pg_try_advisory_xact_lock` handles concurrent last-slot race conditions at the DB level.
4. **Decay Cascade** — When a decayed applicant is re-queued, `promoteNext()` is called immediately, creating a self-triggering cascade.
5. **Audit-first** — Every state transition logs to `audit_log` before the transaction commits.

---

## 🔮 Future Improvements

With more time, the following evolutions would be implemented:
1. **WebSockets Integration**: Transition from polling to real-time events for the dashboard using Socket.io.
2. **Advanced Rate Limiting**: Implement per-IP rate limiting for the `/apply` endpoint to prevent bot spam.
3. **Metrics Dashboard**: Add Grafana/Prometheus tracking for average "Time to Hired" and "Waitlist Decay Rate".
4. **Resilience**: Move the `decayService` interval logic to a dedicated worker process or a heartbeat-monitored system (like Redis-backed `bullmq`) for higher reliability in distributed environments.

---

## 📄 License

MIT
