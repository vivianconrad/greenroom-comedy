-- Add regular contacts storage to series (venue manager, sound engineer, etc.)
ALTER TABLE series
  ADD COLUMN IF NOT EXISTS contacts jsonb DEFAULT '[]'::jsonb;
