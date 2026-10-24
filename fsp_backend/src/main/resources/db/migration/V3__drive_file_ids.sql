-- V3: photos now live in Google Drive; rows keep the Drive file id instead of a public URL.
--
-- Existing Supabase rows are untouched: they keep photo_url / storage_path / cover_image_url /
-- avatar_url and are still served from there until their drive_file_id is set.
-- photo_url and storage_path become nullable because a Drive-backed photo has neither.

ALTER TABLE memory_photos ADD COLUMN IF NOT EXISTS drive_file_id text;
ALTER TABLE memory_photos ALTER COLUMN photo_url DROP NOT NULL;
ALTER TABLE memory_photos ALTER COLUMN storage_path DROP NOT NULL;

ALTER TABLE memory_folders ADD COLUMN IF NOT EXISTS cover_drive_file_id text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_drive_file_id text;
ALTER TABLE dates ADD COLUMN IF NOT EXISTS cover_drive_file_id text;
