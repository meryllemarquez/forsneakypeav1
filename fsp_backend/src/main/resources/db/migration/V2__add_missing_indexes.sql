-- V2: indexes that are defined in db/*.sql but did NOT exist in the live database.
--
-- Approved 2026-10-23. Applied by Flyway on the next deploy.
--
-- All statements are idempotent (IF NOT EXISTS). Plain CREATE INDEX takes a short write lock
-- on the table; the tables involved are tiny, so this is not a concern here.

-- love_board_schema.sql
CREATE INDEX IF NOT EXISTS idx_love_notes_is_archived ON love_notes (is_archived);
CREATE INDEX IF NOT EXISTS idx_love_notes_is_favorite ON love_notes (is_favorite);
CREATE INDEX IF NOT EXISTS idx_love_notes_created_by ON love_notes (created_by);
CREATE INDEX IF NOT EXISTS idx_love_notes_updated_at ON love_notes (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_love_stickers_created_by ON love_stickers (created_by);

-- calendar_dump_migration.sql -- NOT included above on purpose, needs a separate decision:
-- it is a UNIQUE index, so it enforces "at most one calendar-highlight album per date" in the
-- database. That rule is not enforced in live today, and the CREATE fails if existing rows
-- already violate it. Uncomment only after checking the data and the app's behaviour.
-- CREATE UNIQUE INDEX IF NOT EXISTS memory_folders_calendar_date_unique
--     ON memory_folders (event_date)
--     WHERE is_calendar_highlight = true AND highlight_photo_id IS NOT NULL;
