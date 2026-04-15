CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  active_capacity INTEGER NOT NULL DEFAULT 5,
  acknowledge_window_minutes INTEGER NOT NULL DEFAULT 60,
  decay_penalty INTEGER NOT NULL DEFAULT 10,
  is_open BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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
  CONSTRAINT unique_job_email UNIQUE (job_id, email)
);

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

CREATE INDEX idx_applicants_job_status ON applicants(job_id, status);
CREATE INDEX idx_applicants_waitlist ON applicants(job_id, waitlist_position) WHERE status = 'waitlisted';
CREATE INDEX idx_audit_job ON audit_log(job_id, created_at DESC);
