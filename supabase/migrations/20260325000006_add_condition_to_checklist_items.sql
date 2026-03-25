-- checklist_items was missing the condition column that checklist_templates has.
-- The generate_checklist_for_show trigger references it, causing inserts to fail.

alter table checklist_items
  add column if not exists condition text;
