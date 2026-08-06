import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lfdrhgjgxduijhbdbcbi.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_3d0CF50eIHYWFv7IJxwBzw_5sii6woc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function uploadToSupabaseStorage(file, folderPath = 'photos') {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
  const filePath = `${folderPath}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('memories-storage')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data: publicUrlData } = supabase.storage
    .from('memories-storage')
    .getPublicUrl(filePath);

  return {
    photoUrl: publicUrlData.publicUrl,
    storagePath: data.path,
  };
}

const PROFILE_PICTURES_BUCKET = 'profile-pictures';

// Uploads an already-cropped/compressed avatar blob for the given user.
// Mirrors uploadToSupabaseStorage's shape (photoUrl/storagePath) so both
// helpers can be persisted to the backend the same way.
export async function uploadProfileAvatar(file, userId) {
  const fileExt = (file.name && file.name.split('.').pop()) || 'webp';
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
  const filePath = `avatars/${userId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from(PROFILE_PICTURES_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'image/webp',
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data: publicUrlData } = supabase.storage
    .from(PROFILE_PICTURES_BUCKET)
    .getPublicUrl(filePath);

  return {
    avatarUrl: publicUrlData.publicUrl,
    storagePath: data.path,
  };
}

// Best-effort cleanup of a previous avatar file. Failures are swallowed by the
// caller (the DB record is the source of truth — an orphaned file is a minor
// storage cost, not a correctness issue) so a replace/remove action never
// fails just because the old file was already gone.
export async function deleteProfileAvatar(storagePath) {
  if (!storagePath) return;
  const { error } = await supabase.storage.from(PROFILE_PICTURES_BUCKET).remove([storagePath]);
  if (error) {
    throw new Error(error.message);
  }
}