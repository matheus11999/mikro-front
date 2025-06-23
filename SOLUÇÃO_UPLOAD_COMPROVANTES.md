# 🔧 SOLUÇÃO: ERRO DE UPLOAD DE COMPROVANTES

## ❌ **PROBLEMA IDENTIFICADO**

```
Failed to load resource: the server responded with a status of 400
Erro no upload: Object
```

**Causa:** O bucket `withdrawal-proofs` não existe no Supabase Storage.

## ✅ **SOLUÇÃO COMPLETA**

### **OPÇÃO 1: Configurar Storage (Recomendado)**

#### **Passo 1: Criar Bucket no Dashboard**

1. Acesse o **Supabase Dashboard**
2. Vá em **Storage** no menu lateral
3. Clique em **"Create Bucket"**
4. Configure:
   - **Name:** `withdrawal-proofs`
   - **Public bucket:** ✅ (marcado)
   - **File size limit:** `10485760` (10MB)
   - **Allowed MIME types:** `image/jpeg,image/jpg,image/png,image/gif,application/pdf`
5. Clique em **"Create bucket"**

#### **Passo 2: Executar SQL das Políticas**

Execute este SQL no **Supabase Dashboard > SQL Editor**:

```sql
-- Política para admins fazerem upload
CREATE POLICY "Admins can upload withdrawal proofs" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'withdrawal-proofs' AND
  EXISTS (
    SELECT 1 FROM clientes 
    WHERE email = auth.email() 
    AND role = 'admin'
  )
);

-- Política para todos verem comprovantes
CREATE POLICY "Anyone can view withdrawal proofs" ON storage.objects
FOR SELECT USING (bucket_id = 'withdrawal-proofs');

-- Política para admins atualizarem
CREATE POLICY "Admins can update withdrawal proofs" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'withdrawal-proofs' AND
  EXISTS (
    SELECT 1 FROM clientes 
    WHERE email = auth.email() 
    AND role = 'admin'
  )
);

-- Política para admins deletarem
CREATE POLICY "Admins can delete withdrawal proofs" ON storage.objects
FOR DELETE USING (
  bucket_id = 'withdrawal-proofs' AND
  EXISTS (
    SELECT 1 FROM clientes 
    WHERE email = auth.email() 
    AND role = 'admin'
  )
);
```

#### **Passo 3: Verificar Configuração**

```sql
-- Verificar se bucket foi criado
SELECT * FROM storage.buckets WHERE id = 'withdrawal-proofs';

-- Verificar políticas
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
AND policyname LIKE '%withdrawal%';
```

### **OPÇÃO 2: Usar Apenas URLs (Temporário)**

Se não conseguir configurar o Storage, use apenas a opção de URL:

1. Faça upload do comprovante em qualquer serviço (Google Drive, Imgur, etc.)
2. Copie o link público
3. Cole no campo "URL do Comprovante"

## 🎯 **COMO TESTAR**

1. **Após configurar o Storage:**
   - Vá em Saques > Aprovar um saque
   - Selecione um arquivo JPG, PNG ou PDF
   - Clique em "Aprovar Saque"
   - Deve aparecer "Arquivo enviado com sucesso!"

2. **Verificar no Storage:**
   - Vá em Storage > withdrawal-proofs
   - Deve aparecer o arquivo enviado

## 🚨 **MENSAGENS DE ERRO E SOLUÇÕES**

### **"Storage não configurado"**
- **Causa:** Bucket não existe
- **Solução:** Criar bucket conforme Passo 1

### **"Tipo de arquivo não suportado"**
- **Causa:** Arquivo não é JPG, PNG, GIF ou PDF
- **Solução:** Converter arquivo para formato suportado

### **"Arquivo muito grande"**
- **Causa:** Arquivo maior que 10MB
- **Solução:** Comprimir ou redimensionar arquivo

### **"Permission denied"**
- **Causa:** Políticas não configuradas
- **Solução:** Executar SQL do Passo 2

## 📋 **CHECKLIST DE VERIFICAÇÃO**

- [ ] Bucket `withdrawal-proofs` criado
- [ ] Bucket marcado como público
- [ ] MIME types configurados corretamente
- [ ] Políticas SQL executadas
- [ ] Teste de upload realizado

## 🔄 **FALLBACK AUTOMÁTICO**

O sistema já está preparado para:
- ✅ Detectar erro de bucket não encontrado
- ✅ Mostrar mensagem específica para o usuário
- ✅ Permitir aprovação sem comprovante
- ✅ Validar tipos e tamanhos de arquivo

## 📞 **SUPORTE ADICIONAL**

Se ainda tiver problemas:

1. **Verifique logs do browser** (F12 > Console)
2. **Teste com arquivo pequeno** (< 1MB)
3. **Confirme que está logado como admin**
4. **Verifique permissões do projeto Supabase**

---

## 🎯 **RESULTADO ESPERADO**

Após seguir estes passos:
- ✅ Upload de JPG, PNG, GIF e PDF funcionando
- ✅ Arquivos até 10MB aceitos
- ✅ URLs públicas geradas automaticamente
- ✅ Comprovantes visíveis para clientes
- ✅ Sistema robusto com validações

**O upload de comprovantes estará 100% funcional!** 🚀 