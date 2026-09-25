import { requireAdminRole } from '@/server/auth';
import { RaffleService } from '@/server/services/raffle.service';
import { CreateRaffleSchema } from '@/types';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await requireAdminRole(['OWNER', 'ADMIN', 'OPERATOR', 'VIEWER']);
    const raffles = await RaffleService.listRaffles();
    return NextResponse.json({ raffles });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro de autorização';
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdminRole(['OWNER', 'ADMIN']);
    const body = await request.json();
    const validated = CreateRaffleSchema.parse(body);

    const raffle = await RaffleService.createRaffle(validated, session.userId, session.role);

    return NextResponse.json({ success: true, raffle }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Falha ao criar sorteio';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
