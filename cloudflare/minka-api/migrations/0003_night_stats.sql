-- Every saved night plan / bed layout (formerly the "NightStats" sheet rows).
-- The statistics use the newest row per date, as the sheet script did.
CREATE TABLE IF NOT EXISTS night_stats_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  saved_at INTEGER NOT NULL DEFAULT 0,
  order_json TEXT NOT NULL DEFAULT '[]',
  sh REAL,
  ei INTEGER,
  beds_json TEXT NOT NULL DEFAULT '{}',
  source TEXT NOT NULL DEFAULT 'cloudflare'
);
CREATE INDEX IF NOT EXISTS night_stats_log_date ON night_stats_log(date);
