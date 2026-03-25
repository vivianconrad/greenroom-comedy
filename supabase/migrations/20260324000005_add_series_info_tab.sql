-- Add internal notes and login credentials storage to series
ALTER TABLE series
  ADD COLUMN IF NOT EXISTS internal_notes text,
  ADD COLUMN IF NOT EXISTS logins jsonb DEFAULT '[]'::jsonb;
