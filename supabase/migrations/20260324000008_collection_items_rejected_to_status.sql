-- Replace collection_items.rejected (boolean) with status (text enum)
-- Values: 'available' | 'rejected' | 'used'

ALTER TABLE collection_items
  ADD COLUMN IF NOT EXISTS status text not null default 'available';

-- Migrate existing rejected=true rows
UPDATE collection_items SET status = 'rejected' WHERE rejected = true;

ALTER TABLE collection_items DROP COLUMN IF EXISTS rejected;
