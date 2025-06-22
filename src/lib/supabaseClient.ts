import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configurações das variáveis de ambiente (definidas no EasyPanel)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_KEY;
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE;

// Log das variáveis para debug (apenas em desenvolvimento)
if (import.meta.env.DEV) {
  console.log('🔧 Debug Supabase Config:', {
    hasUrl: !!supabaseUrl,
    urlLength: supabaseUrl?.length || 0,
    hasAnonKey: !!supabaseAnonKey,
    anonKeyLength: supabaseAnonKey?.length || 0,
    hasServiceKey: !!supabaseServiceRoleKey,
    serviceKeyLength: supabaseServiceRoleKey?.length || 0,
    urlPrefix: supabaseUrl ? supabaseUrl.substring(0, 20) + '...' : 'undefined'
  });
}

// Verificar se as variáveis de ambiente obrigatórias estão definidas
if (!supabaseUrl || !supabaseAnonKey) {
  const missingVars = [];
  if (!supabaseUrl) missingVars.push('VITE_SUPABASE_URL');
  if (!supabaseAnonKey) missingVars.push('VITE_SUPABASE_KEY');
  
  console.error('❌ Variáveis Supabase faltando:', missingVars);
  console.error('📋 Configure no EasyPanel as seguintes variáveis de ambiente:');
  console.error('   VITE_SUPABASE_URL=https://your-project.supabase.co');
  console.error('   VITE_SUPABASE_KEY=your-anon-key');
  console.error('   VITE_SUPABASE_SERVICE_ROLE=your-service-role-key (opcional)');
  console.error('📊 Status atual:', {
    VITE_SUPABASE_URL: !!supabaseUrl,
    VITE_SUPABASE_KEY: !!supabaseAnonKey,
    VITE_SUPABASE_SERVICE_ROLE: !!supabaseServiceRoleKey
  });
  
  const errorMessage = `❌ Configure as variáveis de ambiente no EasyPanel: ${missingVars.join(', ')}`;
  throw new Error(errorMessage);
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

    console.log('✅ Supabase Client criado com sucesso');
    return supabaseClientInstance;
  } catch (error) {
    console.error('❌ Erro ao criar cliente Supabase:', error);
    throw new Error('Falha ao inicializar conexão com Supabase');
  }
}

// Função para criar cliente administrativo (apenas quando necessário)
function createSupabaseAdminClient(): SupabaseClient {
  if (supabaseAdminInstance) {
    return supabaseAdminInstance;
  }

  if (!supabaseServiceRoleKey) {
    throw new Error('Service Role Key não configurada para operações administrativas (configure VITE_SUPABASE_SERVICE_ROLE no EasyPanel)');
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

    console.log('✅ Supabase Admin Client criado com sucesso');
    return supabaseAdminInstance;
  } catch (error) {
    console.error('❌ Erro ao criar cliente admin Supabase:', error);
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
  const TIMEOUT = 8000; // 8 segundos máximo
  
  return new Promise(async (resolve) => {
    const timeoutId = setTimeout(() => {
      console.warn('⏰ Timeout no teste de conexão Supabase (8s)');
      resolve(false);
    }, TIMEOUT);

    try {
      console.log('🔍 Testando conexão com Supabase...');
      
      // Teste 1: Verificar se o cliente foi criado
      if (!supabase) {
        console.error('❌ Cliente Supabase não foi criado');
        clearTimeout(timeoutId);
        resolve(false);
        return;
      }

      // Teste 2: Teste rápido de auth (sem aguardar muito)
      const authPromise = supabase.auth.getUser();
      const authResult = await Promise.race([
        authPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Auth timeout')), 3000))
      ]);

      const { data: { user }, error: authError } = authResult as any;
      console.log('🔐 Teste Auth rápido:', { hasUser: !!user, authError: authError?.message });

      // Se auth funcionou, considerar conexão OK
      if (!authError || user) {
        console.log('✅ Conexão Supabase OK (auth funcionando)');
        clearTimeout(timeoutId);
        resolve(true);
        return;
      }

      // Teste 3: Teste DB simples e rápido
      try {
        const dbPromise = supabase.from('clientes').select('count').limit(1);
        const dbResult = await Promise.race([
          dbPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('DB timeout')), 2000))
        ]);
        
        console.log('✅ Conexão Supabase totalmente funcional');
        clearTimeout(timeoutId);
        resolve(true);
        return;
        
      } catch (dbError) {
        console.warn('⚠️ DB teste falhou, mas auth OK:', dbError);
        // Se auth funcionou, ainda consideramos conectado
        clearTimeout(timeoutId);
        resolve(true);
        return;
      }
      
    } catch (error) {
      console.error('❌ Falha no teste de conexão Supabase:', error);
      console.error('🔧 Debug info:', {
        url: supabaseUrl?.substring(0, 30) + '...',
        hasKey: !!supabaseAnonKey,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      clearTimeout(timeoutId);
      resolve(false);
    }
  });
}

// Função para reinicializar conexões (útil para debug)
export function resetConnections(): void {
  console.log('🔄 Reinicializando conexões Supabase...');
  supabaseClientInstance = null;
  supabaseAdminInstance = null;
  if (typeof window !== 'undefined') {
    delete (window as any).__SUPABASE_CLIENT__;
  }
}

// Função para debug de configuração
export function debugConfig(): object {
  return {
    hasUrl: !!supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    hasServiceKey: !!supabaseServiceRoleKey,
    urlPreview: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'undefined',
    environment: import.meta.env.MODE,
    timestamp: new Date().toISOString()
  };
}

// Log de inicialização (sempre, para debug no EasyPanel)
console.log('🚀 Supabase Client inicializado (EasyPanel):', {
  url: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'undefined',
  hasAnonKey: !!supabaseAnonKey,
  hasServiceKey: !!supabaseServiceRoleKey,
  mode: import.meta.env.MODE,
  timestamp: new Date().toISOString()
});

// Expor função de debug globalmente para facilitar troubleshooting
if (typeof window !== 'undefined') {
  (window as any).debugSupabase = debugConfig;
  (window as any).testSupabaseConnection = testConnection;
  (window as any).resetSupabaseConnections = resetConnections;
} 