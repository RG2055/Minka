CREATE TABLE IF NOT EXISTS feedback_ratings (
  shift_day TEXT NOT NULL,
  reaction TEXT NOT NULL CHECK (reaction IN ('excellent', 'good', 'ok', 'bad', 'terrible')),
  count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (shift_day, reaction)
);

CREATE TABLE IF NOT EXISTS feedback_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id TEXT NOT NULL UNIQUE,
  shift_day TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('comment', 'suggestion')),
  body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 700),
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS feedback_messages_day_kind_id_idx
  ON feedback_messages(shift_day, kind, id DESC);

CREATE INDEX IF NOT EXISTS feedback_messages_kind_day_id_idx
  ON feedback_messages(kind, shift_day DESC, id DESC);
