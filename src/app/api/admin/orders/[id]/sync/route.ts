import { requireAdminRole } from '@/server/auth';
import { MercadoPagoService } from '@/server/integrations/mercadopago';
import { Database } from '@/server/db';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminRole(['OWNER', 'ADMIN', 'OPERATOR']);
    const { id } = await context.params;

    const result = await MercadoPagoService.reconcileOrder(id);

    const state = await Database.getState();
    const order = state.orders.find((o) => o.id === id || o.publicId === id);

    return NextResponse.json({
      success: true,
      reconciled: result.reconciled,
      status: result.status,
      receiptCode: result.receiptCode,
      order,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Falha ao sincronizar pedido com o Mercado Pago';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
