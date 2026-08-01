-- =============================================================================
-- Premium Date Bucket List — Phase 4 migration
-- Run this once in the Supabase SQL Editor, AFTER date_bucket_list_schema.sql
-- (and after date_bucket_list_phase3_migration.sql, if that one applied to
-- your database instead of the fresh schema file). Purely additive: extends
-- the existing checklist_items table from Phase 1 — no new tables, nothing
-- dropped or renamed.
--
-- Adds what the Phase 4 checklist experience needs that Phase 1 didn't store:
-- an optional description, an optional due date, and a priority level per
-- step (reusing the same LOW/MEDIUM/HIGH vocabulary as dates.priority).
-- =============================================================================

alter table checklist_items add column if not exists description text;
alter table checklist_items add column if not exists due_date date;
alter table checklist_items add column if not exists priority varchar(10) default 'MEDIUM';

update checklist_items set priority = 'MEDIUM' where priority is null;

alter table checklist_items alter column priority set not null;

alter table checklist_items drop constraint if exists checklist_items_priority_check;
alter table checklist_items add constraint checklist_items_priority_check
    check (priority in ('LOW', 'MEDIUM', 'HIGH'));

create index if not exists idx_checklist_items_due_date on checklist_items (due_date);
