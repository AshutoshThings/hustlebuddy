-- otp_expiry was TIMESTAMP (no time zone), so its meaning depended on the
-- time zone of whichever server wrote it. Pending codes can't be converted
-- reliably, so they're cleared; anyone mid-signup or mid-reset just
-- requests a new code.
UPDATE users
  SET otp = NULL, otp_expiry = NULL, otp_purpose = NULL, otp_attempts = 0
  WHERE otp IS NOT NULL OR otp_expiry IS NOT NULL;

ALTER TABLE users
  ALTER COLUMN otp_expiry TYPE TIMESTAMPTZ USING otp_expiry AT TIME ZONE 'UTC';
