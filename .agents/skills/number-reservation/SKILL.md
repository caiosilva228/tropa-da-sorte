---
name: number-reservation
description: Controle de concorrência, reservas temporárias com TTL e prevenção física de dupla venda de números.
---

# Skill: Number Reservation

## Quando Utilizar
Utilize esta skill sempre que estiver implementando ou revisando a seleção de números, bloqueio no checkout, rotina de expiração temporária (TTL), renovação de sessão e liberação automática de números.

## Arquitetura de Reserva e Concorrência

### Ciclo de Vida da Reserva
1. **Seleção no Frontend**: O cliente seleciona números no grid ou utiliza seleção rápida ("Escolher para mim").
2. **Início do Checkout**: O frontend solicita a reserva enviando os números desejados e um `reservation_token` (UUID mantido na sessão).
3. **Lock Transacional no Banco**:
   ```sql
   -- Travar as linhas dos números disponíveis dentro da transação
   SELECT id, number, status
   FROM raffle_numbers
   WHERE raffle_id = $1 AND number = ANY($2) AND status = 'available'
   FOR UPDATE;
   ```
4. **Validação de Quantidade**: Se a quantidade de linhas travadas for menor do que a solicitada, significa que pelo menos um número foi selecionado concorrentemente por outro cliente. A transação faz rollback imediato e retorna erro amigável ao cliente com a lista dos números conflitantes.
5. **Criação da Reserva**:
   - Status dos números alterado para `pending_payment`.
   - Campos atualizados: `reservation_id`, `reserved_at = NOW()`, `expires_at = NOW() + INTERVAL '15 minutes'`.
   - Geração do pedido (`Order`) com status `awaiting_payment`.
6. **Expiração**: Job de limpeza roda a cada 60 segundos ou na consulta de disponibilidade:
   ```sql
   UPDATE raffle_numbers
   SET status = 'available',
       order_id = NULL,
       customer_id = NULL,
       reservation_id = NULL,
       reserved_at = NULL,
       expires_at = NULL
   WHERE status = 'pending_payment'
     AND expires_at < NOW()
     AND NOT EXISTS (
       SELECT 1 FROM orders WHERE orders.id = raffle_numbers.order_id AND orders.status = 'paid'
     );
   ```

## Erros Comuns
1. Verificar disponibilidade com um `SELECT` simples e depois fazer `UPDATE` em queries separadas sem lock (vulnerável a race conditions em milissegundos).
2. Deixar a expiração da reserva apenas a cargo do frontend (JavaScript no navegador). Se o usuário fechar a aba, os números ficariam bloqueados para sempre.
3. Liberar números cuja reserva expirou, mas cujo pagamento já foi aprovado pelo gateway há poucos segundos e está sendo processado.
4. Esquecer de validar se os números sorteados pelo modo aleatório ("Escolher para mim") continuam disponíveis no momento do lock.

## Checklist
- [ ] Transação isolada com `SELECT ... FOR UPDATE` para travar os números.
- [ ] Constraint única no banco de dados (`raffle_id`, `number`).
- [ ] Token de reserva seguro salvo em cookie / sessionStorage para recuperação em caso de refresh da página.
- [ ] Countdown visual na tela de checkout sincronizado com o timestamp `expires_at` do backend.
- [ ] Job de background para expiração de reservas vencidas.

## Regra Que Nunca Deve Ser Violada
- NUNCA PERMITIR QUE O MESMO NÚMERO SEJA ATRIBUÍDO A DUAS SESSÕES OU DOIS CLIENTES DIFERENTES.
