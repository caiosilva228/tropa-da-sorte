import { Database } from '@/server/db';
import {
  CreateReservationInput,
  Customer,
  ManualPaymentConfirmationInput,
  ManualReservationInput,
  Order,
  RaffleNumber,
} from '@/types';
import { generatePublicOrderId, generateReceiptCode } from '@/lib/utils';

export class NumberReservationService {
  // 1. Limpeza proativa de reservas expiradas
  static async expirePendingReservations(raffleId?: string): Promise<number> {
    return await Database.transaction(async (db) => {
      const now = new Date().getTime();
      let expiredCount = 0;

      for (const num of db.raffleNumbers) {
        if (raffleId && num.raffleId !== raffleId) continue;

        if (num.status === 'pending_payment' && num.expiresAt) {
          const expiresTime = new Date(num.expiresAt).getTime();
          if (expiresTime < now) {
            // Verificar se o pedido relacionado já foi pago (proteção contra corrida)
            const relatedOrder = db.orders.find((o) => o.id === num.orderId);
            if (relatedOrder && relatedOrder.status === 'paid') {
              num.status = 'paid';
              num.expiresAt = null;
            } else {
              // Registrar falha no pedido se estiver aguardando pagamento
              if (relatedOrder && relatedOrder.status === 'awaiting_payment') {
                relatedOrder.status = 'failed';
                relatedOrder.updatedAt = new Date().toISOString();
              }
              // Liberar número
              num.status = 'available';
              num.orderId = null;
              num.customerId = null;
              num.customerName = null;
              num.reservationId = null;
              num.reservedAt = null;
              num.expiresAt = null;
              expiredCount++;
            }
          }
        }
      }

      // Reconciliar também todos os pedidos awaiting_payment que expiraram
      for (const ord of db.orders) {
        if (raffleId && ord.raffleId !== raffleId) continue;
        if (ord.status === 'awaiting_payment' && ord.expiresAt) {
          if (new Date(ord.expiresAt).getTime() < now) {
            ord.status = 'failed';
            ord.updatedAt = new Date().toISOString();
          }
        }
      }

      return expiredCount;
    });
  }

