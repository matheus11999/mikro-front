import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

// Verificar se as variáveis de ambiente estão definidas
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_KEY são obrigatórias');
}

// Singleton pattern para evitar múltiplas instâncias
const STORAGE_KEY = 'pix-mikro-auth-token';

// Verificar se já existe uma instância global
if (typeof window !== 'undefined' && (window as any).__SUPABASE_CLIENT__) {
  console.warn('Reutilizando instância existente do Supabase');
}

const supabaseInstance = createClient(supabaseUrl, supabaseKey, {
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
  (window as any).__SUPABASE_CLIENT__ = supabaseInstance;
}

// Exportar instância única
export const supabase = supabaseInstance;
export const supabasePublic = supabaseInstance; 