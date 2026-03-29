-- Don't auto-generate checklist items or duties for shows with a date in the past.
-- Past shows are historical records; pre-show planning data is irrelevant.

create or replace function generate_checklist_for_show()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Skip checklist generation for past shows
  if new.date < current_date then
    return new;
  end if;

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

create or replace function generate_duties_for_show()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Skip duty generation for past shows
  if new.date < current_date then
    return new;
  end if;

  insert into show_duties (
    show_id, assigned_to, duty, time_note, sort_order, comm_template_id
  )
  select
    new.id,
    coalesce(t.default_assigned_to, 'Unassigned'),
    t.duty,
    t.time_note,
    t.sort_order,
    t.comm_template_id
  from duty_templates t
  where t.series_id = new.series_id;
  return new;
end;
$$;
