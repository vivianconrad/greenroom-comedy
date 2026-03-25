-- ─── Soft-delete support for series and shows ────────────────────────────────
--
-- When a user "deletes" a series or show it is soft-deleted: deleted_at is set
-- to the current timestamp. Records are hidden from all normal queries while
-- still being queryable for the trash/recovery UI. After 30 days the purge
-- function permanently removes them.
--
-- To schedule auto-purge on Supabase Pro (pg_cron):
--   select cron.schedule('purge-deleted-items', '0 3 * * *', 'select purge_deleted_items()');
-- On free plans, hit /api/cron/purge-deleted from an external cron service instead.

alter table series add column if not exists deleted_at timestamptz;
alter table shows  add column if not exists deleted_at timestamptz;

-- Index so the trash page query is fast.
create index if not exists series_deleted_at_idx on series (deleted_at) where deleted_at is not null;
create index if not exists shows_deleted_at_idx  on shows  (deleted_at) where deleted_at is not null;

-- Permanently removes series/shows that have been in the trash for >30 days.
-- Cascade on series→shows means deleting a series row removes its show rows too.
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
