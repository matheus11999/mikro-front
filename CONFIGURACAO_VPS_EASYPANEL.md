# 🚀 Configuração VPS/EasyPanel - Diagnóstico Completo

## 🌐 Detecção Automática de Ambiente

O sistema agora detecta automaticamente se está rodando em VPS/EasyPanel e ajusta:

### ✅ **Otimizações para VPS:**
- ⏱️ **Timeouts aumentados**: 8s para sessão, 8s para usuário, 15s total
- 🔄 **Retry automático**: Até 2 tentativas em caso de falha
- 📊 **Logs detalhados**: Identificação de ambiente e problemas
- 🎯 **Configurações específicas**: Delays otimizados para latência de rede

## 🔧 Variáveis de Ambiente Obrigatórias

Configure no EasyPanel → **Environment Variables**:

```bash
# OBRIGATÓRIAS (sem essas o app não funciona)
VITE_SUPABASE_URL=https://zzfugxcsinasxrhcwvcp.supabase.co
VITE_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6ZnVneGNzaW5hc3hyaGN3dmNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODIwNTEsImV4cCI6MjA2NTc1ODA1MX0.xHJzQC_tzWxdcGYw-WzYOFaKUkUb3HdlIr2EcWM4diw

# IMPORTANTE (para funcionalidades admin)
VITE_SUPABASE_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6ZnVneGNzaW5hc3hyaGN3dmNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjA1MSwiZXhwIjoyMDY1NzU4MDUxfQ.a8bDJlXu9njwn-PZ3Dg4Hf2FMmnWioxlagTfuSSezpg

# OPCIONAL (para API backend se necessário)
VITE_API_URL=https://api.lucro.top/api/captive-check/
```

## 🔍 Como Diagnosticar Problemas

### **1. Abrir Console do Browser (F12)**

Procure por essas mensagens:

#### ✅ **Sucesso (deve aparecer):**
```
🌐 Ambiente detectado: { isVPS: true, isEasyPanel: true, ... }
🚀 Inicializando aplicação (VPS otimizado)...
🔍 Verificando sessão persistida (VPS otimizado)...
✅ Aplicação inicializada com sucesso (VPS)
```

#### ❌ **Problemas Comuns:**

**A) Variáveis faltando:**
```
❌ Variáveis Supabase faltando: ['VITE_SUPABASE_URL']
📋 Configure no EasyPanel as seguintes variáveis...
```
**Solução**: Adicionar variáveis no EasyPanel

**B) Timeout de conexão:**
```
⏰ Timeout no teste de conexão Supabase (8s)
❌ Timeout de conexão com o servidor...
```
**Solução**: Verificar conectividade, reiniciar container

**C) Erro de rede:**
```
❌ Failed to fetch
❌ Erro de rede. Verifique se o servidor está acessível.
```
**Solução**: Problema de DNS/conectividade

### **2. Teste Manual no Console**

Digite no console do browser (F12):

```javascript
// Verificar configuração
console.log('Config:', {
  url: import.meta.env.VITE_SUPABASE_URL,
  hasKey: !!import.meta.env.VITE_SUPABASE_KEY,
  hasServiceRole: !!import.meta.env.VITE_SUPABASE_SERVICE_ROLE
});

// Testar conexão Supabase
if (window.supabase) {
  window.supabase.auth.getUser().then(result => {
    console.log('Teste auth:', result);
  });
}
```

### **3. Verificar Logs do EasyPanel**

No EasyPanel → **Logs**, procure por:

#### ✅ **Build bem-sucedido:**
```
✓ built in 2.3s
✓ ready in 1.2s
Local:   http://localhost:4173/
```

#### ❌ **Erro de build:**
```
✗ Environment variable "VITE_SUPABASE_URL" is not defined
✗ Build failed
```

## 🛠️ Soluções para Problemas Específicos

### **Problema 1: "Nenhum MikroTik vinculado"**

**Causa**: Cliente não consegue ver MikroTiks vinculados

**Diagnóstico**:
```javascript
// No console:
supabase.from('clientes').select('*').eq('email', 'mateus12martins@gmail.com').single()
  .then(r => console.log('Cliente:', r));

supabase.from('mikrotiks').select('*').eq('cliente_id', 'ID_DO_CLIENTE')
  .then(r => console.log('MikroTiks:', r));
```

**Soluções**:
1. Verificar se RLS está desabilitado
2. Confirmar vinculação no banco
3. Limpar cache do browser
4. Reiniciar aplicação

### **Problema 2: Loading Infinito**

**Causa**: App trava na tela de carregamento

**Soluções**:
1. **Aguardar**: Sistema agora tem retry automático (até 2 tentativas)
2. **Forçar reload**: Ctrl+F5 ou Cmd+Shift+R
3. **Verificar variáveis**: Console deve mostrar configuração
4. **Reiniciar container**: EasyPanel → Actions → Restart

### **Problema 3: Erro de Autenticação**

**Causa**: Login não funciona ou sessão não persiste

**Soluções**:
1. Verificar `VITE_SUPABASE_SERVICE_ROLE`
2. Limpar localStorage: `localStorage.clear()`
3. Verificar se email existe na tabela `clientes`
4. Testar com outro browser

## 📊 Status Esperado (VPS Funcionando)

No console deve aparecer:

