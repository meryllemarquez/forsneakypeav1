-- =============================================================================
-- Premium Date Bucket List — Phase 3 migration
-- Run this once in the Supabase SQL Editor, AFTER date_bucket_list_schema.sql.
-- Purely additive: new nullable columns + a widened status vocabulary. Nothing
-- existing is dropped, renamed, or made non-nullable, so it is safe to run
-- whether or not any `dates` rows already exist.
--
-- Why these columns: the Phase 3 UI (premium cards + detail drawer) surfaces
-- Activity Type, Time, Expected Duration, Travel Method, Reservation Status
-- and Special Occasion, none of which existed in the Phase 1 schema. Rather
-- than fabricate them in the UI, they're stored for real.
-- =============================================================================

alter table dates add column if not exists activity_type varchar(50);
alter table dates add column if not exists planned_time time;
alter table dates add column if not exists duration_minutes integer;
alter table dates add column if not exists travel_method varchar(50);
alter table dates add column if not exists special_occasion varchar(150);
alter table dates add column if not exists reservation_status varchar(20)
    default 'NOT_NEEDED';

-- Backfill the default onto any pre-existing rows the DEFAULT clause above
-- doesn't retroactively touch, then constrain the column.
update dates set reservation_status = 'NOT_NEEDED' where reservation_status is null;

alter table dates drop constraint if exists dates_reservation_status_check;
alter table dates add constraint dates_reservation_status_check
    check (reservation_status in ('NOT_NEEDED', 'PENDING', 'CONFIRMED', 'CANCELLED'));

-- Widen the status vocabulary: PLANNED/COMPLETED/CANCELLED -> the full
-- Dreaming -> Planning -> Booked -> Ready -> Completed/Cancelled lifecycle.
-- Existing 'PLANNED' rows become 'PLANNING' (the closest equivalent) so the
-- constraint swap below doesn't orphan any live data.
update dates set status = 'PLANNING' where status = 'PLANNED';

alter table dates drop constraint if exists dates_status_check;
alter table dates add constraint dates_status_check
    check (status in ('DREAMING', 'PLANNING', 'BOOKED', 'READY', 'COMPLETED', 'CANCELLED'));

alter table dates alter column status set default 'DREAMING';
