-- Brings databases built from these files and the production database to the
-- same schema. Safe to run on either: every step checks before changing.

-- 1. Production's users table was created with the column misspelled as
--    create_at (001 says created_at). Rename it where it exists.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'users' AND column_name = 'create_at'
  ) THEN
    ALTER TABLE users RENAME COLUMN create_at TO created_at;
  END IF;
END $$;

-- 2. Deleting a user should remove their applications and sessions.
--    Production already cascades applications (003 doesn't); neither
--    cascaded refresh_tokens, so deleting a user with a session failed.
ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_user_id_fkey;
ALTER TABLE applications ADD CONSTRAINT applications_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE refresh_tokens DROP CONSTRAINT IF EXISTS refresh_tokens_user_id_fkey;
ALTER TABLE refresh_tokens ADD CONSTRAINT refresh_tokens_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 3. users_email_key (from UNIQUE in 001) already indexes email.
DROP INDEX IF EXISTS idx_users_email;
