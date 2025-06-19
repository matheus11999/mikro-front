import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

// Verificar se as variáveis de ambiente estão definidas
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_KEY são obrigatórias');
}

// Singleton pattern global para evitar múltiplas instâncias
declare global {
  var __supabase_client__: SupabaseClient | undefined;
}

function getSupabaseClient(): SupabaseClient {
  if (!globalThis.__supabase_client__) {
    globalThis.__supabase_client__ = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false, // Desabilitar sessão persistente para evitar problemas de refresh token
        autoRefreshToken: false, // Desabilitar refresh automático
        detectSessionInUrl: false // Desabilitar detecção de sessão na URL
      },
      global: {
        headers: {
          'X-Client-Info': 'supabase-js-web'
        }
      }
    });
  }
  return globalThis.__supabase_client__;
}

// Exportar instância única
export const supabase = getSupabaseClient();
export const supabasePublic = supabase; 