import { createClient } from "@supabase/supabase-js";

// Pull credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Single Supabase client instance used across the entire app
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to get the public URL for any file in Supabase Storage
export function getStorageUrl(bucket: string, path: string) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
