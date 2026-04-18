-- ============================================================
-- SCAM NOTIFIER — Supabase Schema
-- Run this entire file in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- REPORTS TABLE
-- Stores every known scammer / trusted entity
-- NOT_REPORTED is never stored — it is the default
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_id       TEXT NOT NULL,                  -- Discord user/server ID
    target_type     TEXT NOT NULL CHECK (target_type IN ('user', 'server')),
    status          TEXT NOT NULL CHECK (status IN ('scammer', 'trusted')),
    name            TEXT,                           -- Cached Discord name
    avatar_url      TEXT,                           -- Cached avatar/icon URL
    description     TEXT NOT NULL,                 -- Why reported
    reported_by     TEXT NOT NULL,                 -- Discord user ID of submitter
    reviewed_by     TEXT,                          -- Admin Discord user ID
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(target_id, target_type)
);

-- ============================================================
-- PROOFS TABLE
-- Images/evidence linked to a report
-- ============================================================
CREATE TABLE IF NOT EXISTS proofs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id   UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    url         TEXT NOT NULL,                      -- Supabase Storage public URL
    label       TEXT,                               -- Optional caption
    added_by    TEXT NOT NULL,                      -- Discord user ID
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PENDING SUBMISSIONS TABLE
-- Website submissions waiting for admin review
-- ============================================================
CREATE TABLE IF NOT EXISTS pending_submissions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_id       TEXT NOT NULL,
    target_type     TEXT NOT NULL CHECK (target_type IN ('user', 'server')),
    description     TEXT NOT NULL,
    submitted_by    TEXT NOT NULL,                  -- Discord user ID
    submitted_name  TEXT,                           -- Discord display name
    status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PENDING PROOFS TABLE
-- Proofs attached to pending submissions (before approval)
-- ============================================================
CREATE TABLE IF NOT EXISTS pending_proofs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id   UUID NOT NULL REFERENCES pending_submissions(id) ON DELETE CASCADE,
    url             TEXT NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOGS TABLE
-- Tracks every admin action
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action      TEXT NOT NULL,
    performed_by TEXT NOT NULL,                     -- Discord user ID
    target_id   TEXT,
    target_type TEXT,
    details     JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES for fast lookups
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_reports_target_id   ON reports(target_id);
CREATE INDEX IF NOT EXISTS idx_reports_target_type ON reports(target_type);
CREATE INDEX IF NOT EXISTS idx_reports_status      ON reports(status);
CREATE INDEX IF NOT EXISTS idx_proofs_report_id    ON proofs(report_id);
CREATE INDEX IF NOT EXISTS idx_pending_status      ON pending_submissions(status);
CREATE INDEX IF NOT EXISTS idx_audit_created_at    ON audit_logs(created_at DESC);

-- ============================================================
-- AUTO-UPDATE updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE reports             ENABLE ROW LEVEL SECURITY;
ALTER TABLE proofs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_proofs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs          ENABLE ROW LEVEL SECURITY;

-- Public can read reports and proofs (for website check)
CREATE POLICY "Public read reports"
    ON reports FOR SELECT USING (true);

CREATE POLICY "Public read proofs"
    ON proofs FOR SELECT USING (true);

-- Service role (API/bot) has full access
CREATE POLICY "Service full access reports"
    ON reports FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service full access proofs"
    ON proofs FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service full access pending"
    ON pending_submissions FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service full access pending_proofs"
    ON pending_proofs FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service full access audit"
    ON audit_logs FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- STORAGE BUCKET
-- Run after enabling Supabase Storage
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('proofs', 'proofs', true)
-- ON CONFLICT DO NOTHING;

-- CREATE POLICY "Public read proofs bucket"
--     ON storage.objects FOR SELECT USING (bucket_id = 'proofs');

-- CREATE POLICY "Service upload proofs"
--     ON storage.objects FOR INSERT
--     WITH CHECK (bucket_id = 'proofs' AND auth.role() = 'service_role');
