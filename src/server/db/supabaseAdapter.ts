import { formatNumberWithDigits } from '@/lib/utils';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import {
  AdminUser,
  AuditLog,
  Customer,
  Order,
  Payment,
  Raffle,
  RaffleNumber,
  Receipt,
  WebhookEventStatus,
} from '@/types';
import { DatabaseState } from './index';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  try {
    supabaseInstance = createClient(url, key, {
      auth: { persistSession: false },
    });
    return supabaseInstance;
  } catch (err) {
    console.error('Falha ao inicializar cliente Supabase:', err);
    return null;
  }
}

export async function fetchStateFromSupabase(): Promise<DatabaseState | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;

  try {
    const nowIso = new Date().toISOString();
    const nowMs = Date.now();

    // Expiração automática no Supabase: pedidos vencidos (>15min) viram 'failed' e números voltam para 'available'
    try {
      await Promise.all([
        sb
          .from('orders')
          .update({ status: 'failed', updated_at: nowIso })
          .eq('status', 'awaiting_payment')
          .lt('expires_at', nowIso),
        sb
          .from('raffle_numbers')
          .update({
            status: 'available',
            customer_id: null,
            order_id: null,
            reservation_id: null,
            reserved_at: null,
            expires_at: null,
            updated_at: nowIso,
          })
          .eq('status', 'pending_payment')
          .lt('expires_at', nowIso),
      ]);
    } catch (expErr) {
      console.warn('Aviso: falha na limpeza automática de expiração no Supabase:', expErr);
    }

    const [rRes, nRes, cRes, oRes, rcRes, aRes, lRes, pRes] = await Promise.all([
      sb.from('raffles').select('*'),
      sb.from('raffle_numbers').select('*').order('number', { ascending: true }),
      sb.from('customers').select('*'),
      sb.from('orders').select('*').order('created_at', { ascending: false }),
      sb.from('receipts').select('*'),
      sb.from('admins').select('*'),
      sb.from('audit_logs').select('*').limit(100),
      sb.from('payments').select('*'),
    ]);

    if (rRes.error) {
      console.warn('Supabase retornou erro ao buscar sorteios:', rRes.error);
      return null;
    }

    const customersMap = new Map<string, Customer>();
    const customers: Customer[] = (cRes.data || []).map((c) => {
      const cust: Customer = {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        cpfMasked: c.cpf_masked || undefined,
        createdAt: c.created_at || new Date().toISOString(),
        updatedAt: c.updated_at || new Date().toISOString(),
      };
      customersMap.set(cust.id, cust);
      return cust;
    });

    const ordersMap = new Map<string, Order>();
    const orders: Order[] = (oRes.data || []).map((o) => {
      const customer = customersMap.get(o.customer_id) || {
        id: o.customer_id,
        name: 'Cliente',
        email: 'cliente@tropa.com',
        phone: '11999999999',
        createdAt: o.created_at,
        updatedAt: o.updated_at,
      };

      let currentStatus = o.status;
      if (
        currentStatus === 'awaiting_payment' &&
        o.expires_at &&
        new Date(o.expires_at).getTime() < nowMs
      ) {
        currentStatus = 'failed';
      }

      const ord: Order = {
        id: o.id,
        publicId: o.public_id,
        raffleId: o.raffle_id,
        customerId: o.customer_id,
        customer,
        quantity: Number(o.quantity),
        subtotalInCents: Number(o.subtotal_in_cents),
        discountInCents: Number(o.discount_in_cents || 0),
        totalAmountInCents: Number(o.total_amount_in_cents),
        status: currentStatus,
        paymentMethod: o.payment_method || 'pix',
        reservationToken: o.reservation_token || '',
        expiresAt: o.expires_at || null,
        paidAt: o.paid_at || null,
        numbers: [],
        createdAt: o.created_at || new Date().toISOString(),
        updatedAt: o.updated_at || new Date().toISOString(),
      };
      ordersMap.set(ord.id, ord);
      return ord;
    });

    const rafflesMap = new Map<string, Raffle>();
    const raffles: Raffle[] = rRes.data.map((r) => {
      const raf: Raffle = {
        id: r.id,
        name: r.name,
        slug: r.slug,
        descriptionShort: r.description_short,
        descriptionFull: r.description_full,
        prizeName: r.prize_name,
        prizeValueInCents: Number(r.prize_value_in_cents),
        bannerDesktopUrl: r.banner_desktop_url,
        bannerMobileUrl: r.banner_mobile_url,
        totalNumbers: Number(r.total_numbers),
        firstNumber: Number(r.first_number),
        lastNumber: Number(r.last_number),
        numberDigits: Number(r.number_digits),
        pricePerNumberInCents: Number(r.price_per_number_in_cents),
        minNumbersPerOrder: Number(r.min_numbers_per_order),
        maxNumbersPerOrder: Number(r.max_numbers_per_order),
        reservationMinutes: Number(r.reservation_minutes),
        allowManualChoice: Boolean(r.allow_manual_choice),
        allowRandomChoice: Boolean(r.allow_random_choice),
        showSoldNumbers: Boolean(r.show_sold_numbers),
        showReservedNumbers: Boolean(r.show_reserved_numbers),
        showPartialCustomerName: Boolean(r.show_partial_customer_name),
        drawMethod: r.draw_method || 'loteria_federal',
        drawReference: r.draw_reference || '1º Prêmio da Loteria Federal',
        drawDate: r.draw_date || null,
        winningNumber: r.winning_number || null,
        drawEvidenceUrl: r.draw_evidence_url || null,
        status: r.status,
        startsAt: r.starts_at || null,
        endsAt: r.ends_at || null,
        createdAt: r.created_at || new Date().toISOString(),
        updatedAt: r.updated_at || new Date().toISOString(),
      };
      rafflesMap.set(raf.id, raf);
      return raf;
    });

    const raffleNumbers: RaffleNumber[] = (nRes.data || []).map((n) => {
      let numStatus = n.status;
      let orderId = n.order_id || undefined;
      let custId = n.customer_id || undefined;
      let custName = n.customer_id ? customersMap.get(n.customer_id)?.name : undefined;
      let resAt = n.reserved_at || undefined;
      let expAt = n.expires_at || undefined;

      // Se for reserva pendente e já expirou o prazo de 15 minutos, volta para disponível
      if (
        numStatus === 'pending_payment' &&
        n.expires_at &&
        new Date(n.expires_at).getTime() < nowMs
      ) {
        numStatus = 'available';
        orderId = undefined;
        custId = undefined;
        custName = undefined;
        resAt = undefined;
        expAt = undefined;
      }

      if (orderId && ordersMap.has(orderId)) {
        const order = ordersMap.get(orderId)!;
        if (!order.numbers.includes(n.formatted_number)) {
          order.numbers.push(n.formatted_number);
        }
      }

      return {
        id: n.id,
        raffleId: n.raffle_id,
        number: Number(n.number),
        formattedNumber: n.formatted_number,
        status: numStatus,
        customerId: custId,
        customerName: custName,
        orderId,
        reservedAt: resAt,
        expiresAt: expAt,
        paidAt: n.paid_at || undefined,
      };
    });

    // Garantir que todos os números de cada sorteio existam na memória da aplicação
    for (const raf of raffles) {
      const existingNumbers = raffleNumbers.filter((n) => n.raffleId === raf.id);
      if (existingNumbers.length < raf.totalNumbers) {
        const existingSet = new Set(existingNumbers.map((n) => n.number));
        for (let i = raf.firstNumber; i <= raf.lastNumber; i++) {
          if (!existingSet.has(i)) {
            raffleNumbers.push({
              id: `${raf.id}-${i}`,
              raffleId: raf.id,
              number: i,
              formattedNumber: formatNumberWithDigits(i, raf.numberDigits),
              status: 'available',
            });
          }
        }
      }
    }

    const receipts: Receipt[] = (rcRes.data || []).map((rc) => {
      const ord = ordersMap.get(rc.order_id);
      const cust = customersMap.get(rc.customer_id);
      const raf = rafflesMap.get(rc.raffle_id);

      return {
        id: rc.id,
        verificationCode: rc.verification_code,
        orderId: rc.order_id,
        customerId: rc.customer_id,
        raffleId: rc.raffle_id,
        orderPublicId: ord?.publicId || 'SRT-000000',
        customerName: cust?.name || 'Comprador',
        customerPhoneMasked: cust?.phone ? `(11) 9****-${cust.phone.slice(-4)}` : '(11) 9****-0000',
        raffleName: raf?.name || 'Ação Tropa da Sorte',
        numbers: ord?.numbers || [],
        totalAmountInCents: ord?.totalAmountInCents || 0,
        paymentMethod: ord?.paymentMethod || 'pix',
        issuedAt: rc.issued_at || new Date().toISOString(),
      };
    });

    const admins: AdminUser[] = (aRes.data || []).map((a) => ({
      id: a.id,
      name: a.name,
      email: a.email,
      passwordHash: a.password_hash,
      role: a.role,
      isActive: Boolean(a.is_active),
      lastLoginAt: a.last_login_at || null,
      createdAt: a.created_at || new Date().toISOString(),
    }));

    const auditLogs: AuditLog[] = (lRes.data || []).map((l) => ({
      id: l.id,
      actorId: l.actor_id,
      actorRole: l.actor_role,
      action: l.action,
      entityType: l.entity_type,
      entityId: l.entity_id,
      oldValue: l.old_value,
      newValue: l.new_value,
      reason: l.reason || undefined,
      ipAddress: l.ip_address || '127.0.0.1',
      userAgent: l.user_agent || 'Platform',
      createdAt: l.created_at || new Date().toISOString(),
    }));

    const payments: Payment[] = (pRes?.data || []).map((p) => ({
      id: p.id,
      orderId: p.order_id,
      provider: p.provider || 'mercadopago',
      providerPaymentId: p.provider_payment_id || '',
      providerOrderId: p.provider_order_id || null,
      amountInCents: Number(p.amount_in_cents),
      currency: p.currency || 'BRL',
      method: p.method || 'pix',
      status: p.status,
      externalReference: p.external_reference || '',
      idempotencyKey: p.idempotency_key || '',
      approvedAt: p.approved_at || null,
      createdAt: p.created_at || new Date().toISOString(),
      updatedAt: p.updated_at || new Date().toISOString(),
    }));

    return {
      admins,
      raffles,
      raffleNumbers,
      customers,
      orders,
      payments,
      receipts,
      auditLogs,
      webhookEvents: [],
    };
  } catch (err) {
    console.error('Erro ao sincronizar com Supabase:', err);
    return null;
  }
}

