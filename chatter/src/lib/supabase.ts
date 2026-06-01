import { createClient } from "@supabase/supabase-js";

// Pulls Supabase credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Creates a single Supabase client to be used across the entire app
// This handles auth, database queries, and storage
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to get the public URL for a file in Supabase Storage
export function getStorageUrl(bucket: string, path: string) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
