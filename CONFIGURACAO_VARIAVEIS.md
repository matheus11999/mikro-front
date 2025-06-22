# Configuração de Variáveis de Ambiente - EasyPanel

## Variáveis Obrigatórias

Configure as seguintes variáveis no EasyPanel:

### Supabase (Obrigatórias)
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your-anon-key
VITE_SUPABASE_SERVICE_ROLE=your-service-role-key
```

## Variáveis Opcionais

### Configurações de Cache
```bash
# Desabilitar cache completamente (recomendado para produção)
VITE_CACHE=disabled
```

### Modo de Operação
```bash
# Modo de produção (logs minimizados, performance otimizada)
VITE_MODE=production

# Modo debug (logs verbosos, mais informações de desenvolvimento)
VITE_MODE=debug

# Modo desenvolvimento (padrão)
VITE_MODE=development
```

## Configurações Recomendadas para Produção

```bash
# Configuração principal
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your-anon-key
VITE_SUPABASE_SERVICE_ROLE=your-service-role-key

# Configurações de performance
VITE_CACHE=disabled
VITE_MODE=production
```

## Configurações para Debug/Desenvolvimento

```bash
# Configuração principal
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your-anon-key
VITE_SUPABASE_SERVICE_ROLE=your-service-role-key

# Configurações de debug
VITE_CACHE=disabled
VITE_MODE=debug
```

## Como Configurar no EasyPanel

1. Acesse o painel do EasyPanel
2. Vá até seu projeto
3. Na seção "Environment Variables"
4. Adicione cada variável com seu respectivo valor
5. Faça o deploy/restart da aplicação

## Verificação das Configurações

O sistema irá exibir no console as configurações carregadas:

- ✅ **Produção**: Logs minimizados, cache controlado
- 🐛 **Debug**: Logs verbosos, informações detalhadas
- 🔧 **Desenvolvimento**: Configuração padrão

## Troubleshooting

### Erro de Variáveis Faltando
Se você ver erros sobre variáveis faltando, verifique:
1. As variáveis estão escritas corretamente (MAIÚSCULAS)
2. Os valores estão corretos
3. O projeto foi reiniciado após adicionar as variáveis

### Comandos de Debug no Console
```javascript
// Verificar configuração atual
window.debugSupabase()

// Testar conexão
window.testSupabaseConnection()

// Ver logs do sistema
logger.getLogs()
```

## Efeitos das Configurações

### VITE_CACHE=disabled
- ❌ Não salva sessão no localStorage
- ❌ Não faz auto-refresh de token
- ✅ Sempre solicita nova autenticação
- ✅ Ideal para evitar problemas de cache

### VITE_MODE=production
- ✅ Logs minimizados
- ✅ Performance otimizada
- ✅ Configuração para ambiente de produção

### VITE_MODE=debug
- ✅ Logs detalhados
- ✅ Informações de troubleshooting
- ✅ Frequência de realtime aumentada
- ✅ Debug tools habilitados 