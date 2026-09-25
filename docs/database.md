# Modelo de Banco de Dados e Concorrência — Tropa da Sorte

## 1. Schema Relacional
O schema completo está versionado em `migrations/001_initial_schema.sql`.

### Principais Tabelas:
- `admins`: Usuários com acesso ao painel e papéis RBAC (`OWNER`, `ADMIN`, `OPERATOR`, `VIEWER`).
- `raffles`: Campanhas com regras de negócio, limites e preços.
- `raffle_numbers`: Cada número individual do sorteio com status (`available`, `pending_payment`, `reserved_manual`, `paid`, `blocked`).
- `customers`: Dados de compradores (com dados sensíveis como CPF protegidos).
- `orders`: Pedidos de compra com totais calculados em centavos inteiros (`total_amount_in_cents`).
- `payments`: Histórico de transações vinculadas ao Mercado Pago.
- `webhook_events`: Barreira de idempotência com chave única `provider + provider_event_id`.
- `receipts`: Comprovantes emitidos com código público `RCPT-...`.
- `audit_logs`: Trilha de auditoria contínua e imutável.

## 2. Prevenção Física de Dupla Venda
- **Constraint no Banco**:
  ```sql
  CONSTRAINT uq_raffle_number UNIQUE (raffle_id, number)
  ```
- **Lock Atômico de Concorrência**:
  ```sql
  SELECT id, number, status
  FROM raffle_numbers
  WHERE raffle_id = $1 AND number = ANY($2) AND status = 'available'
  FOR UPDATE;
  ```
  Se a quantidade de linhas travadas for diferente do total solicitado, a transação realiza `ROLLBACK` imediato e devolve erro amigável de conflito ao cliente.

## 3. Estratégia de Valores Monetários
Nenhum valor financeiro utiliza `FLOAT` ou `DOUBLE`. Todos os valores são inteiros representando **centavos** (`500` = R$ 5,00), eliminando erros de arredondamento IEEE-754.
