-- Add promo_code to shows
alter table shows
  add column if not exists promo_code text;

-- Add ticket_url and promo_code to series (series-level defaults)
alter table series
  add column if not exists ticket_url  text,
  add column if not exists promo_code  text;
