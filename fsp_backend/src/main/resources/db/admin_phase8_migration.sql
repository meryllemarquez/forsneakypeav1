-- -----------------------------------------------------------------------------
-- Phase 8 — Admin Control Center
-- Widens notifications/activity_logs to cover every module (previously only
-- Date Bucket List events were representable), and adds the audit_trail table
-- for admin-initiated actions specifically.
-- -----------------------------------------------------------------------------

-- 1. notifications.type — add the notification categories the Admin Control
--    Center needs beyond the original Date-only set.
alter table notifications drop constraint if exists notifications_type_check;
alter table notifications add constraint notifications_type_check
    check (type in (
        'REMINDER', 'CHECKLIST_UPDATE', 'DATE_CREATED', 'DATE_COMPLETED', 'DATE_UPDATED',
        'MEMORY_CREATED', 'MEMORY_DELETED', 'GALLERY_UPLOAD', 'LOVE_NOTE_CREATED',
        'PROFILE_CHANGED', 'ADMIN_ACTION', 'SYSTEM'
    ));

-- 2. notifications.related_entity_type / activity_logs.entity_type — add the
--    entity kinds outside the Date Bucket List module.
alter table notifications drop constraint if exists notifications_related_entity_type_check;
alter table notifications add constraint notifications_related_entity_type_check
    check (related_entity_type in (
        'DATE', 'CHECKLIST_ITEM', 'CATEGORY', 'REMINDER', 'ATTACHMENT',
        'MEMORY_FOLDER', 'MEMORY_PHOTO', 'LOVE_NOTE', 'LOVE_STICKER', 'USER'
    ));

alter table activity_logs drop constraint if exists activity_logs_entity_type_check;
alter table activity_logs add constraint activity_logs_entity_type_check
    check (entity_type in (
        'DATE', 'CHECKLIST_ITEM', 'CATEGORY', 'REMINDER', 'ATTACHMENT',
        'MEMORY_FOLDER', 'MEMORY_PHOTO', 'LOVE_NOTE', 'LOVE_STICKER', 'USER'
    ));

-- activity_logs.status — the admin Activity Log table has a Status column;
-- every log written so far is written after a successful mutation, so
-- default existing/new rows to SUCCESS.
alter table activity_logs add column if not exists status varchar(20) not null default 'SUCCESS';

-- 3. audit_trail — every admin-initiated action, never pruned, with a
--    before/after snapshot. Separate from activity_logs (which covers
--    ordinary user actions across all modules).
create table if not exists audit_trail (
    id              uuid primary key default gen_random_uuid(),
    actor_id        bigint not null references users(id),
    entity          varchar(50) not null,
    entity_id       uuid,
    action          varchar(50) not null,
    before_data     jsonb,
    after_data      jsonb,
    changed_fields  jsonb,
    reason          text,
    created_at      timestamptz not null default now()
);

create index if not exists idx_audit_trail_actor_id   on audit_trail (actor_id);
create index if not exists idx_audit_trail_entity      on audit_trail (entity, entity_id);
create index if not exists idx_audit_trail_created_at  on audit_trail (created_at desc);

-- 4. Defensive re-assertion of column defaults. When this file was applied
--    through a pooled connection (Supabase's PgBouncer transaction-pooling
--    port) as one batched multi-statement run, the inline DEFAULT clauses
--    above on ADD COLUMN / CREATE TABLE were silently dropped even though
--    the column/table/constraint itself was created correctly — a pooler
--    quirk, not a Postgres semantics issue. Re-stating each default as its
--    own standalone statement is what actually made it stick. Safe to
--    re-run any time.
alter table activity_logs alter column status set default 'SUCCESS';
update activity_logs set status = 'SUCCESS' where status is null;
alter table activity_logs alter column status set not null;

alter table activity_logs alter column created_at set default now();
update activity_logs set created_at = coalesce(updated_at, now()) where created_at is null;

alter table notifications alter column created_at set default now();
update notifications set created_at = coalesce(updated_at, now()) where created_at is null;

alter table audit_trail alter column created_at set default now();
