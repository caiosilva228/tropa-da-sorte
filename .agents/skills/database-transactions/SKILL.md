---
name: database-transactions
description: Padrões de transações ACID, isolamento de concorrência, row locking e integridade no PostgreSQL/Supabase.
---

# Skill: Database Transactions & Concurrency

## Quando Utilizar
Utilize esta skill sempre que estiver escrevendo operações de escrita concorrentes: confirmação de pagamentos, criação de reservas, cancelamentos em massa, marcação manual de pagamentos e apuração de resultados.

## Padrões de Transação

### Transação de Confirmação de Pagamento
```sql
BEGIN;

-- 1. Obter lock exclusivo na ordem para evitar processamento paralelo
SELECT id, raffle_id, customer_id, status, total_amount_in_cents
FROM orders
WHERE id = $1
FOR UPDATE;

-- 2. Verificar se já foi pago (Idempotência)
-- Se orders.status = 'paid', realizar COMMIT imediato e sair sem erro.

-- 3. Atualizar pagamento
UPDATE payments
SET status = 'approved',
    approved_at = NOW(),
    updated_at = NOW()
WHERE order_id = $1;

-- 4. Atualizar pedido
UPDATE orders
SET status = 'paid',
    paid_at = NOW(),
    updated_at = NOW()
WHERE id = $1;

-- 5. Atualizar todos os números atrelados ao pedido
UPDATE raffle_numbers
SET status = 'paid',
    paid_at = NOW(),
    expires_at = NULL
WHERE order_id = $1;

-- 6. Inserir registro no log de auditoria
INSERT INTO audit_logs (
  actor_id, actor_role, action, entity_type, entity_id, new_value, reason
) VALUES (
  'system_webhook', 'system', 'order_paid', 'order', $1, '{"status": "paid"}', 'Mercado Pago webhook approval'
);

COMMIT;
```

### Isolamento de Concorrência
- Utilizar nível de isolamento `READ COMMITTED` com `FOR UPDATE` para locks de linha explícitos.
- Sempre adquirir locks na mesma ordem (ex: travar números ordenados por `number ASC`) para prevenir deadlocks quando múltiplos usuários reservarem faixas sobrepostas.

## Erros Comuns
1. Esquecer de usar `FOR UPDATE` permitindo que duas transações leiam o mesmo registro como disponível antes do commit de qualquer uma delas.
2. Executar chamadas de rede externas (ex: requisições HTTP para a API do Mercado Pago) DENTRO do bloco de transação do banco de dados (isso segura conexões do pool e causa esgotamento do banco). Chamadas de rede devem ocorrer ANTES ou DEPOIS da transação do banco.
3. Não tratar rollback em caso de exceção no código da aplicação.

## Checklist
- [ ] Transações envolvidas em blocos `try/catch` com rollback garantido em caso de erro.
- [ ] Bloqueio de linhas ordenadas por ID/número para prevenir deadlocks.
- [ ] Chamadas HTTP externas mantidas FORA do escopo da transação SQL.
- [ ] Tabela de eventos de webhook utilizada como barreira de idempotência antes de iniciar a transação.

## Regras Que Nunca Devem Ser Violadas
- NUNCA executar chamadas de rede lentas dentro de uma transação aberta no banco.
- NUNCA permitir que a falha de uma etapa de persistência deixe dados em estado inconsistente (tudo ou nada - atomicidade).
