CREATE TABLE IF NOT EXISTS coffee_counts (
  date TEXT NOT NULL,
  worker TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
  updated_at INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (date, worker)
);

CREATE INDEX IF NOT EXISTS idx_coffee_counts_date ON coffee_counts(date);
