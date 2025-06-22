# Correção - Variáveis Supabase

## Problema Identificado

Erro: `❌ Configure as variáveis de ambiente no EasyPanel: VITE_SUPABASE_ANON_KEY`

## Causa

Você está usando `VITE_SUPABASE_KEY` mas o código esperava `VITE_SUPABASE_ANON_KEY`.

## Solução Implementada

O código agora aceita **AMBOS** os formatos para compatibilidade:

### Chave Anônima (uma das duas):
```bash
VITE_SUPABASE_ANON_KEY=sua_chave_aqui
# OU
VITE_SUPABASE_KEY=sua_chave_aqui
```

### Service Role (uma das duas):
```bash
VITE_SUPABASE_SERVICE_ROLE_KEY=sua_chave_aqui
# OU  
VITE_SUPABASE_SERVICE_ROLE=sua_chave_aqui
```

## Suas Variáveis Atuais (Funcionam Agora!)

```bash
VITE_API_URL=https://api.lucro.top/api/captive-check/
VITE_SUPABASE_URL=https://zzfugxcsinasxrhcwvcp.supabase.co
VITE_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... ✅
VITE_SUPABASE_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... ✅
VITE_CACHE=disabled
VITE_MODE=debug
VITE_APP_NAME=MikroNet Pro
VITE_APP_VERSION=2.1.5
VITE_APP_DESCRIPTION=Sistema completo de vendas WiFi
```

## Resultado

✅ **Não precisa alterar suas variáveis no EasyPanel**  
✅ **O código agora aceita o formato que você já está usando**  
✅ **Sistema deve funcionar normalmente**

## Teste

1. Faça deploy da nova versão
2. O erro de variáveis deve desaparecer
3. Login deve funcionar normalmente
4. Refresh deve manter sessão

## Formatos Aceitos

| Variável | Formato Atual (seu) | Formato Novo | Status |
|----------|-------------------|-------------|--------|
| Anon Key | `VITE_SUPABASE_KEY` | `VITE_SUPABASE_ANON_KEY` | ✅ Ambos funcionam |
| Service Role | `VITE_SUPABASE_SERVICE_ROLE` | `VITE_SUPABASE_SERVICE_ROLE_KEY` | ✅ Ambos funcionam |

**Agora você pode usar qualquer um dos formatos!** 🚀 