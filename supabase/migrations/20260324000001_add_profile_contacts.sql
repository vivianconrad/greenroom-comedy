-- Add a user-level contacts list to profiles, for contacts not tied to a specific series.
alter table profiles add column if not exists contacts jsonb not null default '[]'::jsonb;
