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