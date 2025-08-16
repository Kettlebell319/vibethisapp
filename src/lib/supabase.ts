import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Helper function to check if URL is valid
const isValidUrl = (url: string | undefined): boolean => {
  if (!url || url === 'your_supabase_url_here') return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Helper function to check if key is valid
const isValidKey = (key: string | undefined): boolean => {
  return !!(key && key !== 'your_supabase_anon_key_here' && key !== 'your_supabase_service_role_key_here' && key.length > 10);
}

// Create clients only if all required env vars are present and valid
export const supabase = isValidUrl(supabaseUrl) && isValidKey(supabaseAnonKey)
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null

// For server-side operations
export const supabaseAdmin = isValidUrl(supabaseUrl) && isValidKey(supabaseServiceKey)
  ? createClient(supabaseUrl!, supabaseServiceKey!)
  : null

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey && supabaseServiceKey)
}