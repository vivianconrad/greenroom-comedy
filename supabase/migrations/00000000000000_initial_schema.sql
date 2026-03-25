-- ============================================================================
-- Schema: Greenroom Comedy Production Platform
-- ============================================================================
-- Apply with:
--   supabase db reset   (local)
--   supabase db push    (remote)
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ─── PROFILES ────────────────────────────────────────────────────────────────

create table if not exists profiles (
  id           uuid        primary key references auth.users(id) on delete cascade,
  display_name text,
  email        text,
  created_at   timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can view their own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);

-- ─── SERIES ──────────────────────────────────────────────────────────────────

create table if not exists series (
  id                 uuid        primary key default gen_random_uuid(),
  owner_id           uuid        not null references profiles(id) on delete cascade,
  name               text        not null,
  venue              text,
  venue_name         text,
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
  deleted_at         timestamptz,
  ticket_url         text,
  promo_code         text,
  internal_notes     text,
  logins             jsonb       not null default '[]'::jsonb,
  contacts           jsonb       not null default '[]'::jsonb,
  created_at         timestamptz not null default now()
);

alter table series enable row level security;

create policy "Owners can manage their series"
  on series for all using (owner_id = auth.uid());

create index if not exists series_deleted_at_idx on series (deleted_at) where deleted_at is not null;

-- ─── SHOWS ───────────────────────────────────────────────────────────────────

create table if not exists shows (
  id               uuid        primary key default gen_random_uuid(),
  series_id        uuid        not null references series(id) on delete cascade,
  date             date,
  call_time        time,
  doors_time       time,
  show_time        time,
  venue            text,
  venue_cost       numeric(10,2),
  capacity         integer,
  theme            text,
  status           text        not null default 'planning',
  hosts            text,
  ticket_platform  text,
  ticket_price     numeric(10,2),
  ticket_url       text,
  tickets_sold     integer,
  promo_code       text,
  notes_attendance text,
  notes_rating     text,
  notes_energy     text,
  notes_worked     text,
  notes_didnt_work text,
  notes_next_time  text,
  slug             text        unique,
  deleted_at       timestamptz,
  created_at       timestamptz not null default now()
);

alter table shows enable row level security;

create policy "Owners can manage shows in their series"
  on shows for all
  using (series_id in (select id from series where owner_id = auth.uid()));

create index if not exists shows_deleted_at_idx on shows (deleted_at) where deleted_at is not null;

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
  on performers for all using (owner_id = auth.uid());

-- ─── PERFORMER_SERIES ────────────────────────────────────────────────────────

create table if not exists performer_series (
  performer_id uuid not null references performers(id) on delete cascade,
  series_id    uuid not null references series(id)    on delete cascade,
  primary key (performer_id, series_id)
);

alter table performer_series enable row level security;

create policy "Owners can manage performer↔series links"
  on performer_series for all
  using (series_id in (select id from series where owner_id = auth.uid()));

-- ─── SHOW_PERFORMERS ─────────────────────────────────────────────────────────

