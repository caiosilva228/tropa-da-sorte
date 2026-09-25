import { requireAdminRole } from '@/server/auth';
import { NumberReservationService } from '@/server/services/number-reservation.service';
import { ManualPaymentConfirmationSchema } from '@/types';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const session = await requireAdminRole(['OWNER', 'ADMIN', 'OPERATOR']);
    const body = await request.json();
    const validated = ManualPaymentConfirmationSchema.parse(body);

    const order = await NumberReservationService.markNumberManualPaid(validated, session.userId, session.role);
    return NextResponse.json({ success: true, order });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Falha na confirmação manual';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
