---
name: production-readiness
description: Checklist de prontidão para produção, variáveis de ambiente, seeds, migrations, observabilidade e contingência.
---

# Skill: Production Readiness

## Quando Utilizar
Utilize esta skill nas etapas de fechamento, preparação de deploy, configuração de ambiente e validação final de integridade da plataforma.

## Critérios de Prontidão

### 1. Variáveis de Ambiente e Configuração
- Arquivo `.env.example` completo e documentado contendo:
  - `DATABASE_URL`: String de conexão PostgreSQL/Supabase.
  - `NEXT_PUBLIC_APP_URL`: URL base da aplicação pública.
  - `NEXT_PUBLIC_SUPABASE_URL`: Endpoint da API do Supabase.
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Chave anônima pública.
  - `SUPABASE_SERVICE_ROLE_KEY`: Chave com privilégios de serviço (server-only).
  - `NEXT_PUBLIC_MP_PUBLIC_KEY`: Chave pública do Mercado Pago para o frontend.
  - `MP_ACCESS_TOKEN`: Token privado da API do Mercado Pago (server-only).
  - `MP_WEBHOOK_SECRET`: Segredo de validação de assinatura HMAC do webhook (server-only).
  - `ADMIN_JWT_SECRET`: Chave secreta de autenticação administrativa.

### 2. Migrations e Seeds de Desenvolvimento
- Migrations organizadas em pasta `migrations/` contendo o schema completo, constraints e índices.
- Script de seed executável para popular um sorteio piloto ("Honda CG 160 0KM") com 1.000 números, números pagos, reservados e disponíveis para testes imediatos.

### 3. Observabilidade e Logs Estruturados
- Logs estruturados no formato JSON contendo timestamps ISO, nível (`INFO`, `WARN`, `ERROR`), evento (`payment_approved`, `reservation_expired`, `concurrency_conflict`), identificadores de rastreio (`order_id`, `raffle_id`) e sem exposição de dados sigilosos.
- Endpoint de monitoramento `/api/health` para checar status operacional do banco e APIs essenciais.

### 4. Checklist Pré-Deploy
- [ ] Build de produção sem nenhum erro (`npm run build`).
- [ ] Typecheck estrito sem erros (`npm run typecheck` ou `tsc --noEmit`).
- [ ] Linter sem violações (`npm run lint`).
- [ ] Suíte de testes automatizados 100% aprovada.
- [ ] Headers de segurança habilitados e políticas de CORS configuradas.

## Regras Que Nunca Devem Ser Violadas
- NUNCA realizar deploy com variáveis de ambiente sensíveis expostas em código.
- NUNCA colocar em produção sem schema com constraints de integridade e índices de performance aplicados.
