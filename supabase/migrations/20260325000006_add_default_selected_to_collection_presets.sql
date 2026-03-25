-- Add default_selected to system_collection_presets so the wizard can show
-- some collections pre-checked and others available but unchecked.

alter table system_collection_presets
  add column if not exists default_selected boolean not null default true;

-- Base presets: only Themes is on by default
update system_collection_presets set default_selected = false where name = 'Bits & Ideas' and show_type is null;
update system_collection_presets set default_selected = false where name = 'Prize Ideas'  and show_type is null;

-- Type-specific presets: key ones on, secondary ones off
update system_collection_presets set default_selected = false where name = 'Segments' and show_type = 'variety';
update system_collection_presets set default_selected = false where name = 'Openers'  and show_type = 'standup';
update system_collection_presets set default_selected = false where name = 'Formats'  and show_type = 'sketch';
