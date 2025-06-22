# 🚀 Guia Completo EasyPanel - PIX Mikro Frontend

## 📋 Variáveis de Ambiente Necessárias

Configure estas **4 variáveis** no seu EasyPanel:

### ✅ Suas Variáveis Atuais (OK):
```bash
VITE_API_URL=https://api.lucro.top/api/captive-check/
VITE_SUPABASE_URL=https://zzfugxcsinasxrhcwvcp.supabase.co
VITE_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6ZnVneGNzaW5hc3hyaGN3dmNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODIwNTEsImV4cCI6MjA2NTc1ODA1MX0.xHJzQC_tzWxdcGYw-WzYOFaKUkUb3HdlIr2EcWM4diw
```

### ❌ Variável Faltando (ADICIONAR):
```bash
VITE_SUPABASE_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6ZnVneGNzaW5hc3hyaGN3dmNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjA1MSwiZXhwIjoyMDY1NzU4MDUxfQ.a8bDJlXu9njwn-PZ3Dg4Hf2FMmnWioxlagTfuSSezpg
```

## 🔧 Passos para Configurar no EasyPanel:

### 1. **Acessar Configurações da App**
- Entre no seu projeto no EasyPanel
- Vá em **Settings** → **Environment Variables**

### 2. **Adicionar a Variável Faltando**
- Clique em **"Add Environment Variable"**
- **Nome**: `VITE_SUPABASE_SERVICE_ROLE`
- **Valor**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6ZnVneGNzaW5hc3hyaGN3dmNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjA1MSwiZXhwIjoyMDY1NzU4MDUxfQ.a8bDJlXu9njwn-PZ3Dg4Hf2FMmnWioxlagTfuSSezpg`

### 3. **Salvar e Reiniciar**
- Clique em **"Save"**
- Reinicie o container: **Actions** → **Restart**

### 4. **Verificar Deploy**
- Aguarde 2-3 minutos para o build completar
- Acesse sua URL do frontend
- Deve carregar a tela de login premium agora! 🎉

## 🎯 Configuração Final Completa:

```bash
# API Backend
VITE_API_URL=https://api.lucro.top/api/captive-check/

# Supabase Database
VITE_SUPABASE_URL=https://zzfugxcsinasxrhcwvcp.supabase.co
VITE_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6ZnVneGNzaW5hc3hyaGN3dmNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODIwNTEsImV4cCI6MjA2NTc1ODA1MX0.xHJzQC_tzWxdcGYw-WzYOFaKUkUb3HdlIr2EcWM4diw
VITE_SUPABASE_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6ZnVneGNzaW5hc3hyaGN3dmNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjA1MSwiZXhwIjoyMDY1NzU4MDUxfQ.a8bDJlXu9njwn-PZ3Dg4Hf2FMmnWioxlagTfuSSezpg
```

## 🔍 Como Verificar se Funcionou:

### ✅ **Sinais de Sucesso:**
- ✅ Tela de login premium carrega (dark theme)
- ✅ Console sem erros de "variáveis faltando"
- ✅ Login funciona corretamente
- ✅ Dashboard admin carrega

### ❌ **Se Ainda Der Erro:**
1. **Verifique o Console do Browser** (F12)
2. **Logs do EasyPanel** - veja se há erros de build
3. **Teste no Browser**: Digite `window.debugSupabase()` no console

## 🛠️ Debug Avançado:

Se mesmo após adicionar a variável ainda houver problemas:

### 1. **Teste Manual no Console:**
```javascript
// Abra F12 e digite:
window.debugSupabase()
window.testSupabaseConnection()
```

### 2. **Verifique Logs EasyPanel:**
- Vá em **Logs** no EasyPanel
- Procure por mensagens com emoji 🚀, ✅, ❌

### 3. **Build Logs:**
- Verifique se não há erros durante o build
- Se houver, reinicie o container

## 📊 Status Esperado Após Configuração:

```bash
🚀 Supabase Client inicializado (EasyPanel): {
  url: "https://zzfugxcsinasxrhcwvcp...",
  hasAnonKey: true,
  hasServiceKey: true,
  mode: "production"
}
✅ Supabase Client criado com sucesso
✅ Supabase Admin Client criado com sucesso
🔍 Testando conexão com Supabase...
🔐 Teste Auth: { hasUser: false, authError: null }
✅ Conexão Supabase totalmente funcional
```

## 🎨 Recursos do Frontend Atualizado:

### **Login Premium:**
- 🌟 Dark theme glassmorphism
- ✨ Gradientes dinâmicos  
- 💫 Partículas animadas
- 👑 Crown para admin
- 🚀 Animações fluidas

### **Dashboard Ultra Moderno:**
- 🏆 Cards flutuantes
- 📊 Stats com gradientes
- 🎪 Background animado
- 📱 Totalmente responsivo

### **Sidebar Revolucionário:**
- 🌈 Gradientes únicos por item
- 💎 Efeitos glassmorphism
- ⚡ Shimmer effects
- 🎯 Badges animados

---

## 🎯 **Próximo Passo:**

**👆 Adicione a variável `VITE_SUPABASE_SERVICE_ROLE` no EasyPanel e reinicie!**

Após isso, seu frontend estará 100% funcional com design premium! 🚀✨ 