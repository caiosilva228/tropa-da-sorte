import { requireAdminRole } from '@/server/auth';
import { RaffleService } from '@/server/services/raffle.service';
import { RaffleStatus } from '@/types';
import { NextResponse } from 'next/server';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminRole(['OWNER', 'ADMIN']);
    const { id } = await context.params;
    const { status } = await request.json();

    const validStatuses: RaffleStatus[] = ['draft', 'scheduled', 'active', 'paused', 'sold_out', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 });
    }

    const updated = await RaffleService.updateRaffleStatus(id, status, session.userId, session.role);
    return NextResponse.json({ success: true, raffle: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Falha ao alterar status';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
