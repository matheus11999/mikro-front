# ATENÇÃO: O backend (API) agora está na pasta `/api`. O frontend React permanece na raiz do projeto.

# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/e2571448-20bc-406d-8c74-1b75e671d7b8

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/e2571448-20bc-406d-8c74-1b75e671d7b8) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/e2571448-20bc-406d-8c74-1b75e671d7b8) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

# Sistema de WiFi com PIX

Sistema para gerenciamento de acesso WiFi através de pagamentos PIX.

## Configuração do Ambiente

1. Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Mercado Pago
MERCADO_PAGO_ACCESS_TOKEN=your_mercado_pago_access_token

# API Config
PORT=3000
NODE_ENV=development

# Webhook (opcional)
WEBHOOK_URL=https://your-domain.com/webhook/mercadopago
```

2. Instale as dependências:
```bash
npm install
```

## Portas e URLs

- **Frontend (painel React):** roda por padrão em http://localhost:5173
- **Backend (API Express):** roda por padrão em http://localhost:3000/api/captive-check

## Rodando o Projeto

1. Inicie o backend:
```bash
node api.cjs
```

2. Em outro terminal, inicie o frontend:
```bash
npm run dev:frontend
```

## Endpoints da API

### 1. Status do MAC
- **URL:** `/api/captive-check/status`
- **Método:** POST
- **Corpo:**
```json
{
  "mac": "XX:XX:XX:XX:XX:XX",
  "mikrotik_id": "uuid"
}
```

### 2. Gerar PIX
- **URL:** `/api/captive-check/pix`
- **Método:** POST
- **Corpo:**
```json
{
  "mac": "XX:XX:XX:XX:XX:XX",
  "mikrotik_id": "uuid",
  "plano_id": "uuid",
  "preco": 10,
  "descricao": "Acesso WiFi"
}
```

### 3. Verificar Status do Pagamento
- **URL:** `/api/captive-check/verify`
- **Método:** POST
- **Corpo:**
```json
{
  "payment_id": "123456789"
}
```

## Troubleshooting

### Erro "UNAUTHORIZED" ou "PA_UNAUTHORIZED_RESULT_FROM_POLICIES"

Se você receber este erro ao tentar gerar um PIX, verifique:

1. Se o `MERCADO_PAGO_ACCESS_TOKEN` está correto e é um token de produção válido
2. Se a conta do Mercado Pago está verificada e aprovada para receber pagamentos
3. Se o ambiente de produção está configurado corretamente no Mercado Pago
4. Se o domínio da sua aplicação está configurado no Mercado Pago

### Erro ao Gerar QR Code

Se o QR Code não for gerado, verifique:

1. Se o valor do pagamento está no formato correto (número)
2. Se todos os campos obrigatórios estão sendo enviados
3. Se o timeout não está muito curto (padrão: 5000ms)
4. Se há conexão com a internet e o Mercado Pago está online

## Tratamento de Erros

A API retorna erros no seguinte formato:

```json
{
  "error": "Mensagem do erro",
  "code": "CÓDIGO_DO_ERRO",
  "details": "Detalhes do erro",
  "source": "Origem do erro"
}
```

Códigos de erro possíveis:
- `VALIDATION_ERROR`: Erro de validação de dados (HTTP 400)
- `NOT_FOUND`: Recurso não encontrado (HTTP 404)
- `UNAUTHORIZED`: Não autorizado (HTTP 401)
- `FORBIDDEN`: Acesso negado (HTTP 403)
- `MERCADOPAGO_ERROR`: Erro no Mercado Pago
- `SUPABASE_ERROR`: Erro no banco de dados
- `INTERNAL_ERROR`: Erro interno do servidor (HTTP 500)

## Desenvolvimento

Para rodar em modo de desenvolvimento:

```bash
npm run dev
```

Isso iniciará tanto o backend quanto o frontend em modo de desenvolvimento usando `concurrently`.

Se rodar em rede local, troque `localhost` pelo IP da máquina.
