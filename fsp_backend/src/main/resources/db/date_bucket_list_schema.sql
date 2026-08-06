-- =============================================================================
-- Premium Date Bucket List — Phase 1 Schema
-- (Updated in Phase 3 with the fuller `dates` shape — activity_type,
-- planned_time, duration_minutes, travel_method, special_occasion,
-- reservation_status, and the 6-value status vocabulary. Updated again in
-- Phase 4 with description/due_date/priority on checklist_items. If you
-- already ran an earlier version of this file against Supabase, don't
-- re-run this one — run date_bucket_list_phase3_migration.sql and
-- date_bucket_list_phase4_migration.sql instead, which ALTER the existing
-- tables in place.)
--
-- Run this once in the Supabase SQL Editor (or via `psql`) against the project
-- database. Hibernate is left on ddl-auto=update for day-to-day column drift,
-- but constraints, indexes, triggers and RLS below are NOT something Hibernate
-- can express, so they must be applied here directly.
--
-- Design notes
-- ------------
-- * Every table uses a UUID surrogate key (gen_random_uuid(), pgcrypto/pgcore
--   built-in on Supabase) to match the existing memory_folders/memory_photos
--   tables and to keep IDs non-guessable and mergeable across environments.
-- * Soft delete: every table has `deleted_at timestamptz NULL`. A row is
--   considered "deleted" when this is non-null. Nothing is ever hard-deleted
--   by the application; hard deletes are a manual DBA action.
-- * `is_archived` (on `dates` only) is a *separate* concept from soft delete —
--   it is a user-facing "put this away, I'm not planning it right now" state,
--   while `deleted_at` is a trash/recycle-bin state used by Delete/Restore.
-- * updated_at is maintained by the trigger below, not by the application, so
--   it's mapped `insertable = false, updatable = false` on the Java side
--   (same convention already used by User/MemoryFolder/MemoryPhoto).
-- * Polymorphic associations (favorites -> {date, checklist_item}, attachments
--   -> {date, checklist_item}) are modeled as (type, id) pairs rather than a
--   real FK, because Postgres cannot enforce a single FK against multiple
--   parent tables. Referential integrity for these is enforced in the service
--   layer, not the database.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Shared trigger: keep updated_at current on every UPDATE.
-- -----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- -----------------------------------------------------------------------------
-- 1. date_categories
-- -----------------------------------------------------------------------------
create table if not exists date_categories (
    id            uuid primary key default gen_random_uuid(),
    name          varchar(60) not null,
    color_hex     varchar(20) not null default '#C73616',
    icon          varchar(30),
    description   text,
    created_by    bigint references users(id),
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now(),
    deleted_at    timestamptz
);

-- Case-insensitive uniqueness among *active* categories only, so a soft-deleted
-- "Outdoor" category doesn't block recreating "Outdoor" later.
create unique index if not exists uq_date_categories_name_active
    on date_categories (lower(name))
    where deleted_at is null;

create index if not exists idx_date_categories_deleted_at on date_categories (deleted_at);

drop trigger if exists trg_date_categories_updated_at on date_categories;
create trigger trg_date_categories_updated_at
    before update on date_categories
    for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- 2. dates — the bucket-list entries themselves
-- -----------------------------------------------------------------------------
create table if not exists dates (
    id                   uuid primary key default gen_random_uuid(),
    category_id          uuid references date_categories(id) on delete set null,
    title                varchar(150) not null,
    description          text,
    location             varchar(200),
    planned_date         date,
    planned_time         time,
    duration_minutes     integer,
    activity_type        varchar(50),
    travel_method        varchar(50),
    special_occasion     varchar(150),
    status               varchar(20) not null default 'DREAMING'
                             check (status in ('DREAMING', 'PLANNING', 'BOOKED', 'READY', 'COMPLETED', 'CANCELLED')),
    priority             varchar(10) not null default 'MEDIUM'
                             check (priority in ('LOW', 'MEDIUM', 'HIGH')),
    reservation_status   varchar(20) not null default 'NOT_NEEDED'
                             check (reservation_status in ('NOT_NEEDED', 'PENDING', 'CONFIRMED', 'CANCELLED')),
    estimated_cost       numeric(10, 2),
    cover_image_url      text,
    is_archived          boolean not null default false,
    created_by           bigint references users(id),
    created_at           timestamptz not null default now(),
    updated_at           timestamptz not null default now(),
    deleted_at           timestamptz
);

