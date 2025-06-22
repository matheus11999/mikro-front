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