export async function syncStateToSupabase(state: DatabaseState): Promise<void> {
  const sb = getSupabaseClient();
  if (!sb) return;

  try {
    // Sincronizar sorteios novos/atualizados
    if (state.raffles.length > 0) {
      const rafRows = state.raffles.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        description_short: r.descriptionShort,
        description_full: r.descriptionFull,
        prize_name: r.prizeName,
        prize_value_in_cents: r.prizeValueInCents,
        banner_desktop_url: r.bannerDesktopUrl,
        banner_mobile_url: r.bannerMobileUrl,
        total_numbers: r.totalNumbers,
        first_number: r.firstNumber,
        last_number: r.lastNumber,
        number_digits: r.numberDigits,
        price_per_number_in_cents: r.pricePerNumberInCents,
        min_numbers_per_order: r.minNumbersPerOrder,
        max_numbers_per_order: r.maxNumbersPerOrder,
        reservation_minutes: r.reservationMinutes,
        allow_manual_choice: r.allowManualChoice,
        allow_random_choice: r.allowRandomChoice,
        show_sold_numbers: r.showSoldNumbers,
        show_reserved_numbers: r.showReservedNumbers,
        show_partial_customer_name: r.showPartialCustomerName,
        draw_method: r.drawMethod || 'loteria_federal',
        draw_reference: r.drawReference || null,
        draw_date: r.drawDate || null,
        winning_number: r.winningNumber || null,
        draw_evidence_url: r.drawEvidenceUrl || null,
        status: r.status,
        starts_at: r.startsAt || null,
        ends_at: r.endsAt || null,
        updated_at: new Date().toISOString(),
      }));
      await sb.from('raffles').upsert(rafRows, { onConflict: 'id' });
    }

    // Sincronizar clientes novos/atualizados
    if (state.customers.length > 0) {
      const custRows = state.customers.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        cpf_masked: c.cpfMasked || null,
        updated_at: new Date().toISOString(),
      }));
      await sb.from('customers').upsert(custRows, { onConflict: 'id' });
    }

    // Sincronizar pedidos novos/atualizados
    if (state.orders.length > 0) {
      const orderRows = state.orders.map((o) => ({
        id: o.id,
        public_id: o.publicId,
        raffle_id: o.raffleId,
        customer_id: o.customerId,
        quantity: o.quantity,
        subtotal_in_cents: o.subtotalInCents,
        discount_in_cents: o.discountInCents,
        total_amount_in_cents: o.totalAmountInCents,
        status: o.status,
        payment_method: o.paymentMethod,
        reservation_token: o.reservationToken,
        expires_at: o.expiresAt,
        paid_at: o.paidAt,
        updated_at: new Date().toISOString(),
      }));
      await sb.from('orders').upsert(orderRows, { onConflict: 'id' });
    }

    // Sincronizar comprovantes
    if (state.receipts.length > 0) {
      const receiptRows = state.receipts.map((rc) => ({
        id: rc.id,
        verification_code: rc.verificationCode,
        order_id: rc.orderId,
        customer_id: rc.customerId,
        raffle_id: rc.raffleId,
        issued_at: rc.issuedAt,
      }));
      await sb.from('receipts').upsert(receiptRows, { onConflict: 'id' });
    }

    // Sincronizar pagamentos
    if (state.payments.length > 0) {
      const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
      const paymentRows = state.payments.map((p) => ({
        id: isUuid(p.id) ? p.id : randomUUID(),
        order_id: p.orderId,
        provider: p.provider || 'mercadopago',
        provider_payment_id: p.providerPaymentId,
        provider_order_id: p.providerOrderId || null,
        amount_in_cents: p.amountInCents,
        currency: p.currency || 'BRL',
        method: p.method || 'pix',
        status: p.status,
        external_reference: p.externalReference || null,
        idempotency_key: p.idempotencyKey || null,
        approved_at: p.approvedAt || null,
        updated_at: new Date().toISOString(),
      }));
      await sb.from('payments').upsert(paymentRows, { onConflict: 'id' });
    }


    // Sincronizar números com status diferente de 'available'
    const nonAvailableNumbers = state.raffleNumbers.filter((n) => n.status !== 'available');
    if (nonAvailableNumbers.length > 0) {
      const numRows = nonAvailableNumbers.map((n) => ({
        raffle_id: n.raffleId,
        number: n.number,
        formatted_number: n.formattedNumber,
        status: n.status,
        customer_id: n.customerId || null,
        order_id: n.orderId || null,
        reserved_at: n.reservedAt || null,
        expires_at: n.expiresAt || null,
        paid_at: n.paidAt || null,
        updated_at: new Date().toISOString(),
      }));
      await sb.from('raffle_numbers').upsert(numRows, { onConflict: 'raffle_id,number' });
    }
  } catch (err) {
    console.error('Erro ao salvar alterações no Supabase:', err);
  }
}

export async function deleteRaffleFromSupabase(raffleId: string): Promise<void> {
  const sb = getSupabaseClient();
  if (!sb) return;

  try {
    await sb.from('receipts').delete().eq('raffle_id', raffleId);
    const { data: orders } = await sb.from('orders').select('id').eq('raffle_id', raffleId);
    if (orders && orders.length > 0) {
      const orderIds = orders.map((o) => o.id);
      await sb.from('order_numbers').delete().in('order_id', orderIds);
    }
    await sb.from('orders').delete().eq('raffle_id', raffleId);
    await sb.from('raffle_numbers').delete().eq('raffle_id', raffleId);
    await sb.from('raffles').delete().eq('id', raffleId);
  } catch (err) {
    console.error('Erro ao excluir sorteio no Supabase:', err);
  }
}