  // 2. Seleção aleatória de números estritamente disponíveis
  static async getRandomAvailableNumbers(raffleId: string, quantity: number): Promise<number[]> {
    await this.expirePendingReservations(raffleId);
    const state = await Database.getState();

    const available = state.raffleNumbers
      .filter((n) => n.raffleId === raffleId && n.status === 'available')
      .map((n) => n.number);

    if (available.length < quantity) {
      throw new Error(`Não há ${quantity} números disponíveis no momento. Restam apenas ${available.length}.`);
    }

    // Embaralhar aleatoriamente
    const shuffled = [...available].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, quantity).sort((a, b) => a - b);
  }

  // 3. Reserva Atômica e Concorrente (Regra Inegociável: Prevenção de Dupla Venda)
  static async reserveNumbers(input: CreateReservationInput): Promise<{ order: Order; numbers: RaffleNumber[] }> {
    return await Database.transaction(async (db) => {
      // a. Verificar existência e status do sorteio
      const raffle = db.raffles.find((r) => r.id === input.raffleId);
      if (!raffle) {
        throw new Error('Sorteio não encontrado.');
      }
      if (raffle.status !== 'active') {
        throw new Error('Este sorteio não está aberto para compras no momento.');
      }

      // b. Validação de limites por pedido
      const qty = input.numbers.length;
      if (qty < raffle.minNumbersPerOrder) {
        throw new Error(`A quantidade mínima por pedido é de ${raffle.minNumbersPerOrder} número(s).`);
      }
      if (qty > raffle.maxNumbersPerOrder) {
        throw new Error(`A quantidade máxima por pedido é de ${raffle.maxNumbersPerOrder} números.`);
      }

      // c. Ordenar os números crescentemente para evitar deadlocks de lock concorrente
      const sortedRequestedNumbers = [...new Set(input.numbers)].sort((a, b) => a - b);
      if (sortedRequestedNumbers.length !== qty) {
        throw new Error('Números duplicados encontrados na requisição.');
      }

      // d. Verificar expirações recentes antes de travar
      const now = new Date();
      for (const num of db.raffleNumbers) {
        if (num.raffleId === input.raffleId && num.status === 'pending_payment' && num.expiresAt) {
          if (new Date(num.expiresAt).getTime() < now.getTime()) {
            const relOrder = db.orders.find((o) => o.id === num.orderId);
            if (relOrder && relOrder.status === 'awaiting_payment') {
              relOrder.status = 'failed';
              relOrder.updatedAt = now.toISOString();
            }
            num.status = 'available';
            num.orderId = null;
            num.customerId = null;
            num.customerName = null;
            num.reservationId = null;
            num.expiresAt = null;
          }
        }
      }

      // e. Lock e validação de disponibilidade física
      const targetNumbers: RaffleNumber[] = [];
      const conflicts: number[] = [];

      for (const requestedNum of sortedRequestedNumbers) {
        const found = db.raffleNumbers.find((n) => n.raffleId === input.raffleId && n.number === requestedNum);
        if (!found) {
          throw new Error(`O número ${requestedNum} não existe neste sorteio.`);
        }
        if (found.status !== 'available') {
          conflicts.push(requestedNum);
        } else {
          targetNumbers.push(found);
        }
      }

      // Se houver qualquer conflito de concorrência, rejeitar a transação integralmente
      if (conflicts.length > 0) {
        const conflictList = conflicts.join(', ');
        throw new Error(
          `Ops! O(s) número(s) ${conflictList} acabou(aram) de ser escolhido(s) por outra pessoa. Por favor, selecione outros números.`
        );
      }

      // f. Registrar / Atualizar Cliente
      let customer = db.customers.find((c) => c.phone === input.customer.phone || c.email === input.customer.email);
      if (!customer) {
        customer = {
          id: crypto.randomUUID(),
          name: input.customer.name,
          email: input.customer.email,
          phone: input.customer.phone,
          cpfMasked: input.customer.cpf ? `***.${input.customer.cpf.slice(3, 6)}.***-**` : null,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };
        db.customers.push(customer);
      } else {
        customer.name = input.customer.name;
        customer.updatedAt = now.toISOString();
      }

      // g. Calcular valores estritamente no backend (Zero confiança no cliente)
      const subtotalInCents = qty * raffle.pricePerNumberInCents;
      const discountInCents = 0;
      const totalAmountInCents = subtotalInCents - discountInCents;

      const orderId = crypto.randomUUID();
      const publicId = generatePublicOrderId();
      const reservationToken = `res-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const reservationMinutes = raffle.reservationMinutes || 15;
      const expiresAt = new Date(now.getTime() + reservationMinutes * 60 * 1000).toISOString();

      // h. Atualizar atomicamente o status de todos os números para pending_payment
      for (const num of targetNumbers) {
        num.status = 'pending_payment';
        num.customerId = customer.id;
        num.customerName = customer.name;
        num.orderId = orderId;
        num.reservationId = reservationToken;
        num.reservedAt = now.toISOString();
        num.expiresAt = expiresAt;
      }

      // i. Criar o pedido (Order)
      const order: Order = {
        id: orderId,
        publicId,
        raffleId: raffle.id,
        customerId: customer.id,
        customer,
        quantity: qty,
        subtotalInCents,
        discountInCents,
        totalAmountInCents,
        status: 'awaiting_payment',
        paymentMethod: input.paymentMethod,
        reservationToken,
        expiresAt,
        paidAt: null,
        numbers: targetNumbers.map((n) => n.formattedNumber),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      db.orders.unshift(order);

      // j. Log de auditoria
      db.auditLogs.unshift({
        id: crypto.randomUUID(),
        actorId: customer.id,
        actorRole: 'customer',
        action: 'numbers_reserved',
        entityType: 'order',
        entityId: order.id,
        oldValue: null,
        newValue: {
          publicId: order.publicId,
          quantity: qty,
          totalAmountInCents,
          numbers: order.numbers,
        },
        reason: 'Reserva iniciada pelo cliente no checkout',
        ipAddress: '127.0.0.1',
        userAgent: 'CheckoutWeb',
        createdAt: now.toISOString(),
      });

      return { order, numbers: targetNumbers };
    });
  }

  // 4. Reserva Manual Administrativa
  static async reserveManually(
    input: ManualReservationInput,
    actorId: string,
    actorRole: string
  ): Promise<RaffleNumber[]> {
    return await Database.transaction(async (db) => {
      const now = new Date();
      const expiresAt = input.neverExpires
        ? null
        : new Date(now.getTime() + (input.durationMinutes || 60) * 60 * 1000).toISOString();

      const updated: RaffleNumber[] = [];

      for (const numInt of input.numbers) {
        const found = db.raffleNumbers.find((n) => n.raffleId === input.raffleId && n.number === numInt);
        if (!found) {
          throw new Error(`Número ${numInt} não encontrado.`);
        }
        if (found.status === 'paid') {
          throw new Error(`O número ${found.formattedNumber} já está definitivamente pago e não pode ser reservado.`);
        }

        found.status = 'reserved_manual';
        found.customerName = input.customerName;
        found.reservedAt = now.toISOString();
        found.expiresAt = expiresAt;
        updated.push(found);
      }

      db.auditLogs.unshift({
        id: crypto.randomUUID(),
        actorId,
        actorRole,
        action: 'manual_reservation',
        entityType: 'raffle_numbers',
        entityId: input.raffleId,
        oldValue: null,
        newValue: {
          customerName: input.customerName,
          numbers: updated.map((n) => n.formattedNumber),
          neverExpires: input.neverExpires,
          notes: input.notes,
        },
        reason: input.notes || 'Reserva manual efetuada pelo painel administrativo',
        ipAddress: '127.0.0.1',
        userAgent: 'AdminPanel',
        createdAt: now.toISOString(),
      });

      return updated;
    });
  }

  // 5. Confirmação Manual de Pagamento (com obrigatoriedade de motivo e auditoria)
  static async markNumberManualPaid(
    input: ManualPaymentConfirmationInput,
    actorId: string,
    actorRole: string
  ): Promise<Order> {
    return await Database.transaction(async (db) => {
      const order = db.orders.find((o) => o.id === input.orderId);
      if (!order) {
        throw new Error('Pedido não encontrado.');
      }
      if (order.status === 'paid') {
        return order; // Idempotente
      }

      const now = new Date().toISOString();
      const oldStatus = order.status;

      order.status = 'paid';
      order.paidAt = now;
      order.updatedAt = now;

      // Atualizar todos os números do pedido para paid
      for (const num of db.raffleNumbers) {
        if (num.orderId === order.id || (order.numbers.includes(num.formattedNumber) && num.raffleId === order.raffleId)) {
          num.status = 'paid';
          num.paidAt = now;
          num.expiresAt = null;
        }
      }

      // Criar comprovante
      const customer = db.customers.find((c) => c.id === order.customerId);
      const raffle = db.raffles.find((r) => r.id === order.raffleId);

      const verificationCode = generateReceiptCode();
      const receipt = {
        id: crypto.randomUUID(),
        verificationCode,
        orderId: order.id,
        customerId: order.customerId,
        raffleId: order.raffleId,
        orderPublicId: order.publicId,
        customerName: customer?.name || 'Participante',
        customerPhoneMasked: customer ? `(${customer.phone.slice(0, 2)}) 9****-${customer.phone.slice(-4)}` : '',
        raffleName: raffle?.name || 'Ação Tropa da Sorte',
        numbers: order.numbers,
        totalAmountInCents: order.totalAmountInCents,
        paymentMethod: 'manual' as const,
        issuedAt: now,
      };

      db.receipts.unshift(receipt);

      // Registrar obrigatoriamente no log de auditoria
      db.auditLogs.unshift({
        id: crypto.randomUUID(),
        actorId,
        actorRole,
        action: 'payment_manually_confirmed',
        entityType: 'order',
        entityId: order.id,
        oldValue: { status: oldStatus },
        newValue: {
          status: 'paid',
          paymentMethod: input.paymentMethod,
          referenceCode: input.referenceCode,
          receiptCode: verificationCode,
        },
        reason: input.notes,
        ipAddress: '127.0.0.1',
        userAgent: 'AdminPanel',
        createdAt: now,
      });

      return order;
    });
  }
}
