-- Additive migration on the existing Lācītis database. Existing PINs/libraries remain.
CREATE TABLE IF NOT EXISTS media_sessions (token_hash TEXT PRIMARY KEY, worker_id TEXT NOT NULL, name TEXT NOT NULL, expires_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS media_sessions_expiry ON media_sessions(expires_at);
CREATE TABLE IF NOT EXISTS media_attempts (attempt_key TEXT PRIMARY KEY, attempts INTEGER NOT NULL, expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS media_radio (worker_id TEXT PRIMARY KEY, data TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS media_recovery (worker_id TEXT PRIMARY KEY, code_hash TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS media_identities (normalized_name TEXT PRIMARY KEY, worker_id TEXT NOT NULL);
