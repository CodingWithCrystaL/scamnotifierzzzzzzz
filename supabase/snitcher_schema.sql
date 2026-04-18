-- ============================================================
-- SCAM NOTIFIER — Snitcher System Schema Additions
-- Run this AFTER the base schema.sql
-- ============================================================

-- ============================================================
-- SNITCHER TOKENS TABLE
-- Stores user tokens used by the snitcher system
-- ============================================================
CREATE TABLE IF NOT EXISTS snitcher_tokens (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token       TEXT NOT NULL,            -- Discord user token (encrypted at app layer)
    label       TEXT,                     -- Friendly name e.g. "Token-1"
    user_id     TEXT,                     -- Discord user ID of this token (populated on connect)
    username    TEXT,                     -- Discord username (populated on connect)
    status      TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'dead', 'ratelimited')),
    last_heartbeat TIMESTAMPTZ,
    guilds_joined  INT DEFAULT 0,        -- Number of scam servers currently joined
    dms_sent       INT DEFAULT 0,        -- Total DMs sent
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- WATCHED SERVERS TABLE
-- Maps which scam servers are being watched by which tokens
-- ============================================================
CREATE TABLE IF NOT EXISTS watched_servers (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    server_id   TEXT NOT NULL,            -- Discord server ID (must match reports.target_id)
    token_id    UUID REFERENCES snitcher_tokens(id) ON DELETE CASCADE,
    invite_code TEXT,                     -- Invite code used to join
    status      TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'joined', 'failed', 'kicked', 'left')),
    joined_at   TIMESTAMPTZ,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(server_id, token_id)
);

-- ============================================================
-- DM LOG TABLE
-- Prevents duplicate DM warnings per user per server
-- ============================================================
CREATE TABLE IF NOT EXISTS dm_log (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     TEXT NOT NULL,            -- Discord user who received DM
    server_id   TEXT NOT NULL,            -- Scam server they joined
    sent_by     TEXT NOT NULL,            -- 'bot' or token_id UUID
    sent_via    TEXT NOT NULL CHECK (sent_via IN ('bot', 'token')),
    success     BOOLEAN DEFAULT true,
    error       TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Fast lookup for checking recent DMs
CREATE INDEX IF NOT EXISTS idx_dm_log_recent
    ON dm_log(user_id, server_id, created_at);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_snitcher_tokens_status    ON snitcher_tokens(status);
CREATE INDEX IF NOT EXISTS idx_watched_servers_server_id ON watched_servers(server_id);
CREATE INDEX IF NOT EXISTS idx_watched_servers_token_id  ON watched_servers(token_id);
CREATE INDEX IF NOT EXISTS idx_dm_log_user_server        ON dm_log(user_id, server_id);
CREATE INDEX IF NOT EXISTS idx_dm_log_created_at         ON dm_log(created_at DESC);

-- ============================================================
-- RLS Policies
-- ============================================================
ALTER TABLE snitcher_tokens  ENABLE ROW LEVEL SECURITY;
ALTER TABLE watched_servers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_log           ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service full access snitcher_tokens"
    ON snitcher_tokens FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service full access watched_servers"
    ON watched_servers FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service full access dm_log"
    ON dm_log FOR ALL USING (auth.role() = 'service_role');

-- Auto-update trigger
CREATE TRIGGER snitcher_tokens_updated_at
    BEFORE UPDATE ON snitcher_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
