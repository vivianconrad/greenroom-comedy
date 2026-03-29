-- ─── Update seed_demo_data with real-ish demo content ─────────────────────────

create or replace function seed_demo_data()
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_series uuid;
  v_brian  uuid;
  v_leslie uuid;
  v_jenny  uuid;
  v_nikki  uuid;
  v_tig    uuid;
  v_s1     uuid;
  v_s2     uuid;
  v_s3     uuid;
  v_s4     uuid;
  v_s5     uuid;
begin

  -- ── Performers ──────────────────────────────────────────────────────────────
  insert into performers (owner_id, name, pronouns, act_type, instagram, email, contact_method, book_again, audience_favourite, notes)
    values (v_uid, 'Brian Regan', 'he/him', 'standup', '@brianregancomedy', 'brian@brianregan.com', 'email', true, true,
            'Headliner. Clean material, broad appeal. Always sells seats. Needs dressing room with a mirror.')
    returning id into v_brian;

  insert into performers (owner_id, name, pronouns, act_type, instagram, email, contact_method, book_again, audience_favourite, notes)
    values (v_uid, 'Leslie Liu', 'she/her', 'standup', '@leslieliucomedy', 'leslie.liu@gmail.com', 'email', true, false,
            'Strong feature act. Sharp observational stuff. Usually brings 5–10 of her own crowd.')
    returning id into v_leslie;

  insert into performers (owner_id, name, pronouns, act_type, instagram, email, contact_method, book_again, audience_favourite, notes)
    values (v_uid, 'Jenny Tian', 'she/her', 'standup', '@jennytiancomedy', 'jenny@jennytian.com', 'instagram', true, true,
            'Very online. Great for younger crowds. Prefers to go on second. Response her on IG, she checks email rarely.')
    returning id into v_jenny;

  insert into performers (owner_id, name, pronouns, act_type, instagram, email, contact_method, book_again, audience_favourite, notes)
    values (v_uid, 'Nikki Glaser', 'she/her', 'standup', '@nikkiglaser', 'booking@nikkiglaser.com', 'email', true, true,
            'Best closer we''ve had. Crowd goes insane. Go through her manager for booking — direct email is slow.')
    returning id into v_nikki;

  insert into performers (owner_id, name, pronouns, act_type, instagram, email, contact_method, book_again, audience_favourite, notes)
    values (v_uid, 'Tig Notaro', 'she/her', 'standup', '@tignation', 'tig@tignation.com', 'email', true, false,
            'Dry, deadpan, brilliant. Needs a quiet green room — no chaos backstage. Worth every bit of the effort.')
    returning id into v_tig;

  -- ── Series ──────────────────────────────────────────────────────────────────
  insert into series (
    owner_id, name, slug, frequency, show_type, venue, is_one_off,
    default_call_time, default_doors_time, default_show_time,
    tagline,
    contacts
  )
  values (
    v_uid, 'A Standup Show', null, 'weekly', 'standup', 'The Laughing Crow', false,
    '19:00', '19:30', '20:00',
    'Weekly standup showcase — no fuss, just funny',
    '[
      {"id":"00000000-0000-0000-0000-000000000001","name":"Marcus Webb","role":"Venue Manager","phone":"555-0142","email":"marcus@thelaughingcrow.com","notes":"Main point of contact for everything. Text is faster than email."},
      {"id":"00000000-0000-0000-0000-000000000002","name":"Dana Flores","role":"Box Office","phone":"555-0198","email":"boxoffice@thelaughingcrow.com","notes":"Handles the guest list and ticket counts. Send the list by 6pm on show day."},
      {"id":"00000000-0000-0000-0000-000000000003","name":"Pete Okafor","role":"Bar Manager","phone":"555-0261","email":null,"notes":"Coordinates drink tickets and bar tab for performers. Cash out at end of night."}
    ]'::jsonb
  )
  returning id into v_series;

  -- Link all performers to the series
  insert into performer_series (performer_id, series_id) values
    (v_brian,  v_series),
    (v_leslie, v_series),
    (v_jenny,  v_series),
    (v_nikki,  v_series),
    (v_tig,    v_series);

  -- ── Shows ───────────────────────────────────────────────────────────────────

  -- Past show 1 (~3 months ago, done, great night)
  insert into shows (series_id, date, call_time, doors_time, show_time, venue, status,
                     ticket_price, tickets_sold, capacity,
                     notes_attendance, notes_energy, notes_worked, notes_next_time)
    values (v_series, current_date - 90, '19:00', '19:30', '20:00', 'The Laughing Crow', 'done',
            15.00, 82, 90,
            82,
            'Electric from the start. Crowd was warm and loud all the way through.',
            'Nikki closing was the right call — she absolutely destroyed.',
            'Book Brian and Nikki together again. That lineup is magic.')
    returning id into v_s1;

  -- Past show 2 (~2 months ago, done)
  insert into shows (series_id, date, call_time, doors_time, show_time, venue, status,
                     ticket_price, tickets_sold, capacity,
                     notes_attendance, notes_energy, notes_didnt_work)
    values (v_series, current_date - 60, '19:00', '19:30', '20:00', 'The Laughing Crow', 'done',
            15.00, 64, 90,
            64,
            'Slow start. Second half picked up once Jenny warmed the room.',
            'Running order felt off — opener was too dry for a cold crowd.')
    returning id into v_s2;

  -- Past show 3 (~1 month ago, done)
  insert into shows (series_id, date, call_time, doors_time, show_time, venue, status,
                     ticket_price, tickets_sold, capacity,
                     notes_attendance, notes_worked)
    values (v_series, current_date - 30, '19:00', '19:30', '20:00', 'The Laughing Crow', 'done',
            15.00, 76, 90,
            76,
            'Leslie''s set was a standout. Crowd kept quoting her stuff after the show.')
    returning id into v_s3;

  -- Upcoming show (next week, planning — lineup mostly set)
  insert into shows (series_id, date, call_time, doors_time, show_time, venue, status,
                     ticket_price, capacity)
    values (v_series, current_date + 7, '19:00', '19:30', '20:00', 'The Laughing Crow', 'planning',
            15.00, 90)
    returning id into v_s4;

  -- Future show (5 weeks out, planning)
  insert into shows (series_id, date, call_time, doors_time, show_time, venue, status,
                     ticket_price, capacity)
    values (v_series, current_date + 35, '19:00', '19:30', '20:00', 'The Laughing Crow', 'planning',
            15.00, 90)
    returning id into v_s5;

  -- ── Show performers ─────────────────────────────────────────────────────────

  -- Show 1 (past — great night, everyone paid)
  insert into show_performers (show_id, performer_id, role, slot_order, confirmed, paid, set_length, payment_amount, payment_method)
    values
      (v_s1, v_jenny,  'opener',    1, true, true,  8,  25.00, 'cash'),
      (v_s1, v_leslie, 'feature',   2, true, true,  15, 50.00, 'bank transfer'),
      (v_s1, v_brian,  'feature',   3, true, true,  20, 75.00, 'bank transfer'),
      (v_s1, v_nikki,  'headliner', 4, true, true,  25, 150.00, 'bank transfer');

  -- Show 2 (past — slower night)
  insert into show_performers (show_id, performer_id, role, slot_order, confirmed, paid, set_length)
    values
      (v_s2, v_leslie, 'opener',    1, true, true,  8),
      (v_s2, v_jenny,  'feature',   2, true, true,  15),
      (v_s2, v_tig,    'headliner', 3, true, true,  25);

  -- Show 3 (past)
  insert into show_performers (show_id, performer_id, role, slot_order, confirmed, paid, set_length)
    values
      (v_s3, v_jenny,  'opener',    1, true, true,  8),
      (v_s3, v_leslie, 'feature',   2, true, true,  15),
      (v_s3, v_tig,    'headliner', 3, true, true,  25);

  -- Show 4 (upcoming — Tig not yet confirmed)
  insert into show_performers (show_id, performer_id, role, slot_order, confirmed, set_length)
    values
      (v_s4, v_jenny,  'opener',    1, true,  8),
      (v_s4, v_leslie, 'feature',   2, true,  15),
      (v_s4, v_brian,  'feature',   3, true,  20),
      (v_s4, v_tig,    'headliner', 4, false, 25);

end;
$$;
