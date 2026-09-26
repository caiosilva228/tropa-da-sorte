import { Database } from '@/server/db';
import { generateReceiptCode } from '@/lib/utils';
import { Order, Payment } from '@/types';
import crypto, { randomUUID } from 'crypto';

export interface PixPaymentResponse {
  paymentId: string;
  qrCode: string;
  qrCodeBase64: string;
  status: string;
  expiresAt: string;
}

export interface MercadoPagoPaymentDetails {
  id: number | string;
  status: string;
  status_detail: string;
  transaction_amount: number;
  external_reference?: string | null;
  payment_method_id?: string;
  date_approved?: string | null;
}

export class MercadoPagoService {
  private static getAccessToken(): string {
    return process.env.MP_ACCESS_TOKEN || 'TEST-mock-access-token';
  }

  private static getWebhookSecret(): string {
    return process.env.MP_WEBHOOK_SECRET || 'test-webhook-secret-mock';
  }

  // 1. Criar Cobrança Pix Transparente
  static async createPixPayment(order: Order): Promise<PixPaymentResponse> {
    const accessToken = this.getAccessToken();
    const isMock = accessToken.startsWith('TEST-mock') || process.env.NODE_ENV === 'test';

    if (isMock) {
      // Simulação fiel para sandbox local e testes de desenvolvimento
      const paymentId = `mp-pix-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const qrCode = `00020101021226840014br.gov.bcb.pix2562pix-qr.mercadopago.com/instore/o/v2/${paymentId}5204000053039865405${(order.totalAmountInCents / 100).toFixed(2)}5802BR5920TROPA DA SORTE PREM6009SAO PAULO62070503***6304`;
      const qrCodeBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      await Database.transaction(async (db) => {
        const payment: Payment = {
          id: randomUUID(),
          orderId: order.id,
          provider: 'mercadopago',
          providerPaymentId: paymentId,
          providerOrderId: null,
          amountInCents: order.totalAmountInCents,
          currency: 'BRL',
          method: 'pix',
          status: 'pending',
          externalReference: order.publicId,
          idempotencyKey: `idemp-${order.id}`,
          qrCode,
          qrCodeBase64,
          approvedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        db.payments.unshift(payment);
      });

      return {
        paymentId,
        qrCode,
        qrCodeBase64,
        status: 'pending',
        expiresAt: order.expiresAt || new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      };
    }

    // Chamada oficial à API do Mercado Pago
    const idempotencyKey = `idemp-${order.id}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tropa-da-sorte.netlify.app';

    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        transaction_amount: order.totalAmountInCents / 100,
        description: `Tropa da Sorte - Pedido #${order.publicId}`,
        payment_method_id: 'pix',
        payer: {
          email: order.customer?.email || 'contato@tropadasorte.com.br',
          first_name: order.customer?.name.split(' ')[0] || 'Participante',
          last_name: order.customer?.name.split(' ').slice(1).join(' ') || 'Tropa',
        },
        external_reference: order.publicId,
        notification_url: `${appUrl}/api/webhooks/mercadopago`,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Falha ao gerar Pix no Mercado Pago: ${response.status} - ${errBody}`);
    }

    const data = await response.json();
    const qrCode = data.point_of_interaction?.transaction_data?.qr_code || '';
    const qrCodeBase64 = data.point_of_interaction?.transaction_data?.qr_code_base64 || '';
    const paymentId = data.id?.toString() || `mp-${Date.now()}`;

    await Database.transaction(async (db) => {
      const payment: Payment = {
        id: randomUUID(),
        orderId: order.id,
        provider: 'mercadopago',
        providerPaymentId: paymentId,
        providerOrderId: null,
        amountInCents: order.totalAmountInCents,
        currency: 'BRL',
        method: 'pix',
        status: 'pending',
        externalReference: order.publicId,
        idempotencyKey,
        qrCode,
        qrCodeBase64,
        approvedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.payments.unshift(payment);
    });

    return {
      paymentId,
      qrCode,
      qrCodeBase64,
      status: 'pending',
      expiresAt: order.expiresAt || new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };
  }

  // 2. Validação Criptográfica de Assinatura de Webhook (HMAC SHA256)
  static verifyWebhookSignature(xSignatureHeader: string | null, dataId: string, requestId: string | null): boolean {
    const secret = this.getWebhookSecret();
    if (!secret || secret.startsWith('test-webhook-secret-mock')) {
      // Em modo de testes mock locais ou sem secret estrito, autoriza
      return true;
    }

    if (!xSignatureHeader) return false;

    // Formato oficial do header x-signature: ts=123456,v1=hash123...
    const parts = xSignatureHeader.split(',');
    let ts = '';
    let hash = '';

    for (const part of parts) {
      const [key, val] = part.trim().split('=');
      if (key === 'ts') ts = val;
      if (key === 'v1') hash = val;
    }

    if (!ts || !hash) return false;

    const manifest = `id:${dataId};request-id:${requestId || ''};ts:${ts};`;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(manifest);
    const calculatedHash = hmac.digest('hex');

    try {
      return crypto.timingSafeEqual(Buffer.from(hash, 'utf-8'), Buffer.from(calculatedHash, 'utf-8'));
    } catch {
      return false;
    }
  }

  // 3. Consultar Pagamento Diretamente na API do Mercado Pago
  static async getPaymentFromMercadoPago(paymentId: string | number): Promise<MercadoPagoPaymentDetails | null> {
    const accessToken = this.getAccessToken();
    if (!accessToken || accessToken.startsWith('TEST-mock')) return null;

    try {
      const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        console.warn(`[MP API] Erro ao buscar pagamento ${paymentId}: ${res.status}`);
        return null;
      }

      return (await res.json()) as MercadoPagoPaymentDetails;
    } catch (err) {
      console.error(`[MP API] Exceção ao consultar pagamento ${paymentId}:`, err);
      return null;
    }
  }

  // 4. Buscar Pagamento no Mercado Pago pelo external_reference (Public ID do Pedido)
  static async searchPaymentByExternalReference(externalReference: string): Promise<MercadoPagoPaymentDetails | null> {
    const accessToken = this.getAccessToken();
    if (!accessToken || accessToken.startsWith('TEST-mock')) return null;

    try {
      const res = await fetch(
        `https://api.mercadopago.com/v1/payments/search?external_reference=${encodeURIComponent(
          externalReference
        )}&sort=date_created&criteria=desc&limit=1`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!res.ok) {
        console.warn(`[MP API] Erro na busca por external_reference ${externalReference}: ${res.status}`);
        return null;
      }

      const data = await res.json();
      if (data.results && data.results.length > 0) {
        return data.results[0] as MercadoPagoPaymentDetails;
      }
      return null;
    } catch (err) {
      console.error(`[MP API] Exceção na busca por external_reference ${externalReference}:`, err);
      return null;
    }
  }

  // 5. Processamento Atômico do Webhook e Reconciliação Financeira
  static async processWebhookPaymentApproved(
    providerPaymentId: string,
    externalReference?: string
  ): Promise<{ success: boolean; alreadyProcessed?: boolean }> {
    // Buscar detalhes oficiais diretamente na API do Mercado Pago se disponíveis
    let mpDetails: MercadoPagoPaymentDetails | null = null;
    if (providerPaymentId && !providerPaymentId.startsWith('mp-pix-')) {
      mpDetails = await this.getPaymentFromMercadoPago(providerPaymentId);
    }

    const effectiveExternalRef = mpDetails?.external_reference || externalReference;
    const isApprovedInGateway = mpDetails ? mpDetails.status === 'approved' : true;

    if (mpDetails && !isApprovedInGateway) {
      console.log(`[MP NOT APPROVED YET] Pagamento ${providerPaymentId} ainda com status ${mpDetails.status}`);
      return { success: false, alreadyProcessed: false };
    }

    return await Database.transaction(async (db) => {
      // a. Idempotência: Verificar se o evento já foi processado
      const eventKey = `mp-event-${providerPaymentId}`;
      const existingEvent = db.webhookEvents.find((e) => e.providerEventId === eventKey);
      if (existingEvent && existingEvent.status === 'processed') {
        return { success: true, alreadyProcessed: true };
      }

      // b. Localizar pagamento ou pedido
      let payment = db.payments.find((p) => p.providerPaymentId === providerPaymentId);
      let order: Order | undefined;

      if (payment) {
        order = db.orders.find((o) => o.id === payment?.orderId);
      }
      
      if (!order && effectiveExternalRef) {
        order = db.orders.find((o) => o.publicId === effectiveExternalRef || o.id === effectiveExternalRef);
      }

      if (!order) {
        throw new Error(
          `Pedido com referência ${effectiveExternalRef} ou pagamento ${providerPaymentId} não encontrado.`
        );
      }

      if (order.status === 'paid') {
        // Já pago anteriormente, registrar evento e retornar idempotente
        db.webhookEvents.unshift({
          id: randomUUID(),
          provider: 'mercadopago',
          providerEventId: eventKey,
          eventType: 'payment.approved',
          payload: { providerPaymentId, externalReference: effectiveExternalRef },
          status: 'processed',
          receivedAt: new Date().toISOString(),
          processedAt: new Date().toISOString(),
        });
        return { success: true, alreadyProcessed: true };
      }

      const now = new Date().toISOString();
      const approvedAt = mpDetails?.date_approved || now;

      // c. Atualizar Pagamento
      if (payment) {
        payment.status = 'approved';
        payment.approvedAt = approvedAt;
        payment.updatedAt = now;
      } else {
        payment = {
          id: randomUUID(),
          orderId: order.id,
          provider: 'mercadopago',
          providerPaymentId,
          providerOrderId: null,
          amountInCents: order.totalAmountInCents,
          currency: 'BRL',
          method: 'pix',
          status: 'approved',
          externalReference: order.publicId,
          idempotencyKey: `idemp-${order.id}`,
          approvedAt,
          createdAt: now,
          updatedAt: now,
        };
        db.payments.unshift(payment);
      }

      // d. Atualizar Pedido
      order.status = 'paid';
      order.paidAt = approvedAt;
      order.updatedAt = now;

      // e. Atualizar definitivamente os números para PAID
      for (const num of db.raffleNumbers) {
        if (
          num.orderId === order.id ||
          (order.numbers.includes(num.formattedNumber) && num.raffleId === order.raffleId)
        ) {
          num.status = 'paid';
          num.paidAt = approvedAt;
          num.expiresAt = null;
          num.customerId = order.customerId;
          if (order.customer?.name) {
            num.customerName = order.customer.name;
          }
        }
      }

      // f. Emitir Comprovante Oficial
      const customer = db.customers.find((c) => c.id === order?.customerId);
      const raffle = db.raffles.find((r) => r.id === order?.raffleId);
      const verificationCode = generateReceiptCode();

      db.receipts.unshift({
        id: randomUUID(),
        verificationCode,
        orderId: order.id,
        customerId: order.customerId,
        raffleId: order.raffleId,
        orderPublicId: order.publicId,
        customerName: customer?.name || 'Participante da Tropa',
        customerPhoneMasked: customer ? `(${customer.phone.slice(0, 2)}) 9****-${customer.phone.slice(-4)}` : '',
        raffleName: raffle?.name || 'Ação Tropa da Sorte',
        numbers: order.numbers,
        totalAmountInCents: order.totalAmountInCents,
        paymentMethod: 'pix',
        issuedAt: now,
      });

      // g. Registrar no Log de Auditoria
      db.auditLogs.unshift({
        id: randomUUID(),
        actorId: 'system_webhook',
        actorRole: 'gateway',
        action: 'payment_webhook_approved',
        entityType: 'order',
        entityId: order.id,
        oldValue: { status: 'awaiting_payment' },
        newValue: { status: 'paid', providerPaymentId, receiptCode: verificationCode },
        reason: 'Confirmação automática do pagamento via Webhook Mercado Pago',
        ipAddress: '127.0.0.1',
        userAgent: 'MercadoPagoWebhook/1.0',
        createdAt: now,
      });

      // h. Salvar evento processado para idempotência futura
      db.webhookEvents.unshift({
        id: randomUUID(),
        provider: 'mercadopago',
        providerEventId: eventKey,
        eventType: 'payment.approved',
        payload: { providerPaymentId, externalReference: effectiveExternalRef },
        status: 'processed',
        receivedAt: now,
        processedAt: now,
      });

      return { success: true, alreadyProcessed: false };
    });
  }

  // 6. Reconciliação Proativa: Verifica se um pedido já foi pago no Mercado Pago
  static async reconcileOrder(orderIdOrPublicId: string): Promise<{ reconciled: boolean; status: string; receiptCode?: string }> {
    const state = await Database.getState();
    const order = state.orders.find((o) => o.id === orderIdOrPublicId || o.publicId === orderIdOrPublicId);

    if (!order) {
      return { reconciled: false, status: 'not_found' };
    }

    if (order.status === 'paid') {
      const receipt = state.receipts.find((r) => r.orderId === order.id);
      return { reconciled: false, status: 'paid', receiptCode: receipt?.verificationCode };
    }

    // Pedido ainda está pendente: consultar Mercado Pago ativamente
    // 1. Tentar por providerPaymentId registrado
    const payment = state.payments.find((p) => p.orderId === order.id);
    let mpDetails: MercadoPagoPaymentDetails | null = null;

    if (payment && payment.providerPaymentId && !payment.providerPaymentId.startsWith('mp-pix-')) {
      mpDetails = await this.getPaymentFromMercadoPago(payment.providerPaymentId);
    }

    // 2. Se não achou, buscar pelo external_reference = order.publicId
    if (!mpDetails) {
      mpDetails = await this.searchPaymentByExternalReference(order.publicId);
    }

    // Se o Mercado Pago confirmou aprovação, processar imediatamente
    if (mpDetails && mpDetails.status === 'approved') {
      console.log(`[RECONCILER SUCCESS] Pagamento #${mpDetails.id} aprovado para o pedido #${order.publicId}`);
      await this.processWebhookPaymentApproved(mpDetails.id.toString(), order.publicId);

      const updatedState = await Database.getState();
      const updatedReceipt = updatedState.receipts.find((r) => r.orderId === order.id);

      return {
        reconciled: true,
        status: 'paid',
        receiptCode: updatedReceipt?.verificationCode,
      };
    }

    return { reconciled: false, status: order.status };
  }
}
