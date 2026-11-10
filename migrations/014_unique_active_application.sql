-- One active (not soft-deleted) application per user, company and role,
-- ignoring case. Backs up the duplicate check in POST /api/applications,
-- which on its own can be raced by two saves at the same moment.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_application
  ON applications (user_id, lower(company), lower(role))
  WHERE deleted_at IS NULL;
