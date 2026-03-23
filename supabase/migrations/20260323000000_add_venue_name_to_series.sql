-- Adds the venue_name column to the series table.
--
-- How to apply:
--   Option A — Supabase CLI:  supabase db push
--   Option B — SQL editor:    paste this file into the Supabase dashboard SQL editor

ALTER TABLE series ADD COLUMN IF NOT EXISTS venue_name text;
