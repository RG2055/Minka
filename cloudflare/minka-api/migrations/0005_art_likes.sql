-- Hearts for the gallery's drawings (kalendars mood-feedback.js, "Slavas zāle").
-- One heart per drawing and signed-in device; the device is known only by a
-- hash of its session, nothing about the person.
CREATE TABLE IF NOT EXISTS art_likes (
  art_id TEXT NOT NULL,
  voter TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (art_id, voter)
);
CREATE INDEX IF NOT EXISTS art_likes_art_idx ON art_likes(art_id);
