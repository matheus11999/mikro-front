import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

// Singleton pattern para evitar múltiplas instâncias
let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  }
  return supabaseInstance;
}

// Renomeado para 'supabasePublic' para clareza.
export const supabasePublic = getSupabaseClient();

// Alias para compatibilidade: módulos antigos que importam { supabase } continuarão funcionando.
export { supabasePublic as supabase }; 