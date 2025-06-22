# Variáveis de Ambiente - EasyPanel

Este documento descreve as variáveis de ambiente que devem ser configuradas no EasyPanel para personalizar a aplicação.

## Variáveis Obrigatórias

### Supabase
```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
VITE_SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_aqui
```

## Variáveis Opcionais de Personalização

### Nome, Versão e Descrição da Aplicação
```
VITE_APP_NAME=Seu Nome do Painel
VITE_APP_VERSION=1.0.0
VITE_APP_DESCRIPTION=Descrição do seu sistema
```

**Exemplo de configuração:**
```
VITE_APP_NAME=MikroNet Pro
VITE_APP_VERSION=2.1.5
VITE_APP_DESCRIPTION=Sistema completo de vendas de acesso WiFi
```

### Onde Aparecem:
- **VITE_APP_NAME**: 
  - Título do painel (sidebar)
  - Título da página de login
  - Header da aplicação

- **VITE_APP_VERSION**: 
  - Subtítulo da página de login (ex: "Sistema de Vendas WiFi v2.1.5")

- **VITE_APP_DESCRIPTION**: 
  - Descrição na página de login
  - Subtítulo nos dashboards

### Valores Padrão:
- **VITE_APP_NAME**: "Pix Mikro" (se não definido)
- **VITE_APP_VERSION**: Não exibe versão (se não definido)
- **VITE_APP_DESCRIPTION**: "Sistema de Vendas WiFi" (se não definido)

## Como Configurar no EasyPanel

1. Acesse seu projeto no EasyPanel
2. Vá em **Environment Variables**
3. Adicione as variáveis:
   ```
   VITE_APP_NAME=Nome do Seu Painel
   VITE_APP_VERSION=1.0.0
   VITE_APP_DESCRIPTION=Descrição do seu sistema
   ```
4. Salve e reinicie a aplicação

## Exemplos de Uso

### Configuração Básica:
```
VITE_APP_NAME=WiFi Manager
VITE_APP_VERSION=1.0.0
VITE_APP_DESCRIPTION=Gerencie sua rede WiFi facilmente
```
**Resultado**: "WiFi Manager" no header, "Sistema de Vendas WiFi v1.0.0" no login, "Gerencie sua rede WiFi facilmente" como descrição

### Configuração Avançada:
```
VITE_APP_NAME=HotSpot Control Pro
VITE_APP_VERSION=3.2.1
VITE_APP_DESCRIPTION=Controle total de hotspots e vendas automatizadas
```
**Resultado**: "HotSpot Control Pro" no header, "Sistema de Vendas WiFi v3.2.1" no login, "Controle total de hotspots e vendas automatizadas" como descrição

### Sem Personalização:
Se não definir as variáveis, usará os valores padrão:
- Nome: "Pix Mikro"
- Versão: Não exibe
- Descrição: "Sistema de Vendas WiFi"

## Notas Importantes

1. **Prefixo VITE_**: Todas as variáveis devem começar com `VITE_` para serem acessíveis no frontend
2. **Reinicialização**: Após alterar as variáveis, reinicie a aplicação no EasyPanel
3. **Cache**: Limpe o cache do navegador se as mudanças não aparecerem imediatamente 