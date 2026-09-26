import { requireAdminRole } from '@/server/auth';
import { RaffleService } from '@/server/services/raffle.service';
import { deleteRaffleFromSupabase } from '@/server/db/supabaseAdapter';
import { UpdateRaffleRulesSchema } from '@/types';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminRole(['OWNER', 'ADMIN']);
    const { id } = await context.params;
    const body = await request.json();

    const validated = UpdateRaffleRulesSchema.parse(body);
    const updated = await RaffleService.updateRaffleRules(id, validated, session.userId, session.role);

    return NextResponse.json({
      success: true,
      message: 'Regras da ação atualizadas com sucesso!',
      raffle: updated,
    });
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      const msg = err.issues.map((e) => e.message).join(', ');
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : 'Falha ao atualizar regras da ação';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

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

