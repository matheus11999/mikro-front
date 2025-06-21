-- SQL MIGRATION PARA SISTEMA DE SAQUES
-- Execute este script no console SQL do Supabase

-- 1. Adicionar colunas para comprovante de pagamento na tabela withdrawals
ALTER TABLE withdrawals 
ADD COLUMN IF NOT EXISTS proof_of_payment_url TEXT,
ADD COLUMN IF NOT EXISTS approved_by TEXT,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- 2. Criar bucket para armazenamento de comprovantes (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('withdrawal-proofs', 'withdrawal-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Política de acesso para upload de comprovantes (apenas admins)
CREATE POLICY "Admins can upload withdrawal proofs" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'withdrawal-proofs' AND
  auth.jwt() ->> 'email' IN (
    SELECT email FROM clientes WHERE role = 'admin'
  )
);

-- 4. Política de acesso para visualização de comprovantes
CREATE POLICY "Anyone can view withdrawal proofs" ON storage.objects
FOR SELECT USING (bucket_id = 'withdrawal-proofs');

-- 5. Função para incrementar saldo do cliente (para reverter saques rejeitados)
CREATE OR REPLACE FUNCTION increment_client_balance(client_id UUID, amount NUMERIC)
RETURNS VOID AS $$
BEGIN
  UPDATE clientes 
  SET saldo = saldo + amount 
  WHERE id = client_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Atualizar política RLS para withdrawals (se não existir)
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- Política para clientes verem apenas seus próprios saques
CREATE POLICY "Users can view own withdrawals" ON withdrawals
FOR SELECT USING (
  cliente_id = (
    SELECT id FROM clientes 
    WHERE email = auth.jwt() ->> 'email'
  )
);

-- Política para clientes criarem saques
CREATE POLICY "Users can create own withdrawals" ON withdrawals
FOR INSERT WITH CHECK (
  cliente_id = (
    SELECT id FROM clientes 
    WHERE email = auth.jwt() ->> 'email'
  )
);

-- Política para admins verem todos os saques
CREATE POLICY "Admins can view all withdrawals" ON withdrawals
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM clientes 
    WHERE email = auth.jwt() ->> 'email' 
    AND role = 'admin'
  )
);

-- Política para admins atualizarem saques
CREATE POLICY "Admins can update withdrawals" ON withdrawals
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM clientes 
    WHERE email = auth.jwt() ->> 'email' 
    AND role = 'admin'
  )
);

-- 7. Atualizar timestamp columns para usar timezone
ALTER TABLE withdrawals 
ALTER COLUMN requestdate TYPE TIMESTAMP WITH TIME ZONE USING requestdate AT TIME ZONE 'UTC',
ALTER COLUMN processeddate TYPE TIMESTAMP WITH TIME ZONE USING processeddate AT TIME ZONE 'UTC';

-- 8. Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_withdrawals_cliente_id ON withdrawals(cliente_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_requestdate ON withdrawals(requestdate DESC);

-- 9. Comentários nas colunas
COMMENT ON COLUMN withdrawals.proof_of_payment_url IS 'URL do comprovante de pagamento uploadado pelo admin';
COMMENT ON COLUMN withdrawals.approved_by IS 'Email do admin que aprovou/rejeitou o saque';
COMMENT ON COLUMN withdrawals.rejection_reason IS 'Motivo da rejeição do saque';
COMMENT ON COLUMN withdrawals.approved_at IS 'Data e hora da aprovação/rejeição';

-- 10. Verificar se todas as colunas necessárias existem
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'withdrawals' 
AND table_schema = 'public'
ORDER BY ordinal_position; 