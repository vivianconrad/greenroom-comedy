-- Add missing system checklist template items extracted from the BGT seed data.
-- Skips condition-specific items (superlatives, audience game) as they are too show-specific.
-- Skips items already covered by existing entries (e.g. 'Compile tech requirements' ≈ 'Confirm AV & tech requirements').

insert into system_checklist_templates (task, category, stage, weeks_out, sort_order) values
  ('Confirm headliner',                 'booking',    'pre',  5,  16),
  ('All performers filled out form',    'booking',    'pre',  3,  17),
  ('Story: Countdown + ticket link',    'marketing',  'pre',  2,  18),
  ('Story: Performer spotlights',       'marketing',  'pre',  1,  19),
  ('Venue payment sent',                'admin',      'pre',  1,  20),
  ('Send RO + call time to performers', 'booking',    'pre',  0,  21),
  ('Video + photo cameras ready',       'production', 'day',  0,  22),
  ('Stories during show',               'marketing',  'day',  0,  23),
  ('Film show',                         'production', 'day',  0,  24),
  ('Photos edited',                     'production', 'post', 0,  25),
  ('Videos edited',                     'production', 'post', 0,  26),
  ('Share media with performers',       'booking',    'post', 0,  27),
  ('After show recap posted',           'marketing',  'post', 0,  28),
  ('Performer payments sent',           'admin',      'post', 0,  29),
  ('Log show notes',                    'admin',      'post', 0,  30);
