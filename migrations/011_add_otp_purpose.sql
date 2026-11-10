ALTER TABLE users ADD COLUMN otp_purpose TEXT
  CHECK (otp_purpose IN ('verify', 'reset'));