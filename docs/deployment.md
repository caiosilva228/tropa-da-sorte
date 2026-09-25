# Guia de Deploy e Produção — Tropa da Sorte

## 1. Pré-Requisitos de Produção
- Node.js v20+ ou v22+
- Banco de Dados PostgreSQL (ou Supabase)
- Conta Mercado Pago para obtenção de credenciais de produção

## 2. Variáveis de Ambiente
Copie o arquivo `.env.example` para `.env.production` e preencha:
```env
NEXT_PUBLIC_APP_URL="https://suatropadasorte.com.br"
DATABASE_URL="postgresql://postgres:senha@db.supabase.co:5432/postgres"

# Mercado Pago Produção
NEXT_PUBLIC_MP_PUBLIC_KEY="APP_USR-xxxxxx-xxxxxx"
MP_ACCESS_TOKEN="APP_USR-xxxxxx-xxxxxx"
MP_WEBHOOK_SECRET="seu_webhook_secret_do_painel_mp"

# Autenticação
ADMIN_JWT_SECRET="gere_uma_string_aleatoria_com_mais_de_32_caracteres"
NODE_ENV="production"
MP_ENVIRONMENT="production"
```

## 3. Execução das Migrations
Execute a migration inicial no PostgreSQL / Supabase SQL Editor:
```bash
psql $DATABASE_URL -f migrations/001_initial_schema.sql
```

## 4. Build e Inicialização
```bash
npm install
npm run build
npm run start
```

## 5. Configuração de Webhook no Mercado Pago
No painel de desenvolvedores do Mercado Pago:
1. Adicione a URL de notificação: `https://suatropadasorte.com.br/api/webhooks/mercadopago`
2. Selecione os eventos: `Pagamentos` (`payment`).
3. Copie o segredo de assinatura para a variável `MP_WEBHOOK_SECRET`.
