import { NumberReservationService } from '@/server/services/number-reservation.service';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const url = new URL(request.url);
    const quantity = parseInt(url.searchParams.get('qty') || '5', 10);

    const randomNumbers = await NumberReservationService.getRandomAvailableNumbers(id, quantity);
    return NextResponse.json({ success: true, numbers: randomNumbers });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao buscar números aleatórios';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
