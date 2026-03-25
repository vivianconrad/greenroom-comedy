-- ─── Seed demo data ───────────────────────────────────────────────────────────
-- Populates the calling user's account with realistic sample comedy show data.
-- Called from /api/demo/seed (which already verifies the caller is the demo account).

create or replace function seed_demo_data()
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_fnl    uuid;  -- Friday Night Laughs series
  v_ij     uuid;  -- Improv Jam series
  v_alex   uuid;
  v_sam    uuid;
  v_jordan uuid;
  v_casey  uuid;
  v_morgan uuid;
  v_riley  uuid;
  v_drew   uuid;
  v_taylor uuid;
  v_s1     uuid;
  v_s2     uuid;
  v_s3     uuid;
  v_s4     uuid;
  v_s5     uuid;
  v_s6     uuid;
  v_s7     uuid;
begin

  -- ── Performers ──────────────────────────────────────────────────────────────
  insert into performers (owner_id, name, pronouns, act_type, instagram, book_again, audience_favourite, notes)
    values (v_uid, 'Alex Rivera', 'they/them', 'standup', '@alexrivera_comedy', true, true,
            'Always kills it on crowd work. Prefers later slots. Bring own mic stand.')
    returning id into v_alex;

  insert into performers (owner_id, name, pronouns, act_type, instagram, book_again, audience_favourite, notes)
    values (v_uid, 'Sam Chen', 'he/him', 'mc', '@samchen_mc', true, false,
            'Great MC energy, keeps the room warm between acts. Very reliable.')
    returning id into v_sam;

  insert into performers (owner_id, name, pronouns, act_type, instagram, book_again, audience_favourite, notes)
    values (v_uid, 'Jordan Hayes', 'she/her', 'standup', '@jordanhayes', true, true,
            'Sharp political material. Strong closer. Audience always goes wild.')
    returning id into v_jordan;

  insert into performers (owner_id, name, pronouns, act_type, instagram, book_again, audience_favourite, notes)
    values (v_uid, 'Casey Park', 'he/him', 'standup', '@caseypark', true, false,
            'New to the scene but progressing fast. Give him shorter sets for now.')
    returning id into v_casey;

  insert into performers (owner_id, name, pronouns, act_type, instagram, book_again, audience_favourite, notes)
    values (v_uid, 'Morgan Ellis', 'they/them', 'improv', '@morganellis', true, false,
            'Improv background, dabbling in standup. Great for mixed bills.')
    returning id into v_morgan;

  insert into performers (owner_id, name, pronouns, act_type, instagram, book_again, audience_favourite, notes)
    values (v_uid, 'Riley Fox', 'she/her', 'standup', '@rileyfox', true, true,
            'Very consistent. Audiences love her. Works any slot length.')
    returning id into v_riley;

  insert into performers (owner_id, name, pronouns, act_type, instagram, book_again, audience_favourite, notes)
    values (v_uid, 'Drew Martinez', 'he/him', 'improv', '@drewmartinez', false, false,
            'Funny but unreliable — check availability early. Good when he shows up.')
    returning id into v_drew;

  insert into performers (owner_id, name, pronouns, act_type, instagram, book_again, audience_favourite, notes)
    values (v_uid, 'Taylor Quinn', 'she/her', 'standup', '@taylorquinn', true, false, null)
    returning id into v_taylor;

  -- ── Series ──────────────────────────────────────────────────────────────────
  insert into series (owner_id, name, slug, frequency, show_type, venue, is_one_off,
                      default_call_time, default_doors_time, default_show_time, tagline)
    values (v_uid, 'Friday Night Laughs', null, 'weekly', 'standup', 'The Laughing Crow', false,
            '19:00', '19:30', '20:00', 'The city''s best weekly standup showcase')
    returning id into v_fnl;

  insert into series (owner_id, name, slug, frequency, show_type, venue, is_one_off,
                      default_call_time, default_doors_time, default_show_time, tagline)
    values (v_uid, 'Improv Jam', null, 'monthly', 'improv', 'Studio B', false,
            '18:30', '19:00', '19:30', 'Monthly long-form improv showcase')
    returning id into v_ij;

  -- Link performers to series
  insert into performer_series (performer_id, series_id) values
    (v_alex,   v_fnl),
    (v_sam,    v_fnl),
    (v_jordan, v_fnl),
    (v_casey,  v_fnl),
    (v_riley,  v_fnl),
    (v_taylor, v_fnl),
    (v_morgan, v_ij),
    (v_drew,   v_ij),
    (v_alex,   v_ij);

  -- ── Friday Night Laughs — Shows ─────────────────────────────────────────────

  -- Past show 1 (~3 months ago, done, great night)
  insert into shows (series_id, date, call_time, doors_time, show_time, venue, status,
                     hosts, ticket_price, tickets_sold, capacity,
                     notes_attendance, notes_energy, notes_worked, notes_next_time)
    values (v_fnl, current_date - 90, '19:00', '19:30', '20:00', 'The Laughing Crow', 'done',
            'Sam Chen', 12.00, 78, 90,
            '78/90 — great turnout for a cold night',
            'High energy throughout. Crowd was loud and engaged from the start.',
            'Alex closing strong really landed. Casey''s opener was a perfect warm-up.',
            'Book Jordan for the closer next time — audience was ready for her level.')
    returning id into v_s1;

  -- Past show 2 (~2 months ago, done, Valentine''s theme)
  insert into shows (series_id, date, call_time, doors_time, show_time, venue, status,
                     hosts, theme, ticket_price, tickets_sold, capacity,
                     notes_attendance, notes_energy, notes_worked)
    values (v_fnl, current_date - 60, '19:00', '19:30', '20:00', 'The Laughing Crow', 'done',
            'Sam Chen', 'Valentine''s Special', 12.00, 85, 90,
            '85/90 — almost sold out, theme helped',
            'Great energy. Couples in the room made the Valentine material land extra hard.',
            'Jordan''s relationship material was perfectly on-theme. Riley crushed it as feature.')
    returning id into v_s2;

  -- Past show 3 (~1 month ago, done, quieter night)
  insert into shows (series_id, date, call_time, doors_time, show_time, venue, status,
                     hosts, ticket_price, tickets_sold, capacity,
                     notes_attendance, notes_energy, notes_didnt_work)
    values (v_fnl, current_date - 30, '19:00', '19:30', '20:00', 'The Laughing Crow', 'done',
            'Sam Chen', 12.00, 61, 90,
            '61/90 — mid-week runover hurt attendance',
            'Crowd was a bit cold first half, warmed up by the end.',
            'Long gap between acts in the second half lost momentum.')
    returning id into v_s3;

  -- Upcoming show (next week, planning, lineup mostly confirmed)
  insert into shows (series_id, date, call_time, doors_time, show_time, venue, status,
                     hosts, ticket_price, capacity)
    values (v_fnl, current_date + 7, '19:00', '19:30', '20:00', 'The Laughing Crow', 'planning',
            'Sam Chen', 12.00, 90)
    returning id into v_s4;

  -- Future show (5 weeks out, planning)
  insert into shows (series_id, date, call_time, doors_time, show_time, venue, status,
                     ticket_price, capacity)
    values (v_fnl, current_date + 35, '19:00', '19:30', '20:00', 'The Laughing Crow', 'planning',
            12.00, 90)
    returning id into v_s5;

  -- ── Improv Jam — Shows ──────────────────────────────────────────────────────

  -- Past show (~6 weeks ago, done)
  insert into shows (series_id, date, show_time, venue, status)
    values (v_ij, current_date - 45, '19:30', 'Studio B', 'done')
    returning id into v_s6;

  -- Upcoming show (2 weeks out, planning)
  insert into shows (series_id, date, show_time, venue, status)
    values (v_ij, current_date + 14, '19:30', 'Studio B', 'planning')
    returning id into v_s7;

  -- ── Show performers ─────────────────────────────────────────────────────────

  -- Show 1 (past FNL — full lineup, everyone paid)
  insert into show_performers (show_id, performer_id, role, slot_order, confirmed, paid, set_length, payment_amount, payment_method)
    values
      (v_s1, v_sam,    'mc',        1, true, true, 10, null,  null),
      (v_s1, v_casey,  'opener',    2, true, true,  8, 20.00, 'cash'),
      (v_s1, v_riley,  'feature',   3, true, true, 15, 40.00, 'bank transfer'),
      (v_s1, v_alex,   'headliner', 4, true, true, 25, 80.00, 'bank transfer');

  -- Show 2 (past FNL — Valentine''s lineup)
  insert into show_performers (show_id, performer_id, role, slot_order, confirmed, paid, set_length)
    values
      (v_s2, v_sam,    'mc',        1, true, true, 10),
      (v_s2, v_jordan, 'opener',    2, true, true,  8),
      (v_s2, v_taylor, 'feature',   3, true, true, 15),
      (v_s2, v_alex,   'headliner', 4, true, true, 25);

  -- Show 3 (past FNL)
  insert into show_performers (show_id, performer_id, role, slot_order, confirmed, paid, set_length)
    values
      (v_s3, v_sam,    'mc',        1, true, true, 10),
      (v_s3, v_casey,  'opener',    2, true, true,  8),
      (v_s3, v_riley,  'feature',   3, true, true, 15),
      (v_s3, v_jordan, 'headliner', 4, true, true, 25);

  -- Show 4 (upcoming FNL — Riley not yet confirmed)
  insert into show_performers (show_id, performer_id, role, slot_order, confirmed, set_length)
    values
      (v_s4, v_sam,   'mc',        1, true,  10),
      (v_s4, v_casey, 'opener',    2, true,   8),
      (v_s4, v_riley, 'feature',   3, false, 15),
      (v_s4, v_alex,  'headliner', 4, true,  25);

  -- Show 6 (past Improv Jam)
  insert into show_performers (show_id, performer_id, role, slot_order, confirmed, paid)
    values
      (v_s6, v_morgan, 'performer', 1, true, true),
      (v_s6, v_drew,   'performer', 2, true, true),
      (v_s6, v_alex,   'performer', 3, true, true);

end;
$$;
