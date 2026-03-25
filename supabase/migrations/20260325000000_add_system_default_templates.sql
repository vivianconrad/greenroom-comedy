-- ─── System Default Templates ─────────────────────────────────────────────────
-- These tables hold the "starter kit" presets for new series creation.
-- They are NOT tied to any user or series, so they survive demo resets and
-- are always available as a reference/source of truth for the wizard.
--
-- RLS: any authenticated user can SELECT; no regular-user INSERT/UPDATE/DELETE.
-- To update defaults, add a new migration that modifies these rows.
-- ──────────────────────────────────────────────────────────────────────────────

-- ─── system_checklist_templates ──────────────────────────────────────────────

create table if not exists system_checklist_templates (
  id         uuid    primary key default gen_random_uuid(),
  task       text    not null,
  category   text,
  stage      text,
  weeks_out  integer,
  sort_order integer not null default 0
);

alter table system_checklist_templates enable row level security;

create policy "Authenticated users can read system checklist templates"
  on system_checklist_templates for select
  using (auth.role() = 'authenticated');

insert into system_checklist_templates (task, category, stage, weeks_out, sort_order) values
  ('Confirm venue booking',              'logistics',  'pre',  6, 0),
  ('Confirm AV & tech requirements',     'logistics',  'pre',  4, 1),
  ('Create event on social media',       'marketing',  'pre',  4, 2),
  ('Design poster / promotional flyer',  'marketing',  'pre',  3, 3),
  ('Send performer confirmations',       'booking',    'pre',  1, 4),
  ('Write running order',                'production', 'pre',  0, 5),
  ('Sound check',                        'production', 'day',  0, 6),
  ('Post show photos to social media',   'marketing',  'post', 0, 7),
  ('Send thank yous to performers',      'admin',      'post', 0, 8);

-- ─── system_duty_templates ────────────────────────────────────────────────────

create table if not exists system_duty_templates (
  id         uuid    primary key default gen_random_uuid(),
  duty       text    not null,
  time_note  text,
  sort_order integer not null default 0
);

alter table system_duty_templates enable row level security;

create policy "Authenticated users can read system duty templates"
  on system_duty_templates for select
  using (auth.role() = 'authenticated');

insert into system_duty_templates (duty, time_note, sort_order) values
  ('Host / MC',              'Entire show',  0),
  ('Tech & sound',           'Entire show',  1),
  ('Door / front of house',  'Doors–end',    2),
  ('Stage manager',          'Entire show',  3),
  ('Photographer',           'During show',  4);

-- ─── system_comm_templates ────────────────────────────────────────────────────

create table if not exists system_comm_templates (
  id         uuid    primary key default gen_random_uuid(),
  name       text    not null,
  body       text,
  sort_order integer not null default 0
);

alter table system_comm_templates enable row level security;

create policy "Authenticated users can read system comm templates"
  on system_comm_templates for select
  using (auth.role() = 'authenticated');

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
  );

-- ─── system_collection_presets ────────────────────────────────────────────────
-- show_type = null  → applies to all show types (base presets)
-- show_type = '...' → only suggested for that show type

create table if not exists system_collection_presets (
  id          uuid    primary key default gen_random_uuid(),
  name        text    not null,
  description text,
  icon        text,
  show_type   text,
  sort_order  integer not null default 0
);

alter table system_collection_presets enable row level security;

create policy "Authenticated users can read system collection presets"
  on system_collection_presets for select
  using (auth.role() = 'authenticated');

insert into system_collection_presets (name, description, icon, show_type, sort_order) values
  ('Themes',      'Possible themes for upcoming shows',        '🎭', null,       0),
  ('Bits & Ideas','Running gag ideas or recurring bits',       '💡', null,       1),
  ('Prize Ideas', 'Prizes or giveaways for the audience',      '🎁', null,       2),
  ('Guest Acts',  'Potential guest performers to invite',      '🌟', 'variety',  3),
  ('Segments',    'Recurring or one-off segment formats',      '📋', 'variety',  4),
  ('Headliners',  'Potential headlining acts',                 '🎤', 'standup',  5),
  ('Openers',     'Potential opening acts',                    '🎙️', 'standup',  6),
  ('Games',       'Improv games to feature',                   '🎮', 'sketch',   7),
  ('Formats',     'Long-form formats to try',                  '🎯', 'sketch',   8);
