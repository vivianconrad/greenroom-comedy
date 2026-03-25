-- ============================================================================
-- System Default Templates (seed data)
-- ============================================================================
-- These are the starter-kit presets shown in the new series wizard.
-- They live in system_* tables and are never touched by demo resets.
-- To update defaults, add a new migration that modifies these rows.
-- ============================================================================

-- ─── Checklist templates ─────────────────────────────────────────────────────

insert into system_checklist_templates (task, category, stage, weeks_out, sort_order) values
  -- Pre-show
  ('Confirm venue booking',                                        'logistics',  'pre',  6,  0),
  ('Confirm AV & tech requirements',                               'logistics',  'pre',  4,  1),
  ('Set ticket price + create listing',                            'admin',      'pre',  5,  2),
  ('Confirm headliner',                                            'booking',    'pre',  5,  3),
  ('Reach out to performers',                                      'booking',    'pre',  4,  4),
  ('Create event on social media',                                 'marketing',  'pre',  4,  5),
  ('Submit to local event listings',                               'marketing',  'pre',  3,  6),
  ('Design poster / promotional flyer',                            'marketing',  'pre',  3,  7),
  ('Create promo graphics',                                        'marketing',  'pre',  3,  8),
  ('All performers confirmed',                                     'booking',    'pre',  2,  9),
  ('All performers filled out form',                               'booking',    'pre',  3, 10),
  ('Post performer announcement',                                  'marketing',  'pre',  2, 11),
  ('Promote to mailing list',                                      'marketing',  'pre',  2, 12),
  ('Confirm photographer',                                         'production', 'pre',  2, 13),
  ('Confirm videographer / camera',                                'production', 'pre',  2, 14),
  ('Story: Countdown + ticket link',                               'marketing',  'pre',  2, 15),
  ('Send performer confirmations',                                 'booking',    'pre',  1, 16),
  ('Send pre-show forms',                                          'booking',    'pre',  1, 17),
  ('Collect performer info (pronunciation, plugs, special needs)', 'booking',    'pre',  1, 18),
  ('Story: Performer spotlights',                                  'marketing',  'pre',  1, 19),
  ('Venue payment sent',                                           'admin',      'pre',  1, 20),
  ('Write running order',                                          'production', 'pre',  0, 21),
  ('Finalise running order',                                       'production', 'pre',  0, 22),
  ('Send RO + call time to performers',                            'booking',    'pre',  0, 23),
  -- Show day
  ('Sound check',                                                  'production', 'day',  0, 24),
  ('Video + photo cameras ready',                                  'production', 'day',  0, 25),
  ('Stories during show',                                          'marketing',  'day',  0, 26),
  ('Film show',                                                    'production', 'day',  0, 27),
  -- Post-show
  ('Photos edited',                                                'production', 'post', 0, 28),
  ('Videos edited',                                                'production', 'post', 0, 29),
  ('Share media with performers',                                  'booking',    'post', 0, 30),
  ('Post show photos to social media',                             'marketing',  'post', 0, 31),
  ('After show recap posted',                                      'marketing',  'post', 0, 32),
  ('Send post-show recap to performers',                           'admin',      'post', 0, 33),
  ('Send thank yous to performers',                                'admin',      'post', 0, 34),
  ('Performer payments sent',                                      'admin',      'post', 0, 35),
  ('Log show notes',                                               'admin',      'post', 0, 36);

-- ─── Duty templates ──────────────────────────────────────────────────────────

insert into system_duty_templates (duty, time_note, sort_order) values
  ('Host / MC',              'Entire show', 0),
  ('Tech & sound',           'Entire show', 1),
  ('Door / front of house',  'Doors–end',   2),
  ('Stage manager',          'Entire show', 3),
  ('Photographer',           'During show', 4),
  ('Videographer / Camera',  'Entire show', 5),
  ('Social media',           'Entire show', 6);

-- ─── Comm templates ──────────────────────────────────────────────────────────

