import { Database } from '@/server/db';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawPhone = String(body.phone || '').trim();
    const raffleIdOrSlug = body.raffleId || body.raffleSlug;

    const cleanPhone = rawPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return NextResponse.json(
        { error: 'Informe um número de telefone válido com DDD (ex: 11999999999)' },
        { status: 400 }
      );
    }

    // Extrair os últimos 8 e 9 dígitos para tolerar DDD e prefixos internacionais (ex: 55)
    const last8 = cleanPhone.slice(-8);
    const last9 = cleanPhone.slice(-9);

    const state = await Database.getState();

    // 1. Localizar clientes que coincidam com o telefone
    const matchedCustomers = state.customers.filter((c) => {
      const custPhone = c.phone.replace(/\D/g, '');
      return (
        custPhone === cleanPhone ||
        custPhone.endsWith(last9) ||
        custPhone.endsWith(last8) ||
        cleanPhone.endsWith(custPhone)
      );
    });

    if (matchedCustomers.length === 0) {
      return NextResponse.json({
        found: false,
        message: 'Nenhum pedido encontrado para o telefone informado.',
        customer: null,
        purchases: [],
      });
    }

    const customerIds = matchedCustomers.map((c) => c.id);
    const primaryCustomer = matchedCustomers[0];

    // 2. Localizar pedidos desses clientes
    let orders = state.orders.filter((o) => customerIds.includes(o.customerId));

    // Se informou um sorteio específico, podemos priorizar ou filtrar
    let targetRaffleId: string | undefined;
    if (raffleIdOrSlug) {
      const targetRaffle = state.raffles.find(
        (r) => r.id === raffleIdOrSlug || r.slug === raffleIdOrSlug
      );
      if (targetRaffle) {
        targetRaffleId = targetRaffle.id;
      }
    }

    if (targetRaffleId) {
      // Ordena colocando os do sorteio atual primeiro
      orders = orders.sort((a, b) => (a.raffleId === targetRaffleId ? -1 : 1));
    }

    // Ordenar pedidos do mais recente para o mais antigo
    orders = orders.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // 3. Montar as compras com os números e comprovantes
    const purchases = orders.map((order) => {
      const raffle = state.raffles.find((r) => r.id === order.raffleId);
      const receipt = state.receipts.find((rc) => rc.orderId === order.id);

      // Buscar números físicos atrelados ao pedido
      let numbers = state.raffleNumbers
        .filter((n) => n.orderId === order.id || (order.numbers.includes(n.formattedNumber) && n.raffleId === order.raffleId))
        .map((n) => n.formattedNumber);

      // Fallback para os números salvos no array do pedido
      if (numbers.length === 0 && order.numbers && order.numbers.length > 0) {
        numbers = order.numbers;
      }

      return {
        orderId: order.id,
        orderPublicId: order.publicId,
        raffleId: order.raffleId,
        raffleName: raffle?.name || 'Ação Tropa da Sorte',
        raffleSlug: raffle?.slug || '',
        prizeName: raffle?.prizeName || '',
        quantity: numbers.length || order.quantity,
        numbers,
        status: order.status,
        totalAmountInCents: order.totalAmountInCents,
        paymentMethod: order.paymentMethod,
        receiptCode: receipt?.verificationCode || null,
        createdAt: order.createdAt,
        paidAt: order.paidAt,
        expiresAt: order.expiresAt,
      };
    });

    return NextResponse.json({
      found: purchases.length > 0,
      customer: {
        name: primaryCustomer.name,
        phone: primaryCustomer.phone,
      },
      purchases,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Falha ao buscar números';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
