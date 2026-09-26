import { Database } from '@/server/db';
import { MercadoPagoService } from '@/server/integrations/mercadopago';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await context.params;
    let state = await Database.getState();
    let order = state.orders.find((o) => o.id === orderId || o.publicId === orderId);

    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    // Se o pedido ainda estiver aguardando pagamento, tentar reconciliar proativamente com o Mercado Pago
    if (order.status !== 'paid') {
      const reconcileResult = await MercadoPagoService.reconcileOrder(order.id);
      if (reconcileResult.reconciled) {
        // Recarregar estado atualizado
        state = await Database.getState();
        order = state.orders.find((o) => o.id === orderId || o.publicId === orderId) || order;
      }
    }

    const receipt = state.receipts.find((r) => r.orderId === order?.id);

    return NextResponse.json({
      orderId: order.id,
      publicId: order.publicId,
      status: order.status,
      paidAt: order.paidAt,
      expiresAt: order.expiresAt,
      numbers: order.numbers,
      totalAmountInCents: order.totalAmountInCents,
      receiptCode: receipt?.verificationCode || null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao consultar status';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