insert into system_comm_templates (name, body, sort_order) values
  (
    'Performer Confirmation',
    E'Hi [name],\n\nYou''re confirmed for [date] at [venue]!\n\nCall time: [callTime]\nDoors: [doors]\nShow: [showTime]\n\nLet me know if anything changes — can''t wait to see you there.',
    0
  ),
  (
    'Show Reminder',
    E'Hi [name],\n\nQuick reminder that you''re on the bill for [date] at [venue].\n\nCall time: [callTime] · Show time: [showTime]\n\nSee you soon!',
    1
  ),
  (
    'Running Order',
    E'Hi [name],\n\nHere''s the running order for [date]:\n\n[runningOrder]\n\nSee you at call time ([callTime])!',
    2
  ),
  (
    'Important Info',
    E'Important info for [date]!\n\nSHOW DETAILS\nShow time: [showTime]\nCall time: [callTime]\nTheme: [theme]\n\nHOW IT WORKS:\nThis is a talent show-themed variety show! Audience judges will give out silly superlatives throughout the night. After the headliner, we''ll play an audience game while judges deliberate, then all performers come back on stage for our awards ceremony.\n\nTICKETS & COMPS\nYou get 1 comp ticket (groups get 3)\nEmail me your comp requests by FRIDAY NIGHT\nFor other guests: coupon code [promoCode]\n[ticketUrl]\n\nPLEASE PROMOTE THE SHOW! Tag us and share the link 💖\n\nMUSIC/TECH\nSend any music to @ at @gmail.com - he''s our tech guy\n\nDAY-OF LOGISTICS\nYou can hang in the green room before your set (or sit in back of house if there''s space)\nThere''s a door next to the stage connecting green room ↔ house, please only use it when going on/off stage\nWe''re doing a group photo at the end! Let me know if you need to leave early so we can plan accordingly\nThe stage is a little small, so please keep that in mind for choreography/movement\nWe''ll be taking photos and videos during your set\nIf your set includes going into the audience or you want to start off stage (for a dramatic entrance), let us know here!\n\nRunning Order:\n[runningOrder]',
    3
  ),
  (
    'Pre-Show Form Reminder',
    E'Hi [name],\n\nJust a reminder to fill out your pre-show form for [date] at [venue].\n\nWe need your bio, promo photo, walk-up song, and any tech notes before the show.\n\n[formLink]\n\nThanks!',
    4
  ),
  (
    'Post-Show Thank You',
    E'Hi [name],\n\nThank you so much for performing at [date] — you were fantastic!\n\nWe''ll share photos and clips with you soon. Feel free to tag us when you post.\n\nHope to have you back!',
    5
  ),
  (
    'Payment Confirmation',
    E'Hi [name],\n\nJust sent your payment of [amount] via [method]. Thanks again for a great set!\n\nLet me know if you have any issues.',
    6
  );

-- ─── Collection presets ───────────────────────────────────────────────────────
-- show_type = null  → applies to all show types
-- show_type = '...' → only suggested for that show type
-- default_selected  → whether pre-checked in the new series wizard

insert into system_collection_presets (name, description, icon, show_type, default_selected, sort_order) values
  ('Themes',       'Possible themes for upcoming shows',            '🎭', null,       true,  0),
  ('Bits & Ideas', 'Running gag ideas or recurring bits',           '💡', null,       false, 1),
  ('Prize Ideas',  'Prizes or giveaways for the audience',          '🎁', null,       false, 2),
  ('Guest Acts',   'Potential guest performers to invite',          '🌟', 'variety',  true,  3),
  ('Segments',     'Recurring or one-off segment formats',          '📋', 'variety',  false, 4),
  ('Crowd Games',  'Audience participation bits and warm-up games', '🎲', 'variety',  false, 5),
  ('Headliners',   'Potential headlining acts',                     '🎤', 'standup',  true,  6),
  ('Openers',      'Potential opening acts',                        '🎙️', 'standup',  false, 7),
  ('Games',        'Improv games to feature',                       '🎮', 'sketch',   true,  8),
  ('Formats',      'Long-form formats to try',                      '🎯', 'sketch',   false, 9);
