-- ─── Feature 1: comm_template_id on duty_templates and show_duties ───────────

alter table duty_templates
  add column if not exists comm_template_id uuid
    references comm_templates(id) on delete set null;

alter table show_duties
  add column if not exists comm_template_id uuid
    references comm_templates(id) on delete set null;

-- Update trigger to copy comm_template_id when generating duties for a new show
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

-- ─── Feature 6: tags on checklist_templates and checklist_items ───────────────

alter table checklist_templates
  add column if not exists tags text[] not null default '{}';

alter table checklist_items
  add column if not exists tags text[] not null default '{}';

-- Update trigger to copy tags when generating checklist for a new show
-- (Re-creates the full function to include the existing comm_template_id copy
--  plus the new tags copy.)
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
