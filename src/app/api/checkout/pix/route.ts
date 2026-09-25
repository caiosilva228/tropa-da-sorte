import { Database } from '@/server/db';
import { MercadoPagoService } from '@/server/integrations/mercadopago';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json();
    if (!orderId) {
      return NextResponse.json({ error: 'orderId obrigatório' }, { status: 400 });
    }

    const state = await Database.getState();
    const order = state.orders.find((o) => o.id === orderId || o.publicId === orderId);

    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    if (order.status === 'paid') {
      return NextResponse.json({ error: 'Pedido já foi pago anteriormente' }, { status: 400 });
    }

    const pixData = await MercadoPagoService.createPixPayment(order);

    return NextResponse.json({
      success: true,
      pix: pixData,
      order: {
        id: order.id,
        publicId: order.publicId,
        totalAmountInCents: order.totalAmountInCents,
        numbers: order.numbers,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Falha ao gerar cobrança Pix';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
