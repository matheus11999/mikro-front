# CORREÇÕES - PROBLEMA DE SAQUES RLS

## Problema Identificado

A tabela `withdrawals` tem Row Level Security (RLS) habilitado mas não possui políticas de segurança configuradas, impedindo que usuários façam INSERT/SELECT/UPDATE na tabela.

## Erro Encontrado
```
ERROR: 42501: permission denied for table withdrawals
```

## Solução

### 1. Criar Políticas RLS para Withdrawals

Execute os seguintes comandos SQL no Supabase Dashboard:

```sql
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
```

### 2. Verificar Estrutura da Tabela

A tabela withdrawals precisa ter as seguintes colunas:
- `id` (uuid, primary key)
- `cliente_id` (uuid, foreign key para clientes)
- `amount` (numeric)
- `pixkey` (text)
- `status` (text)
- `requestdate` (timestamp)
- `processeddate` (timestamp, nullable)
- `proof_of_payment_url` (text, nullable)
- `approved_by` (text, nullable)
- `rejection_reason` (text, nullable)
- `approved_at` (timestamp, nullable)

### 3. Script de Verificação

```sql
-- Verificar se as políticas foram criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'withdrawals';

-- Testar inserção (substitua pelo email correto)
SELECT id FROM clientes WHERE email = 'mateus12martins@gmail.com';
```

### 4. Colunas Faltantes

Se necessário, adicionar colunas que estão no frontend mas podem não estar no banco:

```sql
-- Adicionar colunas se não existirem
ALTER TABLE withdrawals 
ADD COLUMN IF NOT EXISTS proof_of_payment_url TEXT,
ADD COLUMN IF NOT EXISTS approved_by TEXT,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
```

## Status da Correção

✅ **Problema identificado**: RLS habilitado sem políticas
🔄 **Pendente**: Execução dos scripts SQL no Supabase Dashboard
⏳ **Teste**: Validar que usuários conseguem solicitar saques após correção

## Instruções de Teste

1. Execute os scripts SQL acima no Supabase Dashboard
2. Faça login como usuário normal no frontend
3. Tente solicitar um saque com valor acima de R$ 50,00
4. Verifique se o saque aparece na lista de saques
5. Teste como admin para ver se consegue aprovar/rejeitar saques

## Observações

- O usuário com email `mateus12martins@gmail.com` tem saldo de R$ 5.000,00 para testes
- O valor mínimo para saque é R$ 50,00
- A funcionalidade está implementada corretamente no frontend, apenas faltam as políticas RLS 