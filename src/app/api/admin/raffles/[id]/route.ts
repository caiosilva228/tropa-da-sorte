import { requireAdminRole } from '@/server/auth';
import { RaffleService } from '@/server/services/raffle.service';
import { deleteRaffleFromSupabase } from '@/server/db/supabaseAdapter';
import { NextResponse } from 'next/server';

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminRole(['OWNER', 'ADMIN']);
    const { id } = await context.params;

    await RaffleService.deleteRaffle(id, session.userId, session.role);
    await deleteRaffleFromSupabase(id);

    return NextResponse.json({ success: true, message: 'Sorteio excluído com sucesso' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Falha ao excluir sorteio';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
