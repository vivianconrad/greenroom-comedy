-- Add per-show performer info fields collected via intake or manually entered
ALTER TABLE show_performers
  ADD COLUMN IF NOT EXISTS name_pronunciation text,
  ADD COLUMN IF NOT EXISTS plugs             text,
  ADD COLUMN IF NOT EXISTS special_needs     text;

-- Add checklist tasks for collecting this info and doing post-show recap
INSERT INTO system_checklist_templates (task, category, stage, weeks_out, sort_order) VALUES
  ('Collect performer info (pronunciation, plugs, special needs)', 'booking', 'pre', 1, 16),
  ('Send post-show recap to performers',                           'admin',   'post', 0, 17);
