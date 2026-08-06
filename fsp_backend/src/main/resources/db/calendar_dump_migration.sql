-- Calendar Dump feature: lets an album carry a real "date it happened" and
-- (optionally) be highlighted with a single photo on the Memories calendar.

alter table memory_folders
    add column if not exists event_date            date,
    add column if not exists is_calendar_highlight  boolean default false,
    add column if not exists highlight_photo_id     uuid;

-- Supabase's PgBouncer pooling can silently drop an inline DEFAULT on
-- ADD COLUMN, same quirk noted in admin_phase8_migration.sql — re-assert it
-- as its own statement.
alter table memory_folders
    alter column is_calendar_highlight set default false;

-- Enforce "one highlighted memory per day" at the data layer, not just in
-- application code. Partial index so folders without a calendar highlight
-- (the common case) never collide with each other.
create unique index if not exists memory_folders_calendar_date_unique
    on memory_folders (event_date)
    where is_calendar_highlight = true and highlight_photo_id is not null;
