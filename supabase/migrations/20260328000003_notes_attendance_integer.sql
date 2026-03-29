-- notes_attendance stores a headcount (integer), not a free-text description.
-- The UI renders it as type="number". Cast any existing text rows that are
-- pure numbers; non-numeric values (old free-text notes) are dropped to null.

alter table shows
  alter column notes_attendance type integer
  using case
    when notes_attendance ~ '^[0-9]+$' then notes_attendance::integer
    else null
  end;