create index if not exists idx_dates_category_id  on dates (category_id);
create index if not exists idx_dates_status        on dates (status);
create index if not exists idx_dates_is_archived    on dates (is_archived);
create index if not exists idx_dates_deleted_at     on dates (deleted_at);
create index if not exists idx_dates_created_by     on dates (created_by);
create index if not exists idx_dates_planned_date   on dates (planned_date);
-- Common list-page query: active, non-archived dates ordered by recency.
create index if not exists idx_dates_active_lookup
    on dates (is_archived, created_at desc)
    where deleted_at is null;

drop trigger if exists trg_dates_updated_at on dates;
create trigger trg_dates_updated_at
    before update on dates
    for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- 3. checklist_items — sub-tasks/steps belonging to a date
-- -----------------------------------------------------------------------------
create table if not exists checklist_items (
    id            uuid primary key default gen_random_uuid(),
    date_id       uuid not null references dates(id) on delete cascade,
    title         varchar(200) not null,
    description   text,
    due_date      date,
    priority      varchar(10) not null default 'MEDIUM'
                      check (priority in ('LOW', 'MEDIUM', 'HIGH')),
    is_completed  boolean not null default false,
    sort_order    integer not null default 0,
    completed_at  timestamptz,
    completed_by  bigint references users(id),
    created_by    bigint references users(id),
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now(),
    deleted_at    timestamptz
);

create index if not exists idx_checklist_items_date_id    on checklist_items (date_id);
create index if not exists idx_checklist_items_deleted_at on checklist_items (deleted_at);
create index if not exists idx_checklist_items_due_date   on checklist_items (due_date);
create index if not exists idx_checklist_items_order
    on checklist_items (date_id, sort_order)
    where deleted_at is null;

drop trigger if exists trg_checklist_items_updated_at on checklist_items;
create trigger trg_checklist_items_updated_at
    before update on checklist_items
    for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- 4. notifications — per-user, app-facing notifications
-- -----------------------------------------------------------------------------
create table if not exists notifications (
    id                   uuid primary key default gen_random_uuid(),
    user_id              bigint not null references users(id),
    type                 varchar(30) not null
                             check (type in ('REMINDER', 'CHECKLIST_UPDATE', 'DATE_CREATED',
                                              'DATE_COMPLETED', 'SYSTEM')),
    title                varchar(150) not null,
    message              text,
    related_entity_type  varchar(30)
                             check (related_entity_type in ('DATE', 'CHECKLIST_ITEM', 'CATEGORY',
                                                             'REMINDER', 'ATTACHMENT')),
    related_entity_id    uuid,
    is_read              boolean not null default false,
    read_at              timestamptz,
    created_at           timestamptz not null default now(),
    updated_at           timestamptz not null default now(),
    deleted_at           timestamptz
);

create index if not exists idx_notifications_user_id     on notifications (user_id);
create index if not exists idx_notifications_is_read      on notifications (user_id, is_read);
create index if not exists idx_notifications_deleted_at   on notifications (deleted_at);
create index if not exists idx_notifications_related      on notifications (related_entity_type, related_entity_id);

drop trigger if exists trg_notifications_updated_at on notifications;
create trigger trg_notifications_updated_at
    before update on notifications
    for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- 5. activity_logs — audit trail of who did what
-- -----------------------------------------------------------------------------
create table if not exists activity_logs (
    id           uuid primary key default gen_random_uuid(),
    user_id      bigint references users(id),
    action       varchar(50) not null,
    entity_type  varchar(30) not null
                     check (entity_type in ('DATE', 'CHECKLIST_ITEM', 'CATEGORY',
                                             'REMINDER', 'ATTACHMENT')),
    entity_id    uuid,
    metadata     jsonb,
    created_at   timestamptz not null default now(),
    updated_at   timestamptz not null default now(),
    deleted_at   timestamptz
);

create index if not exists idx_activity_logs_user_id    on activity_logs (user_id);
create index if not exists idx_activity_logs_entity      on activity_logs (entity_type, entity_id);
create index if not exists idx_activity_logs_created_at  on activity_logs (created_at desc);
create index if not exists idx_activity_logs_deleted_at  on activity_logs (deleted_at);

drop trigger if exists trg_activity_logs_updated_at on activity_logs;
create trigger trg_activity_logs_updated_at
    before update on activity_logs
    for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- 6. favorites — polymorphic "starred" items, per user
