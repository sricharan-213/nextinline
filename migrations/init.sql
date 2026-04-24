-- Drop everything and start clean
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS applicants CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS applicant_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS refresh_tokens CASCADE;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Only one company exists
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only one admin user
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  company_id UUID REFERENCES companies(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jobs posted by the company
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  active_capacity INTEGER NOT NULL DEFAULT 5,
  acknowledge_window_minutes INTEGER NOT NULL DEFAULT 60,
  decay_penalty INTEGER NOT NULL DEFAULT 10,
  is_open BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Applicants — no password, no account
CREATE TABLE applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waitlisted'
    CHECK (status IN ('waitlisted','active','pending_acknowledgment','withdrawn','rejected','hired')),
  waitlist_position INTEGER,
  promoted_at TIMESTAMPTZ,
  acknowledge_deadline TIMESTAMPTZ,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, email)
);

-- Every single state change is logged here
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID REFERENCES applicants(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  old_position INTEGER,
  new_position INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Applicant identity profiles — one row per unique email, across all jobs
CREATE TABLE applicant_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_applicants_job_status ON applicants(job_id, status);
CREATE INDEX idx_applicants_waitlist ON applicants(job_id, waitlist_position) 
  WHERE status = 'waitlisted';
CREATE INDEX idx_audit_job ON audit_log(job_id, created_at DESC);

-- SEED: Insert the one company and one admin
INSERT INTO companies (id, name) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'NextInLine HQ');

INSERT INTO admin_users (email, password_hash, company_id) VALUES (
  'admin@nextinline.com',
  crypt('admin123', gen_salt('bf')),
  '00000000-0000-0000-0000-000000000001'
);

-- SEED: Insert 2 sample jobs
INSERT INTO jobs (company_id, title, description, active_capacity, acknowledge_window_minutes, decay_penalty) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Senior Backend Engineer', 'Build scalable APIs and pipeline systems.', 3, 2, 5),
  ('00000000-0000-0000-0000-000000000001', 'Frontend Developer', 'Build clean React UIs with great UX.', 2, 2, 3);
