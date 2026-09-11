-- Collective shift-radio history: which station was on during which shift
-- day. One row per day and station; no listener identity is stored.
CREATE TABLE IF NOT EXISTS radio_days (
  shift_day TEXT NOT NULL,
  station TEXT NOT NULL CHECK (length(station) BETWEEN 1 AND 120),
  first_at INTEGER NOT NULL,
  PRIMARY KEY (shift_day, station)
);

CREATE INDEX IF NOT EXISTS radio_days_day_idx ON radio_days(shift_day DESC);
