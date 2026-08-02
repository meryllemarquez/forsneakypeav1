-- =============================================================================
-- Phase 7 — Interactive Love Board Schema
--
-- Run this once in the Supabase SQL Editor (or via `psql`) against the project
-- database. Hibernate is left on ddl-auto=update for day-to-day column drift,
-- but constraints, indexes and triggers below are NOT something Hibernate can
-- express, so they must be applied here directly (same convention as
-- date_bucket_list_schema.sql).
--
-- Design notes
-- ------------
-- * UUID surrogate keys (gen_random_uuid()), matching every other table.
-- * Image columns (paper_image, pin_image, tape_image, image) are plain
--   varchar filenames (e.g. "sticky-yellow.png"), never enums/check
--   constraints — the asset folders under
--   public/assets/love-board/{papers,pins,tapes,stickers} are open-ended and
--   new PNGs must work without a schema change.
-- * attachment_type and mood ARE fixed vocabularies (mirrors the dates.status
--   check-constraint convention), so they get check constraints.
-- * Unlike MemoryFolder/DateEntry, created_at/updated_at are Hibernate-managed
--   (@CreationTimestamp/@UpdateTimestamp on LoveNote/LoveSticker), not
--   DB-trigger-managed — the app works correctly even before this migration
--   is run. The set_updated_at() trigger below is a belt-and-suspenders
--   DB-level backstop for anything that writes to these tables outside the
--   app; it's optional, not required.
-- * No soft-delete here (unlike dates/date_categories) — notes/stickers are
--   hard-deleted, matching the simpler memory_folders/memory_photos precedent.
-- * content_blocks / attachments (added for the multi-text-box canvas editor)
--   are opaque JSON stored as plain text, same free-form convention as
--   `content` — the backend never parses them, only the frontend canvas
--   editor does. Null/blank means the note predates that editor and the
--   frontend falls back to rendering the legacy title/content/attachment_type
--   fields as a single block, so old notes keep working unmodified.
-- =============================================================================

-- Defensive re-create: this function already exists if date_bucket_list_schema.sql
-- has been run, but redefining it here is harmless and makes this file runnable
-- on its own against a fresh database.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- -----------------------------------------------------------------------------
-- 1. love_notes
-- -----------------------------------------------------------------------------
create table if not exists love_notes (
    id                uuid primary key default gen_random_uuid(),
    title             varchar(150),
    content           text,
    content_blocks    text,
    attachments       text,
    paper_image       varchar(120) not null,
    attachment_type   varchar(10) not null default 'NONE'
                          check (attachment_type in ('PIN', 'TAPE', 'NONE')),
    pin_image         varchar(120),
    tape_image        varchar(120),
    color             varchar(20),
    font_family       varchar(60) not null default 'Patrick Hand',
    font_size         integer not null default 18,
    font_color        varchar(20) not null default '#2b2b2b',
    rotation          double precision not null default 0,
    position_x        double precision not null default 0,
    position_y        double precision not null default 0,
    z_index           integer not null default 1,
    is_favorite       boolean not null default false,
    is_archived       boolean not null default false,
    is_private        boolean not null default false,
    mood              varchar(20)
                          check (mood is null or mood in
                              ('LOVING', 'NOSTALGIC', 'PLAYFUL', 'MISSING_YOU', 'GRATEFUL', 'SLEEPY')),
    created_by        bigint references users(id),
    created_at        timestamptz not null default now(),
    updated_at        timestamptz not null default now()
);

create index if not exists idx_love_notes_is_archived on love_notes (is_archived);
create index if not exists idx_love_notes_is_favorite on love_notes (is_favorite);
create index if not exists idx_love_notes_created_by  on love_notes (created_by);
create index if not exists idx_love_notes_updated_at  on love_notes (updated_at desc);

drop trigger if exists trg_love_notes_updated_at on love_notes;
create trigger trg_love_notes_updated_at
    before update on love_notes
    for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- 2. love_stickers — independent board decorations, not tied to any note
-- -----------------------------------------------------------------------------
create table if not exists love_stickers (
    id            uuid primary key default gen_random_uuid(),
    image         varchar(120) not null,
    position_x    double precision not null default 0,
    position_y    double precision not null default 0,
    rotation      double precision not null default 0,
    scale         double precision not null default 1,
    z_index       integer not null default 1,
    is_locked     boolean not null default false,
    created_by    bigint references users(id),
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now()
);

create index if not exists idx_love_stickers_created_by on love_stickers (created_by);

drop trigger if exists trg_love_stickers_updated_at on love_stickers;
create trigger trg_love_stickers_updated_at
    before update on love_stickers
    for each row execute function set_updated_at();
