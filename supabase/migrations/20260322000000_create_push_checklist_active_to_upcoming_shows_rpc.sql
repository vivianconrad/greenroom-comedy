-- Atomically pushes is_active changes from a checklist edit to all upcoming
-- shows in the same series, excluding the show being edited.
--
-- Called by: lib/actions/checklist.js → saveChecklistToTemplateAndPush
--
-- How to apply:
--   Option A — Supabase CLI:  supabase db push
--   Option B — SQL editor:    paste this file into the Supabase dashboard SQL editor

CREATE OR REPLACE FUNCTION push_checklist_is_active_to_upcoming_shows(
  p_series_id       uuid,
  p_exclude_show_id uuid,
  p_updates         jsonb   -- [{ "template_id": "<uuid>", "is_active": true|false }, ...]
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  upd jsonb;
BEGIN
  -- One UPDATE per template_id entry; each covers all matching rows across
  -- every upcoming show in the series, making the whole push a single
  -- transaction instead of a JS loop of N × M queries.
  FOR upd IN SELECT value FROM jsonb_array_elements(p_updates)
  LOOP
    UPDATE checklist_items ci
    SET    is_active = (upd->>'is_active')::boolean
    FROM   shows s
    WHERE  ci.show_id     = s.id
      AND  s.series_id    = p_series_id
      AND  s.id          != p_exclude_show_id
      AND  s.status      != 'completed'
      AND  ci.template_id = (upd->>'template_id')::uuid;
  END LOOP;
END;
$$;
