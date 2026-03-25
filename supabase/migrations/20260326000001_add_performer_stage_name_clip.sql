alter table performers
  add column if not exists stage_name text,
  add column if not exists clip_url   text;
