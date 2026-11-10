ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_attempts INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
