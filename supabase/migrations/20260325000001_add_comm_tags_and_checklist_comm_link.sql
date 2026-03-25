-- ─── Tags on comm templates ───────────────────────────────────────────────────
-- Free-form labels used for filtering and for soft-linking templates to
-- checklist tasks or other workflow steps.

alter table comm_templates
  add column if not exists tags text[] not null default '{}';

alter table system_comm_templates
  add column if not exists tags text[] not null default '{}';

-- ─── Comm template link on checklist templates ────────────────────────────────
-- A checklist template row can point at a specific comm template.
-- When a new show is created the link is copied to the generated checklist_item
-- (see updated trigger below).  Updating the link on the template also
-- back-fills existing checklist_items that were stamped from that template.

alter table checklist_templates
  add column if not exists comm_template_id uuid
    references comm_templates(id) on delete set null;

alter table checklist_items
  add column if not exists comm_template_id uuid
    references comm_templates(id) on delete set null;

-- ─── Update checklist-generation trigger to propagate comm_template_id ────────

create or replace function generate_checklist_for_show()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into checklist_items (
    show_id, template_id, task, weeks_out,
    category, stage, owner, enabled, sort_order,
    comm_template_id
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
    t.sort_order,
    t.comm_template_id
  from checklist_templates t
  where t.series_id = new.series_id
    and t.enabled = true;
  return new;
end;
$$;
