-- Performance audit: memory_folders/memory_photos were created purely via
-- Hibernate ddl-auto=update (no prior migration file defines them), so unlike
-- every other feature table in this app they never got explicit indexes on
-- their foreign key / lookup columns. Postgres does not auto-index plain FK
-- columns (only primary keys and unique constraints), so every folder->photos
-- lookup and every archived/date-range filter was doing a sequential scan.
-- Safe to run any number of times (IF NOT EXISTS).

create index if not exists idx_memory_photos_folder_id
    on memory_photos (folder_id);

create index if not exists idx_memory_folders_created_by
    on memory_folders (created_by);

create index if not exists idx_memory_folders_is_archived
    on memory_folders (is_archived);

create index if not exists idx_memory_folders_event_date
    on memory_folders (event_date);
