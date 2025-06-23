-- SCRIPT COMPLETO PARA CORRIGIR PROBLEMA DE SAQUES
-- Execute este script no Supabase Dashboard > SQL Editor

-- 1. Verificar estrutura atual da tabela withdrawals
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'withdrawals' 
ORDER BY ordinal_position;

-- 2. Verificar se RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'withdrawals';

-- 3. Verificar políticas existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'withdrawals';

-- 4. Remover políticas existentes (se houver conflitos)
DROP POLICY IF EXISTS "Users can view own withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Users can create own withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Admins can view all withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Admins can update withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Admins can delete withdrawals" ON withdrawals;

-- 5. Criar políticas corretas para withdrawals

-- POLÍTICA 1: Permitir que usuários vejam apenas seus próprios saques
CREATE POLICY "Users can view own withdrawals" ON withdrawals
FOR SELECT 
USING (
  cliente_id IN (
    SELECT id FROM clientes WHERE email = auth.email()
  )
);

-- POLÍTICA 2: Permitir que usuários criem saques para si mesmos
CREATE POLICY "Users can create own withdrawals" ON withdrawals
FOR INSERT 
WITH CHECK (
  cliente_id IN (
    SELECT id FROM clientes WHERE email = auth.email()
  )
);

-- POLÍTICA 3: Admins podem ver todos os saques
CREATE POLICY "Admins can view all withdrawals" ON withdrawals
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM clientes 
    WHERE email = auth.email() 
    AND role = 'admin'
  )
);

-- POLÍTICA 4: Admins podem atualizar saques (aprovar/rejeitar)
CREATE POLICY "Admins can update withdrawals" ON withdrawals
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM clientes 
    WHERE email = auth.email() 
    AND role = 'admin'
  )
);

-- POLÍTICA 5: Apenas admins podem deletar saques
CREATE POLICY "Admins can delete withdrawals" ON withdrawals
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM clientes 
    WHERE email = auth.email() 
    AND role = 'admin'
  )
);

-- 6. Adicionar colunas faltantes na tabela withdrawals
ALTER TABLE withdrawals 
ADD COLUMN IF NOT EXISTS proof_of_payment_url TEXT,
ADD COLUMN IF NOT EXISTS approved_by TEXT,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- 7. Verificar se as políticas foram criadas corretamente
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'withdrawals'
ORDER BY policyname;

-- 8. Teste básico de inserção (substitua o email pelo email do usuário teste)
-- IMPORTANTE: Execute este comando apenas para teste e depois delete o registro
/*
INSERT INTO withdrawals (cliente_id, amount, pixkey, status, requestdate)
VALUES (
  (SELECT id FROM clientes WHERE email = 'mateus12martins@gmail.com'),
  100.00,
  'test@test.com',
  'pending',
  now()
);
*/

-- 9. Verificar dados de teste
SELECT 
  c.nome, 
  c.email, 
  c.saldo, 
  c.role
FROM clientes c 
WHERE c.email IN ('mateus11martins@gmail.com', 'mateus12martins@gmail.com');

-- 10. Limpar teste (descomente se executou o teste acima)
-- DELETE FROM withdrawals WHERE pixkey = 'test@test.com';

-- INSTRUÇÕES DE USO:
-- 1. Execute este script completo no Supabase Dashboard
-- 2. Teste no frontend com o usuário mateus12martins@gmail.com (tem R$ 5000 de saldo)
-- 3. Se der erro, verifique os logs no console do navegador
-- 4. Se necessário, execute o teste de inserção manual comentado acima 