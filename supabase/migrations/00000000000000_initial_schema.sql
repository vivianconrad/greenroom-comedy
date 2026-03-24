-- ============================================================================
-- Initial Schema: Greenroom Comedy Production Platform
-- ============================================================================
-- How to apply:
--   Option A — Supabase CLI:  supabase db push
--   Option B — SQL editor:    paste into Supabase dashboard SQL editor
--
-- Incremental migrations in this folder add columns on top of this baseline.
-- All ADD COLUMN migrations use IF NOT EXISTS so re-running is safe.
-- ============================================================================

-- ─── Extensions ──────────────────────────────────────────────────────────────

create extension if not exists "uuid-ossp";

-- ─── PROFILES ────────────────────────────────────────────────────────────────
-- One row per auth.users entry; created automatically by trigger below.

create table if not exists profiles (
  id           uuid        primary key references auth.users(id) on delete cascade,
  display_name text,
  email        text,
  created_at   timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- ─── SERIES ──────────────────────────────────────────────────────────────────

create table if not exists series (
  id                 uuid        primary key default gen_random_uuid(),
  owner_id           uuid        not null references profiles(id) on delete cascade,
  name               text        not null,
  venue              text,
  venue_name         text,   -- display name for the venue (added 20260323)
  frequency          text,
  show_type          text,
  is_one_off         boolean     not null default false,
  default_call_time  time,
  default_doors_time time,
  default_show_time  time,
  tagline            text,
  description_long   text,
  default_hosts      text,
  slug               text        unique,
  created_at         timestamptz not null default now()
);

alter table series enable row level security;

create policy "Owners can manage their series"
  on series for all
  using (owner_id = auth.uid());

-- ─── SHOWS ───────────────────────────────────────────────────────────────────

create table if not exists shows (
  id               uuid          primary key default gen_random_uuid(),
  series_id        uuid          not null references series(id) on delete cascade,
  date             date,
  call_time        time,
  doors_time       time,
  show_time        time,
  venue            text,
  venue_cost       numeric(10,2),
  capacity         integer,
  theme            text,
  status           text          not null default 'planning',
  hosts            text,
  ticket_platform  text,
  ticket_price     numeric(10,2),
  ticket_url       text,
  tickets_sold     integer,
  notes_attendance text,
  notes_rating     text,
  notes_energy     text,
  notes_worked     text,
  notes_didnt_work text,
  notes_next_time  text,
  slug             text          unique,
  created_at       timestamptz   not null default now()
);

alter table shows enable row level security;

create policy "Owners can manage shows in their series"
  on shows for all
  using (
    series_id in (
      select id from series where owner_id = auth.uid()
    )
  );

-- ─── PERFORMERS ──────────────────────────────────────────────────────────────

create table if not exists performers (
  id                 uuid        primary key default gen_random_uuid(),
  owner_id           uuid        not null references profiles(id) on delete cascade,
  name               text        not null,
  pronouns           text,
  act_type           text,
  instagram          text,
  email              text,
  contact_method     text,
  how_we_met         text,
  book_again         boolean,
  audience_favourite boolean,
  notes              text,
  tags               text[],
  created_at         timestamptz not null default now()
);

alter table performers enable row level security;

create policy "Owners can manage their performers"
  on performers for all
  using (owner_id = auth.uid());

-- ─── PERFORMER_SERIES ────────────────────────────────────────────────────────
-- Many-to-many junction: which performers belong to which series.

create table if not exists performer_series (
  performer_id uuid not null references performers(id) on delete cascade,
  series_id    uuid not null references series(id)    on delete cascade,
  primary key (performer_id, series_id)
);

alter table performer_series enable row level security;

create policy "Owners can manage performer↔series links"
  on performer_series for all
  using (
    series_id in (
      select id from series where owner_id = auth.uid()
    )
  );

-- ─── SHOW_PERFORMERS ─────────────────────────────────────────────────────────

create table if not exists show_performers (
  id             uuid          primary key default gen_random_uuid(),
  show_id        uuid          not null references shows(id)      on delete cascade,
  performer_id   uuid                   references performers(id) on delete set null,
  slot_label     text,
  slot_order     integer,
  set_length     integer,
  call_time      time,
  walk_up_song   text,
  walk_up_file   text,
  bio            text,
  photo_url      text,
  tags_ok        boolean,
  confirmed      boolean       not null default false,
  form_complete  boolean       not null default false,
  paid           boolean       not null default false,
  payment_amount numeric(10,2),
  payment_method text,
  role           text,
  created_at     timestamptz   not null default now()
);

alter table show_performers enable row level security;

create policy "Owners can manage show performers"
  on show_performers for all
  using (
    show_id in (
      select s.id from shows s
      join series sr on sr.id = s.series_id
      where sr.owner_id = auth.uid()
    )
  );

-- ─── SHOW_CREW ───────────────────────────────────────────────────────────────

create table if not exists show_crew (
  id             uuid        primary key default gen_random_uuid(),
  show_id        uuid        not null references shows(id) on delete cascade,
  name           text        not null,
  role           text,
  contact_method text,
  contact_info   text,
  call_time      time,
  notes          text,
  created_at     timestamptz not null default now()
);

alter table show_crew enable row level security;

create policy "Owners can manage show crew"
  on show_crew for all
  using (
    show_id in (
      select s.id from shows s
      join series sr on sr.id = s.series_id
      where sr.owner_id = auth.uid()
    )
  );

-- ─── CHECKLIST_TEMPLATES ─────────────────────────────────────────────────────
-- Series-level defaults; copied into checklist_items when a show is created.

create table if not exists checklist_templates (
  id              uuid        primary key default gen_random_uuid(),
  series_id       uuid        not null references series(id) on delete cascade,
  task            text        not null,
  weeks_out       integer,
  category        text,
  stage           text,
  default_owner   text,
  enabled         boolean     not null default true,
  condition       text,
  sort_order      integer,
  created_at      timestamptz not null default now()
);

alter table checklist_templates enable row level security;

create policy "Owners can manage their checklist templates"
  on checklist_templates for all
  using (
    series_id in (
      select id from series where owner_id = auth.uid()
    )
  );

-- ─── CHECKLIST_ITEMS ─────────────────────────────────────────────────────────
-- Per-show checklist, seeded from checklist_templates on show creation.

create table if not exists checklist_items (
  id          uuid        primary key default gen_random_uuid(),
  show_id     uuid        not null references shows(id)               on delete cascade,
  template_id uuid                 references checklist_templates(id) on delete set null,
  task        text        not null,
  weeks_out   integer,
  due_date    date,
  category    text,
  stage       text,
  owner       text,
  enabled     boolean     not null default true,
  done        boolean     not null default false,
  done_at     timestamptz,
  sort_order  integer,
  created_at  timestamptz not null default now()
);

alter table checklist_items enable row level security;

create policy "Owners can manage show checklist items"
  on checklist_items for all
  using (
    show_id in (
      select s.id from shows s
      join series sr on sr.id = s.series_id
      where sr.owner_id = auth.uid()
    )
  );

-- ─── SERIES_COLLECTIONS ──────────────────────────────────────────────────────
-- Named free-form lists (e.g. themes, bits, prizes). Seeded by show_type on
-- series creation.

create table if not exists series_collections (
  id          uuid        primary key default gen_random_uuid(),
  series_id   uuid        not null references series(id) on delete cascade,
  name        text        not null,
  description text,
  icon        text,
  sort_order  integer,
  created_at  timestamptz not null default now()
);

alter table series_collections enable row level security;

create policy "Owners can manage their series collections"
  on series_collections for all
  using (
    series_id in (
      select id from series where owner_id = auth.uid()
    )
  );

-- ─── COLLECTION_ITEMS ────────────────────────────────────────────────────────
-- status: 'available' | 'rejected' | 'used'

create table if not exists collection_items (
  id            uuid        primary key default gen_random_uuid(),
  collection_id uuid        not null references series_collections(id) on delete cascade,
  text          text        not null,
  description   text,
  status        text        not null default 'available',
  sort_order    integer,
  created_at    timestamptz not null default now()
);

alter table collection_items enable row level security;

create policy "Owners can manage collection items"
  on collection_items for all
  using (
    collection_id in (
      select sc.id from series_collections sc
      join series sr on sr.id = sc.series_id
      where sr.owner_id = auth.uid()
    )
  );

-- ─── SHOW_COLLECTION_SELECTIONS ──────────────────────────────────────────────

create table if not exists show_collection_selections (
  id                 uuid        primary key default gen_random_uuid(),
  show_id            uuid        not null references shows(id)            on delete cascade,
  collection_item_id uuid        not null references collection_items(id) on delete cascade,
  assigned_to        text,
  notes              text,
  created_at         timestamptz not null default now()
);

alter table show_collection_selections enable row level security;

create policy "Owners can manage show collection selections"
  on show_collection_selections for all
  using (
    show_id in (
      select s.id from shows s
      join series sr on sr.id = s.series_id
      where sr.owner_id = auth.uid()
    )
  );

-- ─── COMM_TEMPLATES ──────────────────────────────────────────────────────────
-- Body supports [name], [date], [callTime], [venue], [runningOrder] placeholders.

create table if not exists comm_templates (
  id         uuid        primary key default gen_random_uuid(),
  series_id  uuid        not null references series(id) on delete cascade,
  name       text        not null,
  body       text,
  sort_order integer,
  created_at timestamptz not null default now()
);

alter table comm_templates enable row level security;

create policy "Owners can manage their comm templates"
  on comm_templates for all
  using (
    series_id in (
      select id from series where owner_id = auth.uid()
    )
  );

-- ─── COMM_LOG ────────────────────────────────────────────────────────────────

create table if not exists comm_log (
  id              uuid        primary key default gen_random_uuid(),
  show_id         uuid        not null references shows(id)          on delete cascade,
  template_id     uuid                 references comm_templates(id) on delete set null,
  recipient_group text,
  recipient_names text[],
  subject         text,
  body            text,
  sent_at         timestamptz not null default now(),
  sent_via        text
);

alter table comm_log enable row level security;

create policy "Owners can manage comm log for their shows"
  on comm_log for all
  using (
    show_id in (
      select s.id from shows s
      join series sr on sr.id = s.series_id
      where sr.owner_id = auth.uid()
    )
  );

-- ─── DUTY_TEMPLATES ──────────────────────────────────────────────────────────
-- Series-level defaults; copied into show_duties when a show is created.

create table if not exists duty_templates (
  id                  uuid        primary key default gen_random_uuid(),
  series_id           uuid        not null references series(id) on delete cascade,
  default_assigned_to text,
  duty                text        not null,
  time_note           text,
  sort_order          integer,
  created_at          timestamptz not null default now()
);

alter table duty_templates enable row level security;

create policy "Owners can manage their duty templates"
  on duty_templates for all
  using (
    series_id in (
      select id from series where owner_id = auth.uid()
    )
  );

-- ─── SHOW_DUTIES ─────────────────────────────────────────────────────────────

create table if not exists show_duties (
  id          uuid        primary key default gen_random_uuid(),
  show_id     uuid        not null references shows(id) on delete cascade,
  assigned_to text,
  duty        text        not null,
  time_note   text,
  sort_order  integer,
  completed   boolean     not null default false,
  created_at  timestamptz not null default now()
);

alter table show_duties enable row level security;

create policy "Owners can manage show duties"
  on show_duties for all
  using (
    show_id in (
      select s.id from shows s
      join series sr on sr.id = s.series_id
      where sr.owner_id = auth.uid()
    )
  );

-- ─── APP_SUGGESTIONS ─────────────────────────────────────────────────────────

create table if not exists app_suggestions (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        references auth.users(id) on delete set null,
  user_email text,
  category   text,
  body       text        not null,
  status     text        not null default 'open',
  created_at timestamptz not null default now()
);

alter table app_suggestions enable row level security;

create policy "Users can insert suggestions"
  on app_suggestions for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own suggestions"
  on app_suggestions for select
  using (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- ─── on_auth_user_created → profiles ─────────────────────────────────────────

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─── on_show_created → generate_checklist_for_show ───────────────────────────

create or replace function generate_checklist_for_show()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into checklist_items (
    show_id, template_id, task, weeks_out,
    category, stage, owner, enabled, sort_order
  )
  select
    new.id,
    t.id,
    t.task,
    t.weeks_out,
    t.category,
    t.stage,
    t.default_owner,
    t.enabled,
    t.sort_order
  from checklist_templates t
  where t.series_id = new.series_id
    and t.enabled = true;
  return new;
end;
$$;

drop trigger if exists on_show_created_checklist on shows;
create trigger on_show_created_checklist
  after insert on shows
  for each row execute function generate_checklist_for_show();

-- ─── on_show_created → generate_duties_for_show ──────────────────────────────

create or replace function generate_duties_for_show()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into show_duties (
    show_id, assigned_to, duty, time_note, sort_order
  )
  select
    new.id,
    t.default_assigned_to,
    t.duty,
    t.time_note,
    t.sort_order
  from duty_templates t
  where t.series_id = new.series_id;
  return new;
end;
$$;

drop trigger if exists on_show_created_duties on shows;
create trigger on_show_created_duties
  after insert on shows
  for each row execute function generate_duties_for_show();

-- ─── on_series_created → seed_collections_for_series ─────────────────────────
-- Creates starter collection names based on show_type.
-- Fully deletable/renameable by the producer after creation.

create or replace function seed_collections_for_series()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  collections text[][];
  entry       text[];
  i           integer := 0;
begin
  -- Default starter collections for all show types
  collections := array[
    array['Themes',      'Possible themes for upcoming shows',   '🎭'],
    array['Bits & Ideas','Running gag ideas or recurring bits',  '💡'],
    array['Prize Ideas', 'Prizes or giveaways for the audience', '🎁']
  ];

  -- Additional collections by show_type
  if new.show_type = 'variety' then
    collections := collections || array[
      array['Guest Acts',   'Potential guest performers to invite', '🌟'],
      array['Segments',     'Recurring or one-off segment formats', '📋']
    ];
  elsif new.show_type = 'standup' then
    collections := collections || array[
      array['Headliners',   'Potential headlining acts',            '🎤'],
      array['Openers',      'Potential opening acts',               '🎙️']
    ];
  elsif new.show_type = 'improv' then
    collections := collections || array[
      array['Games',        'Improv games to feature',              '🎮'],
      array['Formats',      'Long-form formats to try',             '🎯']
    ];
  end if;

  foreach entry slice 1 in array collections
  loop
    insert into series_collections (series_id, name, description, icon, sort_order)
    values (new.id, entry[1], entry[2], entry[3], i);
    i := i + 1;
  end loop;

  return new;
end;
$$;

drop trigger if exists on_series_created on series;
create trigger on_series_created
  after insert on series
  for each row execute function seed_collections_for_series();