-- -----------------------------------------------------------------------------
create table if not exists favorites (
    id              uuid primary key default gen_random_uuid(),
    user_id         bigint not null references users(id),
    favorable_type  varchar(20) not null check (favorable_type in ('DATE', 'CHECKLIST_ITEM')),
    favorable_id    uuid not null,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),
    deleted_at      timestamptz
);

create unique index if not exists uq_favorites_user_target_active
    on favorites (user_id, favorable_type, favorable_id)
    where deleted_at is null;

create index if not exists idx_favorites_target      on favorites (favorable_type, favorable_id);
create index if not exists idx_favorites_deleted_at   on favorites (deleted_at);

drop trigger if exists trg_favorites_updated_at on favorites;
create trigger trg_favorites_updated_at
    before update on favorites
    for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- 7. attachments — polymorphic files (photos, receipts, docs, ...)
-- -----------------------------------------------------------------------------
create table if not exists attachments (
    id               uuid primary key default gen_random_uuid(),
    attachable_type  varchar(20) not null check (attachable_type in ('DATE', 'CHECKLIST_ITEM')),
    attachable_id    uuid not null,
    file_url         text not null,
    storage_path     text not null,
    file_name        varchar(255),
    file_type        varchar(50),
    file_size_bytes  bigint,
    uploaded_by      bigint references users(id),
    created_at       timestamptz not null default now(),
    updated_at       timestamptz not null default now(),
    deleted_at       timestamptz
);

create index if not exists idx_attachments_target     on attachments (attachable_type, attachable_id);
create index if not exists idx_attachments_deleted_at  on attachments (deleted_at);

drop trigger if exists trg_attachments_updated_at on attachments;
create trigger trg_attachments_updated_at
    before update on attachments
    for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- 8. reminders — scheduled nudges tied to a date
-- -----------------------------------------------------------------------------
create table if not exists reminders (
    id          uuid primary key default gen_random_uuid(),
    date_id     uuid not null references dates(id) on delete cascade,
    user_id     bigint not null references users(id),
    remind_at   timestamptz not null,
    channel     varchar(10) not null default 'APP' check (channel in ('APP', 'EMAIL')),
    message     varchar(255),
    is_sent     boolean not null default false,
    sent_at     timestamptz,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now(),
    deleted_at  timestamptz
);

create index if not exists idx_reminders_date_id      on reminders (date_id);
create index if not exists idx_reminders_user_id       on reminders (user_id);
create index if not exists idx_reminders_due            on reminders (remind_at) where is_sent = false and deleted_at is null;
create index if not exists idx_reminders_deleted_at     on reminders (deleted_at);

drop trigger if exists trg_reminders_updated_at on reminders;
create trigger trg_reminders_updated_at
    before update on reminders
    for each row execute function set_updated_at();

-- =============================================================================
-- Row Level Security
-- -----------------------------------------------------------------------------
-- IMPORTANT — read before assuming this locks things down the way Supabase
-- RLS usually does: this backend does NOT authenticate to Postgres as the
-- Supabase `anon`/`authenticated` roles with a per-request JWT. It connects
-- once as the pooler user (postgres.<project-ref>) and does its own
-- authentication/authorization in the Spring Security + JWT layer
-- (SecurityConfig / JwtAuthenticationFilter). Because that pooler role owns
-- these tables, RLS does not apply to the backend's own queries.
--
-- What RLS *does* buy here: the frontend already talks to Supabase directly
-- for Storage (see fsp_frontend/src/api/supabaseClient.js), using the public
-- anon key. Enabling RLS with no policies for anon/authenticated closes off
-- the possibility of that same anon key ever being used to read/write these
-- tables directly via PostgREST/supabase-js `.from(...)` — all data access
-- is forced through the Spring Boot API. If a future phase needs the
-- frontend to query Supabase directly, add explicit, narrow policies here
-- rather than opening these tables up broadly.
-- =============================================================================
alter table date_categories enable row level security;
alter table dates            enable row level security;
alter table checklist_items  enable row level security;
alter table notifications    enable row level security;
alter table activity_logs    enable row level security;
alter table favorites        enable row level security;
alter table attachments      enable row level security;
alter table reminders        enable row level security;

-- No policies are created for anon/authenticated: with RLS enabled and zero
-- policies, every role except the table owner is denied by default.
