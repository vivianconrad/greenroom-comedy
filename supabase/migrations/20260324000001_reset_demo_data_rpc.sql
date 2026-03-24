-- ─── reset_demo_data ──────────────────────────────────────────────────────────
-- Deletes all show/series/performer data for the calling user.
-- Called from /api/demo/reset (which already verifies the caller is the demo account).
-- Cascades handle all child rows automatically.

create or replace function reset_demo_data()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  -- performers is owner-scoped directly
  delete from performers where owner_id = auth.uid();

  -- series cascades to: shows → show_performers, show_crew, checklist_items,
  --   show_duties, comm_log, show_collection_selections; also checklist_templates,
  --   duty_templates, series_collections → collection_items, comm_templates,
  --   performer_series
  delete from series where owner_id = auth.uid();
end;
$$;
