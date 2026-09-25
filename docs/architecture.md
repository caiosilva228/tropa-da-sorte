# Arquitetura do Sistema — Tropa da Sorte

## 1. Visão Geral
A plataforma **Tropa da Sorte** foi projetada com arquitetura modular baseada em Next.js (App Router), TypeScript estrito (Zero `any`), PostgreSQL com garantias ACID e integração oficial Checkout Transparente com Mercado Pago.

## 2. Camadas do Sistema

### 2.1 Camada de Apresentação (Frontend)
- **Design System "Tropa da Sorte"**:
  - Dark Mode nativo com fundo `#101214`.
  - Cores semânticas de alto contraste: `#16C784` (Verde vibrante / vitória), `#FFC928` (Dourado / troféu), `#262A30` (Bordas).
  - Mobile-First otimizado para dispositivos móveis (360px a 430px).
  - Componentes reutilizáveis em `src/components/tropa/` e `src/components/admin/`.
  - Sticky bottom cart para checkout imediato.
  - Janelamento e virtualização de números no DOM para performance extrema.

### 2.2 Camada de Aplicação e APIs (Route Handlers)
- `/api/checkout/reserve`: Reserva atômica com validação Zod.
- `/api/checkout/pix`: Geração de QR Code e código Copia e Cola via Mercado Pago.
- `/api/checkout/status/[orderId]`: Polling inteligente para confirmação em tempo real.
- `/api/webhooks/mercadopago`: Recebimento de eventos com validação de assinatura `x-signature` (HMAC SHA256) e barreira de idempotência.
- `/api/receipts/[orderId]/pdf`: Geração de comprovante oficial auditável em PDF.
- `/api/receipts/verify/[code]`: Validação pública de autenticidade (em conformidade com LGPD).
- `/api/admin/*`: Rotas administrativas com RBAC (Owner, Admin, Operator, Viewer).

### 2.3 Camada de Serviços de Domínio
- `RaffleService`: Gestão do ciclo de vida dos sorteios (`draft`, `active`, `paused`, etc.).
- `NumberReservationService`: Bloqueio atômico de linhas, controle de TTL (15 minutos), expiração automática e prevenção física de dupla venda.
- `MercadoPagoService`: Gateway oficial, geração Pix, verificação criptográfica e conciliação.
- `ReceiptService`: Emissão de comprovantes com código único `RCPT-...` e buffer PDF via `jspdf`.

### 2.4 Camada de Dados (PostgreSQL / Supabase)
- Integridade relacional estrita: `UNIQUE(raffle_id, number)` garante impossibilidade matemática de duplicação.
- Transações com `SELECT ... FOR UPDATE` para travar registros antes da alteração de status.
- Trilha imutável em `audit_logs` (append-only).
