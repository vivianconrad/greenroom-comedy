-- Add missing system duty templates, comm templates, collection presets, and checklist items.

-- ─── Duty templates ───────────────────────────────────────────────────────────

insert into system_duty_templates (duty, time_note, sort_order) values
  ('Videographer / Camera', 'Entire show', 5),
  ('Social media',          'Entire show', 6);

-- ─── Comm templates ───────────────────────────────────────────────────────────

insert into system_comm_templates (name, body, sort_order) values
  (
    'Pre-Show Form Reminder',
    E'Hi [name],\n\nJust a reminder to fill out your pre-show form for [date] at [venue].\n\nWe need your bio, promo photo, walk-up song, and any tech notes before the show.\n\n[formLink]\n\nThanks!',
    4
  ),
  (
    'Post-Show Thank You',
    E'Hi [name],\n\nThank you so much for performing at [date] — you were fantastic!\n\nWe''ll share photos and clips with you soon. Feel free to tag us when you post.\n\nHope to have you back!',
    5
  ),
  (
    'Payment Confirmation',
    E'Hi [name],\n\nJust sent your payment of [amount] via [method]. Thanks again for a great set!\n\nLet me know if you have any issues.',
    6
  );

-- ─── Collection presets ───────────────────────────────────────────────────────

insert into system_collection_presets (name, description, icon, show_type, sort_order) values
  ('Crowd Games', 'Audience participation bits and warm-up games', '🎲', 'variety', 9);

-- ─── Checklist items ──────────────────────────────────────────────────────────

insert into system_checklist_templates (task, category, stage, weeks_out, sort_order) values
  ('Promote to mailing list',         'marketing',  'pre',  2, 31),
  ('Submit to local event listings',  'marketing',  'pre',  3, 32),
  ('Confirm photographer',            'production', 'pre',  2, 33),
  ('Confirm videographer / camera',   'production', 'pre',  2, 34);