create table if not exists show_performers (
  id                 uuid        primary key default gen_random_uuid(),
  show_id            uuid        not null references shows(id)      on delete cascade,
  performer_id       uuid                   references performers(id) on delete set null,
  slot_label         text,
  slot_order         integer,
  set_length         integer,
  call_time          time,
  walk_up_song       text,
  walk_up_file       text,
  bio                text,
  photo_url          text,
  tags_ok            boolean,
  confirmed          boolean     not null default false,
  form_complete      boolean     not null default false,
  paid               boolean     not null default false,
  payment_amount     numeric(10,2),
  payment_method     text,
  role               text,
  name_pronunciation text,
  plugs              text,
  special_needs      text,
  created_at         timestamptz not null default now()
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

-- ─── COMM_TEMPLATES ──────────────────────────────────────────────────────────

create table if not exists comm_templates (
  id         uuid        primary key default gen_random_uuid(),
  series_id  uuid        not null references series(id) on delete cascade,
  name       text        not null,
  body       text,
  tags       text[]      not null default '{}',
  sort_order integer,
  created_at timestamptz not null default now()
);

alter table comm_templates enable row level security;

create policy "Owners can manage their comm templates"
  on comm_templates for all
  using (series_id in (select id from series where owner_id = auth.uid()));

-- ─── CHECKLIST_TEMPLATES ─────────────────────────────────────────────────────

create table if not exists checklist_templates (
  id               uuid        primary key default gen_random_uuid(),
  series_id        uuid        not null references series(id) on delete cascade,
  task             text        not null,
  weeks_out        integer,
  category         text,
  stage            text,
  default_owner    text,
  enabled          boolean     not null default true,
  condition        text,
  sort_order       integer,
  comm_template_id uuid        references comm_templates(id) on delete set null,
  tags             text[]      not null default '{}',
  created_at       timestamptz not null default now()
);

alter table checklist_templates enable row level security;

create policy "Owners can manage their checklist templates"
  on checklist_templates for all
  using (series_id in (select id from series where owner_id = auth.uid()));

-- ─── CHECKLIST_ITEMS ─────────────────────────────────────────────────────────

create table if not exists checklist_items (
  id               uuid        primary key default gen_random_uuid(),
  show_id          uuid        not null references shows(id)               on delete cascade,
  template_id      uuid                 references checklist_templates(id) on delete set null,
  task             text        not null,
  weeks_out        integer,
  due_date         date,
  category         text,
  stage            text,
  condition        text,
  owner            text,
  enabled          boolean     not null default true,
  done             boolean     not null default false,
  done_at          timestamptz,
  sort_order       integer,
  comm_template_id uuid        references comm_templates(id) on delete set null,
  tags             text[]      not null default '{}',
  created_at       timestamptz not null default now()
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

-- ─── DUTY_TEMPLATES ──────────────────────────────────────────────────────────

create table if not exists duty_templates (
  id                  uuid        primary key default gen_random_uuid(),
  series_id           uuid        not null references series(id) on delete cascade,
  default_assigned_to text,
  duty                text        not null,
  time_note           text,
  sort_order          integer,
  comm_template_id    uuid        references comm_templates(id) on delete set null,
  created_at          timestamptz not null default now()
);

alter table duty_templates enable row level security;

create policy "Owners can manage their duty templates"
  on duty_templates for all
  using (series_id in (select id from series where owner_id = auth.uid()));

-- ─── SHOW_DUTIES ─────────────────────────────────────────────────────────────

create table if not exists show_duties (
  id               uuid        primary key default gen_random_uuid(),
  show_id          uuid        not null references shows(id) on delete cascade,
  assigned_to      text,
  duty             text        not null,
  time_note        text,
  sort_order       integer,
  completed        boolean     not null default false,
  comm_template_id uuid        references comm_templates(id) on delete set null,
  created_at       timestamptz not null default now()
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

-- ─── SERIES_COLLECTIONS ──────────────────────────────────────────────────────

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
  using (series_id in (select id from series where owner_id = auth.uid()));

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
  on app_suggestions for insert with check (auth.uid() = user_id);

create policy "Users can view their own suggestions"
  on app_suggestions for select using (auth.uid() = user_id);

-- ─── SHEET_SYNCS ─────────────────────────────────────────────────────────────

create table if not exists sheet_syncs (
  id             uuid        primary key default gen_random_uuid(),
  owner_id       uuid        not null references profiles(id) on delete cascade,
  entity_type    text        not null,
  series_id      uuid        references series(id) on delete cascade,
  sheet_url      text        not null,
  column_mapping jsonb       not null default '{}'::jsonb,
  last_synced_at timestamptz,
  sync_count     integer     not null default 0,
  created_at     timestamptz not null default now()
);

alter table sheet_syncs enable row level security;

create policy "Users manage their own sheet syncs"
  on sheet_syncs for all using (owner_id = auth.uid());

-- ─── SYSTEM TEMPLATE TABLES ──────────────────────────────────────────────────
-- Seed data lives in 00000000000001_system_data.sql.
-- RLS: any authenticated user can SELECT; no regular-user writes.

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
  on system_checklist_templates for select using (auth.role() = 'authenticated');

create table if not exists system_duty_templates (
  id         uuid    primary key default gen_random_uuid(),
  duty       text    not null,
  time_note  text,
  sort_order integer not null default 0
);

alter table system_duty_templates enable row level security;

create policy "Authenticated users can read system duty templates"
  on system_duty_templates for select using (auth.role() = 'authenticated');

create table if not exists system_comm_templates (
  id         uuid    primary key default gen_random_uuid(),
  name       text    not null,
  body       text,
  tags       text[]  not null default '{}',
  sort_order integer not null default 0
);

alter table system_comm_templates enable row level security;

create policy "Authenticated users can read system comm templates"
  on system_comm_templates for select using (auth.role() = 'authenticated');

create table if not exists system_collection_presets (
  id               uuid    primary key default gen_random_uuid(),
  name             text    not null,
  description      text,
  icon             text,
  show_type        text,
  default_selected boolean not null default true,
  sort_order       integer not null default 0
);

alter table system_collection_presets enable row level security;

create policy "Authenticated users can read system collection presets"
  on system_collection_presets for select using (auth.role() = 'authenticated');

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- ─── New user → profile ───────────────────────────────────────────────────────

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

-- ─── New show → checklist items ───────────────────────────────────────────────

create or replace function generate_checklist_for_show()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into checklist_items (
    show_id, template_id, task, category, condition,
    owner, weeks_out, enabled, sort_order, stage, comm_template_id, tags
  )
  select
    new.id,
    t.id,
    t.task,
    t.category,
    t.condition,
    t.default_owner,
    t.weeks_out,
    t.enabled,
    t.sort_order,
    coalesce(t.stage, 'pre'),
    t.comm_template_id,
    t.tags
  from checklist_templates t
  where t.series_id = new.series_id;
  return new;
end;
$$;

drop trigger if exists on_show_created_checklist on shows;
create trigger on_show_created_checklist
  after insert on shows
  for each row execute function generate_checklist_for_show();

-- ─── New show → duties ────────────────────────────────────────────────────────

create or replace function generate_duties_for_show()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into show_duties (
    show_id, assigned_to, duty, time_note, sort_order, comm_template_id
  )
  select
    new.id,
    t.default_assigned_to,
    t.duty,
    t.time_note,
    t.sort_order,
    t.comm_template_id
  from duty_templates t
  where t.series_id = new.series_id;
  return new;
end;
$$;

drop trigger if exists on_show_created_duties on shows;
create trigger on_show_created_duties
  after insert on shows
  for each row execute function generate_duties_for_show();

-- ─── Push checklist enabled state to upcoming shows ───────────────────────────

drop function if exists push_checklist_is_active_to_upcoming_shows(uuid, uuid, jsonb);

create or replace function push_checklist_enabled_to_upcoming_shows(
  p_series_id       uuid,
  p_exclude_show_id uuid,
  p_updates         jsonb   -- [{ "template_id": "<uuid>", "enabled": true|false }, ...]
)
returns void
language plpgsql
as $$
declare
  upd jsonb;
begin
  for upd in select value from jsonb_array_elements(p_updates)
  loop
    update checklist_items ci
    set    enabled = (upd->>'enabled')::boolean
    from   shows s
    where  ci.show_id     = s.id
      and  s.series_id    = p_series_id
      and  s.id          != p_exclude_show_id
      and  s.status      != 'completed'
      and  ci.template_id = (upd->>'template_id')::uuid;
  end loop;
end;
$$;

-- ─── Purge soft-deleted items older than 30 days ─────────────────────────────
-- Schedule: select cron.schedule('purge-deleted-items', '0 3 * * *', 'select purge_deleted_items()');
-- On free plans, hit /api/cron/purge-deleted from an external cron service.

create or replace function purge_deleted_items()
returns void
language sql
security definer
as $$
  delete from series where deleted_at < now() - interval '30 days';
  delete from shows  where deleted_at < now() - interval '30 days'
                      and series_id not in (
                        select id from series where deleted_at is not null
                      );
$$;

-- ─── Reset demo data ──────────────────────────────────────────────────────────
-- Deletes all show/series/performer data for the calling user.
-- Called from /api/demo/reset (which already verifies the caller is the demo account).

create or replace function reset_demo_data()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  delete from performers where owner_id = auth.uid();
  delete from series     where owner_id = auth.uid();
end;
$$;
