import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zzfugxcsinasxrhcwvcp.supabase.co';
const supabaseServiceRole = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6ZnVneGNzaW5hc3hyaGN3dmNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjA1MSwiZXhwIjoyMDY1NzU4MDUxfQ.a8bDJlXu9njwn-PZ3Dg4Hf2FMmnWioxlagTfuSSezpg';

// Singleton pattern para evitar múltiplas instâncias
let supabaseAdminInstance: SupabaseClient | null = null;

function getSupabaseAdmin() {
  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceRole, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return supabaseAdminInstance;
}

export const supabaseAdmin = getSupabaseAdmin();

// Função para configurar as políticas
export async function setupPolicies() {
  try {
    const tables = ['macs', 'vendas', 'planos', 'mikrotiks', 'senhas', 'profiles'];

    // Primeiro, vamos remover todas as políticas existentes
    for (const table of tables) {
      try {
        await supabaseAdmin.rpc('drop_policies', { table_name: table });
        console.log(`Políticas removidas para tabela ${table}`);
      } catch (error) {
        console.log(`Erro ao remover políticas da tabela ${table}:`, error);
      }
    }

    // Agora vamos criar novas políticas permissivas
    for (const table of tables) {
      try {
        // Desabilitar RLS primeiro
        const { error: disableError } = await supabaseAdmin
          .from(table)
          .select('*')
          .limit(1)
          .single();

        if (disableError?.message?.includes('Row level security')) {
          await supabaseAdmin.rpc('disable_rls', { table_name: table });
          console.log(`RLS desabilitado para tabela ${table}`);
        }

        // Criar política permissiva para SELECT
        await supabaseAdmin.rpc('create_policy', {
          table_name: table,
          name: `enable_select_for_all_${table}`,
          definition: 'true',
          command: 'SELECT'
        });

        // Criar política permissiva para INSERT
        await supabaseAdmin.rpc('create_policy', {
          table_name: table,
          name: `enable_insert_for_all_${table}`,
          definition: 'true',
          check_definition: 'true',
          command: 'INSERT'
        });

        // Criar política permissiva para UPDATE
        await supabaseAdmin.rpc('create_policy', {
          table_name: table,
          name: `enable_update_for_all_${table}`,
          definition: 'true',
          check_definition: 'true',
          command: 'UPDATE'
        });

        // Criar política permissiva para DELETE
        await supabaseAdmin.rpc('create_policy', {
          table_name: table,
          name: `enable_delete_for_all_${table}`,
          definition: 'true',
          command: 'DELETE'
        });

        console.log(`Políticas criadas para tabela ${table}`);
      } catch (error) {
        console.error(`Erro ao configurar políticas para tabela ${table}:`, error);
      }
    }

    console.log('Todas as políticas foram configuradas com sucesso!');
  } catch (error) {
    console.error('Erro ao configurar políticas:', error);
    throw error;
  }
}

// Função para verificar políticas
export async function checkPolicies() {
  try {
    const tables = ['macs', 'vendas', 'planos', 'mikrotiks', 'senhas', 'profiles'];
    const policies = [];

    for (const table of tables) {
      // Tenta fazer um SELECT
      const { data: selectData, error: selectError } = await supabaseAdmin
        .from(table)
        .select('*')
        .limit(1);

      policies.push({
        table,
        select: selectError ? { status: 'error', error: selectError.message } : { status: 'success' }
      });
    }

    console.log('Status das políticas:', JSON.stringify(policies, null, 2));
    return policies;
  } catch (error) {
    console.error('Erro ao verificar políticas:', error);
    throw error;
  }
}

// Função para remover todas as políticas
export async function removePolicies() {
  try {
    const tables = ['macs', 'vendas', 'planos', 'mikrotiks', 'senhas', 'profiles'];
    for (const table of tables) {
      try {
        await supabaseAdmin.rpc('drop_policies', { table_name: table });
        console.log(`Políticas removidas para tabela ${table}`);
      } catch (error) {
        console.error(`Erro ao remover políticas da tabela ${table}:`, error);
      }
    }
    console.log('Todas as políticas foram removidas com sucesso!');
  } catch (error) {
    console.error('Erro ao remover políticas:', error);
    throw error;
  }
} 