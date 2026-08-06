-- =============================================================================
-- Profile Customization Module — migration
--
-- Run this once in the Supabase SQL Editor (or via `psql`) against the project
-- database. Hibernate (ddl-auto=update) will already add the plain columns
-- below on the backend's next boot, so the app works without this file — but
-- run it anyway for the CHECK constraint and the updated_at trigger, which
-- Hibernate cannot express.
-- =============================================================================

alter table users
    add column if not exists nickname            varchar(20),
    add column if not exists bio                 varchar(100),
    add column if not exists favorite_emoji      varchar(8),
    add column if not exists accent_color        varchar(20) default 'rose',
    add column if not exists avatar_url          text,
    add column if not exists avatar_storage_path text;

-- Fixed accent-color palette (must match ALLOWED_ACCENT_COLORS in
-- ProfileService.java and ACCENT_COLORS in constants/profileOptions.js).
alter table users
    drop constraint if exists users_accent_color_check;
alter table users
    add constraint users_accent_color_check
    check (accent_color is null or accent_color in (
        'soft-pink', 'rose', 'lavender', 'cream', 'sky-blue', 'sage-green'
    ));

-- `users.updated_at` exists but, unlike every other table in this schema, has
-- no trigger keeping it current — without this, profile edits would never
-- change the timestamp. Reuses the set_updated_at() function already defined
-- in date_bucket_list_schema.sql.
drop trigger if exists trg_users_updated_at on users;
create trigger trg_users_updated_at
    before update on users
    for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- Supabase Storage — profile-pictures bucket
-- -----------------------------------------------------------------------------
-- Mirrors the existing memories-storage bucket: public bucket + permissive
-- "public" role policies scoped to this bucket_id (the app has its own JWT
-- auth, not Supabase Auth, so policies can't check auth.uid() and instead
-- rely on the app-level auth already enforced by SecurityConfig/JwtAuthFilter
-- before the frontend ever reaches these upload/delete calls).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-pictures', 'profile-pictures', true, 5242880, array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Allow Public Select on profile-pictures" on storage.objects;
create policy "Allow Public Select on profile-pictures"
    on storage.objects for select
    to public
    using (bucket_id = 'profile-pictures');

drop policy if exists "Allow Public Insert on profile-pictures" on storage.objects;
create policy "Allow Public Insert on profile-pictures"
    on storage.objects for insert
    to public
    with check (bucket_id = 'profile-pictures');

drop policy if exists "Allow Public Update on profile-pictures" on storage.objects;
create policy "Allow Public Update on profile-pictures"
    on storage.objects for update
    to public
    using (bucket_id = 'profile-pictures');

drop policy if exists "Allow Public Delete on profile-pictures" on storage.objects;
create policy "Allow Public Delete on profile-pictures"
    on storage.objects for delete
    to public
    using (bucket_id = 'profile-pictures');
