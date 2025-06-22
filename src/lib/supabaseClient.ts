import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configurações das variáveis de ambiente (definidas no EasyPanel)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_KEY;
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE;

// Verificar se as variáveis de ambiente obrigatórias estão definidas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Configuração Supabase:', {
    url: !!supabaseUrl,
    anonKey: !!supabaseAnonKey,
    serviceRole: !!supabaseServiceRoleKey
  });
  throw new Error('Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_KEY são obrigatórias (configure no EasyPanel)');
}

// Chave para armazenamento da sessão
const STORAGE_KEY = 'pix-mikro-auth-token';

// Instâncias globais (singleton pattern)
let supabaseClientInstance: SupabaseClient | null = null;
let supabaseAdminInstance: SupabaseClient | null = null;

// Função para criar cliente principal (anônimo/autenticado)
function createSupabaseClient(): SupabaseClient {
  if (supabaseClientInstance) {
    return supabaseClientInstance;
  }

  try {
    supabaseClientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: STORAGE_KEY
      },
      global: {
        headers: {
          'X-Client-Info': 'pix-mikro-web-client'
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
      (window as any).__SUPABASE_CLIENT__ = supabaseClientInstance;
    }

    return supabaseClientInstance;
  } catch (error) {
    console.error('Erro ao criar cliente Supabase:', error);
    throw new Error('Falha ao inicializar conexão com Supabase');
  }
}

// Função para criar cliente administrativo (apenas quando necessário)
function createSupabaseAdminClient(): SupabaseClient {
  if (supabaseAdminInstance) {
    return supabaseAdminInstance;
  }

  if (!supabaseServiceRoleKey) {
    throw new Error('Service Role Key não configurada para operações administrativas (configure no EasyPanel)');
  }

  try {
    supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          'X-Client-Info': 'pix-mikro-admin-client'
        }
      }
    });

    return supabaseAdminInstance;
  } catch (error) {
    console.error('Erro ao criar cliente admin Supabase:', error);
    throw new Error('Falha ao inicializar cliente administrativo Supabase');
  }
}

// Exportar instâncias
export const supabase = createSupabaseClient();
export const supabasePublic = supabase; // Compatibilidade com código existente

// Cliente administrativo (apenas para operações específicas)
export const getSupabaseAdmin = (): SupabaseClient => {
  return createSupabaseAdminClient();
};

// Função utilitária para verificar se a conexão está funcionando
export async function testConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    return !error;
  } catch {
    return false;
  }
}

// Função para reinicializar conexões (útil para debug)
export function resetConnections(): void {
  supabaseClientInstance = null;
  supabaseAdminInstance = null;
  if (typeof window !== 'undefined') {
    delete (window as any).__SUPABASE_CLIENT__;
  }
}

// Log de inicialização (apenas em desenvolvimento)
if (import.meta.env.DEV) {
  console.log('Supabase Client inicializado (EasyPanel):', {
    url: supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    hasServiceKey: !!supabaseServiceRoleKey
  });
} 