-- Add missing system checklist template items.
-- 'Confirm venue booking' already exists (sort_order 0); new items fill the gaps.

insert into system_checklist_templates (task, category, stage, weeks_out, sort_order) values
  ('Set ticket price + create listing', 'admin',      'pre',  5,  9),
  ('Reach out to performers',           'booking',    'pre',  4, 10),
  ('Create promo graphics',             'marketing',  'pre',  3, 11),
  ('All performers confirmed',          'booking',    'pre',  2, 12),
  ('Post performer announcement',       'marketing',  'pre',  2, 13),
  ('Send pre-show forms',               'booking',    'pre',  1, 14),
  ('Finalise running order',            'production', 'pre',  0, 15);
