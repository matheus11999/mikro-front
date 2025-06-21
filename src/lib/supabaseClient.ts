import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

// Verificar se as variáveis de ambiente estão definidas
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_KEY são obrigatórias');
}

// Singleton pattern para evitar múltiplas instâncias
const STORAGE_KEY = 'pix-mikro-auth-token';

// Função para criar ou reutilizar a instância do Supabase
function createSupabaseClient() {
  // Verificar se já existe uma instância global
  if (typeof window !== 'undefined' && (window as any).__SUPABASE_CLIENT__) {
    return (window as any).__SUPABASE_CLIENT__;
  }

  const instance = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: STORAGE_KEY
    },
    global: {
      headers: {
        'X-Client-Info': 'pix-mikro-web'
      }
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  });

  // Armazenar globalmente para evitar múltiplas instâncias
  if (typeof window !== 'undefined') {
    (window as any).__SUPABASE_CLIENT__ = instance;
  }

  return instance;
}

// Exportar instância única
export const supabase = createSupabaseClient();
export const supabasePublic = supabase; 