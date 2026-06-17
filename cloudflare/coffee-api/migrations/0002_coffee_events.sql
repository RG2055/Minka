CREATE TABLE IF NOT EXISTS coffee_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  worker TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'philips',
  size TEXT NOT NULL DEFAULT '',
  price_cents INTEGER NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  delta INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_coffee_events_date ON coffee_events(date);
CREATE INDEX IF NOT EXISTS idx_coffee_events_worker ON coffee_events(worker);
