-- Remove the auto-seed trigger for collections on series creation.
-- Collection setup is now handled in the application layer (create-series-modal step 2),
-- giving producers control over which collections to create from the start.
drop trigger if exists on_series_created on series;
