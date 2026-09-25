import { requireAdminRole } from '@/server/auth';
import { NumberReservationService } from '@/server/services/number-reservation.service';
import { ManualReservationSchema } from '@/types';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const session = await requireAdminRole(['OWNER', 'ADMIN', 'OPERATOR']);
    const body = await request.json();
    const validated = ManualReservationSchema.parse(body);

    const updated = await NumberReservationService.reserveManually(validated, session.userId, session.role);
    return NextResponse.json({ success: true, numbers: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Falha na reserva manual';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
