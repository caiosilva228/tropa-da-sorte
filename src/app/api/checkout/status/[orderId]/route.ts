import { Database } from '@/server/db';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await context.params;
  const state = await Database.getState();
  const order = state.orders.find((o) => o.id === orderId || o.publicId === orderId);

  if (!order) {
    return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
  }

  const receipt = state.receipts.find((r) => r.orderId === order.id);

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
}
