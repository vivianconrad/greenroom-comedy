-- Ensure any existing NULL assigned_to values are patched, then enforce NOT NULL.
-- The trigger was inserting duty_templates.default_assigned_to directly, which
-- can be NULL (the field is optional on templates). Fix the trigger to fall back
-- to 'Unassigned', matching what the createDuty server action already does.

-- 1. Patch any rows that slipped through with NULL
update show_duties set assigned_to = 'Unassigned' where assigned_to is null;

-- 2. Make the column NOT NULL with a default so future direct inserts are safe
alter table show_duties
  alter column assigned_to set not null,
  alter column assigned_to set default 'Unassigned';

-- 3. Fix the trigger function to coalesce NULL templates values
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
