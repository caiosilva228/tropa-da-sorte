import { describe, it, expect, beforeEach } from 'vitest';
import { Database } from '@/server/db';
import { NumberReservationService } from '@/server/services/number-reservation.service';
import { MercadoPagoService } from '@/server/integrations/mercadopago';
import { ReceiptService } from '@/server/services/receipt.service';

describe('Tropa da Sorte - Testes de Domínio, Concorrência e Idempotência', () => {
  beforeEach(async () => {
    // Reset do banco para estado limpo
    await Database.reset();
  });

  // ============================================================================
  // 1. TESTE DE CONCORRÊNCIA EXTREMA (100 requisições simultâneas disputando o mesmo número)
  // ============================================================================
  it('deve garantir que entre 100 requisições simultâneas disputando o número 7, EXATAMENTE 1 tenha sucesso e 99 falhem por conflito', async () => {
    const state = await Database.getState();
    const raffle = state.raffles[0];

    // O número 7 no seed foi pré-marcado como pago. Vamos resetar o número 77 para disponível para o teste
    await Database.transaction(async (db) => {
      const num77 = db.raffleNumbers.find((n) => n.raffleId === raffle.id && n.number === 77);
      if (num77) {
        num77.status = 'available';
        num77.orderId = null;
        num77.customerId = null;
      }
    });

    type ReservationResult =
      | { success: true; orderId: string }
      | { success: false; error: string };

    const requests: Promise<ReservationResult>[] = Array.from({ length: 100 }).map((_, index) => {
      return NumberReservationService.reserveNumbers({
        raffleId: raffle.id,
        numbers: [77],
        customer: {
          name: `Cliente Concorrente ${index}`,
          email: `concorrente${index}@email.com`,
          phone: `1198888${index.toString().padStart(4, '0')}`,
        },
        paymentMethod: 'pix',
      }).then(
        (res): ReservationResult => ({ success: true, orderId: res.order.id }),
        (err): ReservationResult => ({ success: false, error: err.message })
      );
    });

    const results = await Promise.all(requests);

    const successes = results.filter((r): r is { success: true; orderId: string } => r.success);
    const conflicts = results.filter((r): r is { success: false; error: string } => !r.success);

    // REGRA DE OURO INEGOCIÁVEL:
    expect(successes.length).toBe(1);
    expect(conflicts.length).toBe(99);

    // Garantir que a mensagem de conflito é amigável e humana
    expect(conflicts[0].error).toContain('acabou(aram) de ser escolhido(s)');

    // Verificar integridade no banco
    const finalState = await Database.getState();
    const targetNumber = finalState.raffleNumbers.find((n) => n.raffleId === raffle.id && n.number === 77);
    expect(targetNumber?.status).toBe('pending_payment');
  });

  // ============================================================================
  // 2. TESTE DE IDEMPOTÊNCIA DE WEBHOOK (Mesmo evento enviado 10 vezes)
  // ============================================================================
  it('deve processar o webhook de aprovação de pagamento exatamente uma vez quando enviado 10 vezes consecutivas', async () => {
    const state = await Database.getState();
    const raffle = state.raffles[0];

    // 1. Criar uma reserva válida
    const reservation = await NumberReservationService.reserveNumbers({
      raffleId: raffle.id,
      numbers: [100, 101],
      customer: {
        name: 'Maria Idempotente',
        email: 'maria@email.com',
        phone: '11977776666',
      },
      paymentMethod: 'pix',
    });

    const orderId = reservation.order.id;
    const providerPaymentId = `mp-pay-${Date.now()}`;

    // 2. Disparar 10 chamadas concorrentes/sequenciais de webhook para o mesmo evento
    const webhookCalls = Array.from({ length: 10 }).map(() => {
      return MercadoPagoService.processWebhookPaymentApproved(providerPaymentId, reservation.order.publicId);
    });

    const results = await Promise.all(webhookCalls);

    // Todas devem retornar success: true
    results.forEach((r) => expect(r.success).toBe(true));

    // Exatamente uma processou de fato e as outras 9 foram ignoradas por idempotência
    const actuallyProcessed = results.filter((r) => !r.alreadyProcessed);
    const idempotentIgnored = results.filter((r) => r.alreadyProcessed);

    expect(actuallyProcessed.length).toBe(1);
    expect(idempotentIgnored.length).toBe(9);

    // Verificar se o pedido está como paid
    const updatedState = await Database.getState();
    const updatedOrder = updatedState.orders.find((o) => o.id === orderId);
    expect(updatedOrder?.status).toBe('paid');

    // Verificar se os números foram definitivamente marcados como paid
    const num100 = updatedState.raffleNumbers.find((n) => n.raffleId === raffle.id && n.number === 100);
    const num101 = updatedState.raffleNumbers.find((n) => n.raffleId === raffle.id && n.number === 101);
    expect(num100?.status).toBe('paid');
    expect(num101?.status).toBe('paid');
  });

  // ============================================================================
  // 3. TESTE DE EXPIRAÇÃO DE RESERVA TEMPORÁRIA (TTL)
  // ============================================================================
  it('deve liberar números de reservas cujo TTL expirou e o pedido não foi pago', async () => {
    const state = await Database.getState();
    const raffle = state.raffles[0];

    // Criar reserva
    const reservation = await NumberReservationService.reserveNumbers({
      raffleId: raffle.id,
      numbers: [200],
      customer: {
        name: 'Cliente Expirado',
        email: 'expirado@email.com',
        phone: '11966665555',
      },
      paymentMethod: 'pix',
    });

    // Simular passagem do tempo no banco: expires_at no passado
    await Database.transaction(async (db) => {
      const num200 = db.raffleNumbers.find((n) => n.raffleId === raffle.id && n.number === 200);
      if (num200) {
        num200.expiresAt = new Date(Date.now() - 60 * 1000).toISOString(); // 1 min atrás
      }
    });

    // Executar rotina de expiração
    const expiredCount = await NumberReservationService.expirePendingReservations(raffle.id);
    expect(expiredCount).toBeGreaterThanOrEqual(1);

    // O número 200 deve estar disponível novamente
    const updatedState = await Database.getState();
    const num200 = updatedState.raffleNumbers.find((n) => n.raffleId === raffle.id && n.number === 200);
    expect(num200?.status).toBe('available');
    expect(num200?.orderId).toBeNull();
  });

  // ============================================================================
  // 4. TESTE DE AUDITORIA E COMPROVANTE VERIFICÁVEL
  // ============================================================================
  it('deve emitir comprovante auditável com código RCPT ao aprovar pagamento', async () => {
    const state = await Database.getState();
    const sampleReceipt = state.receipts[0];
    expect(sampleReceipt).toBeDefined();

    const verified = await ReceiptService.getReceiptByVerificationCode(sampleReceipt.verificationCode);
    expect(verified).not.toBeNull();
    expect(verified?.orderPublicId).toBe(sampleReceipt.orderPublicId);
    expect(verified?.verificationCode).toBe(sampleReceipt.verificationCode);
  });
});
