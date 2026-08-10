-- Additive and nullable for a safe rollout: existing comments remain readable,
-- while only new comments carrying a private capability can be mutated.
ALTER TABLE feedback_messages ADD COLUMN edit_token_hash TEXT;
