-- Calendar Dump: lets a highlight photo be repositioned (crop/focus point)
-- within its calendar cell. Stored as CSS background-position percentages
-- (0-100), not pixels, so they stay valid at any cell or export size.

alter table memory_folders
    add column if not exists highlight_photo_position_x double precision default 50,
    add column if not exists highlight_photo_position_y double precision default 50;

-- Supabase's PgBouncer pooling can silently drop an inline DEFAULT on
-- ADD COLUMN — re-assert it as its own statement (same quirk noted in
-- admin_phase8_migration.sql).
alter table memory_folders
    alter column highlight_photo_position_x set default 50;
alter table memory_folders
    alter column highlight_photo_position_y set default 50;

-- Backfill any existing highlighted albums to a centered crop.
update memory_folders
    set highlight_photo_position_x = 50
    where highlight_photo_position_x is null;
update memory_folders
    set highlight_photo_position_y = 50
    where highlight_photo_position_y is null;
