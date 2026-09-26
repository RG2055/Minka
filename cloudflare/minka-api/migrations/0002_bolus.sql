-- Bolus contrast-injector changes (moved from the "Minka – Bolus (dati)" sheet).
-- ts is the change time at minute precision, as the sheet kept it.
CREATE TABLE IF NOT EXISTS bolus_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room TEXT NOT NULL CHECK (room IN ('ge', 'philips')),
  ts INTEGER NOT NULL,
  name TEXT NOT NULL DEFAULT 'Anonīms',
  left_conc INTEGER,
  left_ml INTEGER,
  nacl_ml INTEGER,
  right_conc INTEGER,
  right_ml INTEGER,
  updated_at INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS bolus_entries_room_ts ON bolus_entries(room, ts);
