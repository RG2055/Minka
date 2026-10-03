-- "Konfektes 98" on the gallery's old computer (kalendars mood-gallery-pc.js): the day's
-- best score per signed-in device, shown to everyone as the day's table. The device is a
-- hash of its session; the name is the day's anonymous animal, nothing about the person.
CREATE TABLE IF NOT EXISTS candy_scores (
  day TEXT NOT NULL,
  voter TEXT NOT NULL,
  name TEXT NOT NULL,
  score INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (day, voter)
);
CREATE INDEX IF NOT EXISTS candy_scores_day_idx ON candy_scores(day, score DESC);
