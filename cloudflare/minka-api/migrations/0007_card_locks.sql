-- PIN-protected cards: names (lower-case) whose emoji and look only their owner may
-- change, signed in with the radio PIN profile (lacitis-api). The Worker also creates
-- this table on first use.
CREATE TABLE IF NOT EXISTS card_locks (
  worker TEXT PRIMARY KEY,
  updated_at INTEGER NOT NULL
);