```bash
🌐 Ambiente detectado: {
  isVPS: true,
  isEasyPanel: true,
  hostname: "seu-app.easypanel.app",
  port: "",
  protocol: "https:",
  timeouts: { sessionTimeout: 8000, userLookupTimeout: 8000, ... }
}

🚀 Inicializando aplicação (VPS otimizado)...
🔍 Verificando sessão persistida (VPS otimizado)...
📝 Nenhuma sessão persistida
✅ Aplicação inicializada com sucesso (VPS)
```

## 🚨 Troubleshooting Avançado

### **Se NADA funcionar:**

1. **Verificar Build Logs**:
   - EasyPanel → Logs
   - Procurar erros de variáveis

2. **Teste Local**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Verificar Supabase**:
   - Acessar dashboard Supabase
   - Verificar se projeto está ativo
   - Testar API keys

4. **Reset Completo**:
   ```bash
   # No EasyPanel:
   Actions → Restart
   # Aguardar 2-3 minutos
   ```

## 🎯 Próximos Passos

1. **Adicionar variável faltando** (se houver)
2. **Reiniciar container** no EasyPanel
3. **Aguardar 2-3 minutos** para build
4. **Acessar URL** e verificar console
5. **Testar login** com credenciais admin

---

## ⚡ Configuração Rápida

**Copie e cole no EasyPanel:**

```
VITE_SUPABASE_URL=https://zzfugxcsinasxrhcwvcp.supabase.co
VITE_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6ZnVneGNzaW5hc3hyaGN3dmNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODIwNTEsImV4cCI6MjA2NTc1ODA1MX0.xHJzQC_tzWxdcGYw-WzYOFaKUkUb3HdlIr2EcWM4diw
VITE_SUPABASE_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6ZnVneGNzaW5hc3hyaGN3dmNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjA1MSwiZXhwIjoyMDY1NzU4MDUxfQ.a8bDJlXu9njwn-PZ3Dg4Hf2FMmnWioxlagTfuSSezpg
```

**Salve → Restart → Aguarde → Teste! 🚀**

---

## 🆕 **Novas Funcionalidades (VPS Otimizado)**

### ✅ **Melhorias Implementadas:**

1. **🔍 Debug Automático**: Quando não há MikroTiks, aparece ferramenta de debug
2. **⏱️ Timeouts Otimizados**: 8s para sessão, 12s para dados, 15s total
3. **🔄 Retry Automático**: Até 2 tentativas em falhas de rede
4. **🍪 Sessão Persistente**: Login não expira ao atualizar página
5. **🚪 Logout Melhorado**: Limpa completamente a sessão e recarrega
6. **📊 Logs Detalhados**: Console mostra cada passo da conexão

### 🔧 **Como Usar o Debug:**

1. **Faça login** com `mateus12martins@gmail.com`
2. **Vá em "MikroTiks"** no menu lateral
3. **Se aparecer "Nenhum MikroTik vinculado"**, role para baixo
4. **Clique em "Testar Conexão"** no componente de debug
5. **Analise os resultados** para identificar o problema

### 📊 **Resultados Esperados no Debug:**

```
✅ 1. Auth getUser() - Result: { user: { email: "mateus12martins@gmail.com" } }
✅ 2. Auth getSession() - Result: { session: { user: { email: "..." } } }
✅ 3. Buscar cliente - Result: { id: "fe225152-...", email: "mateus12martins@gmail.com" }
✅ 4. Buscar MikroTiks - Result: [{ id: "78957cd3-...", nome: "Drogaria" }]
✅ 5. Buscar Planos - Result: [{ nome: "3 Horas", preco: "5" }, { nome: "1 Hora", preco: "0.1" }]
✅ 6. Variáveis de Ambiente: { VITE_SUPABASE_URL: "https://...", ... }
```

### 🚨 **Se o Debug Mostrar Problemas:**

#### **❌ Auth falhou:**
- Verificar se usuário está logado
- Tentar fazer logout/login novamente
- Limpar cache do browser

#### **❌ Cliente não encontrado:**
- Verificar se email está correto no banco
- Verificar se RLS está desabilitado
- Conferir se tabela 'clientes' existe

#### **❌ MikroTiks não encontrados:**
- Verificar se `cliente_id` está correto
- Conferir vinculação no banco de dados
- Verificar se tabela 'mikrotiks' existe

#### **❌ Variáveis faltando:**
- Adicionar variáveis no EasyPanel
- Reiniciar container
- Aguardar rebuild

---

## 🎯 **Resolução do Problema "Nenhum MikroTik vinculado"**

### **Dados Confirmados no Banco:**
- ✅ Cliente: `mateus12martins@gmail.com` (ID: `fe225152-5593-44b0-b7d9-7f04ae6c5b1f`)
- ✅ MikroTik: "Drogaria" (ID: `78957cd3-7096-4acd-970b-0aa0a768c555`)  
- ✅ Planos: "3 Horas" (R$ 5,00) e "1 Hora" (R$ 0,10)

### **Correções Aplicadas:**
1. **Removido `order by criado_em`** (coluna pode não existir)
2. **Adicionados logs detalhados** para debug
3. **Timeouts otimizados** para VPS
4. **Fallback de autenticação** (getUser + getSession)
5. **Componente de debug** para identificar problemas

**Agora o sistema deve funcionar corretamente no EasyPanel! 🚀** 