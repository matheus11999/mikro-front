-- IMPORTANTE: Execute este SQL no Supabase para habilitar a segurança RLS
-- Isso é CRÍTICO para a segurança da aplicação

-- Habilitar RLS em todas as tabelas
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mikrotiks ENABLE ROW LEVEL SECURITY;
ALTER TABLE planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE senhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE macs ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- Verificar se RLS foi habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM 
    pg_tables
WHERE 
    schemaname = 'public'
    AND tablename IN ('clientes', 'mikrotiks', 'planos', 'senhas', 'vendas', 'macs', 'withdrawals')
ORDER BY 
    tablename;

-- As políticas já foram criadas anteriormente, mas RLS estava desabilitado
-- Com RLS habilitado, as políticas existentes começarão a funcionar 