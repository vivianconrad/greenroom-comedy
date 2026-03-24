-- Creates the RPC used by saveChecklistToTemplateAndPush to atomically push
-- `enabled` changes from one show's checklist to all upcoming shows in the
-- same series, excluding the show being edited.
--
-- Called by: lib/actions/checklist.js → saveChecklistToTemplateAndPush
--
-- How to apply:
--   Option A — Supabase CLI:  supabase db push
--   Option B — SQL editor:    paste this file into the Supabase dashboard SQL editor

-- Drop old name if it was previously applied with the wrong name.
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
  -- One UPDATE per template_id entry; each covers all matching rows across
  -- every upcoming show in the series, making the whole push a single
  -- transaction instead of a JS loop of N × M queries.
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
