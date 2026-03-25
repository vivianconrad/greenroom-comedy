-- Stores saved Google Sheet → database sync configurations.
-- One row per connection (e.g. "performers for this account").

create table if not exists sheet_syncs (
  id              uuid        primary key default gen_random_uuid(),
  owner_id        uuid        not null references profiles(id) on delete cascade,
  entity_type     text        not null,      -- 'performers' (extensible)
  series_id       uuid        references series(id) on delete cascade,  -- null = global
  sheet_url       text        not null,
  column_mapping  jsonb       not null default '{}'::jsonb,
  last_synced_at  timestamptz,
  sync_count      integer     not null default 0,
  created_at      timestamptz not null default now()
);

alter table sheet_syncs enable row level security;

create policy "Users manage their own sheet syncs"
  on sheet_syncs for all
  using (owner_id = auth.uid());
