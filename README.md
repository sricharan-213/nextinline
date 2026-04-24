# ■ NextInLine

**NextInLine** is a high-performance, self-moving hiring pipeline designed to eliminate friction for applicants while providing robust, automated state management for hiring managers.

It features an automated waitlist system with a **Decay Algorithm** that ensures the pipeline stays fresh by automatically re-queuing inactive applicants.

---

## 🚀 The Core Philosophy

### 1. Zero-Friction Applicants
- **No Passwords**: Applicants identify via Name + Email.
- **Persistent Identity**: A 24-day secure JWT token is generated upon identification.
- **One-Click Apply**: Applicants can browse jobs and apply with a single click.
- **Real-time Dashboard**: A unified view of all applications, current waitlist positions, and active review statuses.

### 2. Automated Pipeline Logic
- **Waitlist & Promotion**: When a slot opens in the "Active" stage, the next person on the waitlist is automatically promoted.
- **Acknowledgment Window**: Promoted applicants have a limited time (e.g., 60 minutes) to acknowledge their promotion.
- **Decay Penalty**: If an applicant fails to acknowledge in time, they are moved to the back of the waitlist with a position penalty, ensuring only engaged candidates take up active review slots.

### 3. Professional Admin Control
- **3-Column Pipeline**: Visual management of Active, Pending, and Waitlisted candidates.
- **Full Audit Trail**: Every status change (applied, promoted, decayed, hired, rejected) is logged with a timestamp and metadata.
- **Capacity Management**: Admins define how many "Active" slots each job has.

---

## 🛠 Tech Stack
- **Frontend**: React, Vite, Vanilla CSS (Custom Dark Theme)
- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **Validation**: Zod (Schema-based input validation)
- **Security**: JWT (Role-based), Bcryptjs, pg-advisory-locks (for pipeline concurrency)

---

## 🏃 Quick Start

### 1. Prerequisites
- **Node.js** (v18+)
- **PostgreSQL** (v14+)

### 2. Database Setup
Create the database and run the initialization script to set up the schema and seed the admin user.

```bash
createdb nextinline
psql -d nextinline -f migrations/init.sql
```

### 3. Environment Configuration
Create a `.env` file in the root directory:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/nextinline
PORT=5000
JWT_SECRET=nextinline_secret_2024
```

### 4. Installation & Running
Install dependencies from the root:

```bash
npm install
```

Start the **Backend** (from the root or backend folder):
```bash
npm run dev
```

Start the **Frontend** (from the frontend folder):
```bash
cd frontend
npm install
npm run dev
```

---

## 🔐 Credentials (Seeded)

### Admin / Hiring Manager
- **Login URL**: `/admin/login`
- **Email**: `admin@nextinline.com`
- **Password**: `admin123`

### Applicants
- **Entry URL**: `/`
- **Flow**: Enter any Name + Email to start applying.

---

## 📂 Project Structure
```text
nextinline/
├── backend/
│   ├── routes/             # API Endpoints (Auth, Jobs, Applicants)
│   ├── services/           # Business Logic (Pipeline, Decay, Auth)
│   ├── middleware/         # Admin & Applicant Protection
│   └── server.js           # Entry Point
├── frontend/
│   ├── src/
│   │   ├── pages/          # Admin & Applicant Views
│   │   ├── components/     # UI Elements (AuditLog, Countdown, etc.)
│   │   └── utils/          # API Handlers
├── migrations/
│   └── init.sql            # Full Database Schema & Seeds
└── .env                    # Environment Config
```

---

## 📝 Design Decisions
- **Polling over WebSockets**: The dashboard uses a 10s polling interval for simple, reliable state synchronization without the overhead of persistent socket connections.
- **Advisory Locks**: Uses PostgreSQL advisory locks during the promotion/apply logic to prevent race conditions when multiple applicants apply or are promoted simultaneously.
- **Stateless Applicants**: By using JWT tokens tied to email, we avoid the need for complex session management for candidates while keeping their dashboard secure.
- **Robust Input Validation**: Uses **Zod** schemas at the API boundary to ensure all incoming data (IDs, emails, job parameters) is strictly typed and validated before reaching the service layer.
