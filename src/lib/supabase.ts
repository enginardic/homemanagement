import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta as { env: Record<string, string> }).env.VITE_SUPABASE_URL
const supabaseAnonKey = (import.meta as { env: Record<string, string> }).env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('.env dosyasında VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY eksik!')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
