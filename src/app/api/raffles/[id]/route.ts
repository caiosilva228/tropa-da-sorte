import { Database } from '@/server/db';
import { NumberReservationService } from '@/server/services/number-reservation.service';
import { maskName } from '@/lib/formatters';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const state = await Database.getState();

    // Localizar sorteio por slug ou por ID
    const raffle = state.raffles.find((r) => r.slug === id || r.id === id);
    if (!raffle) {
      return NextResponse.json({ error: 'Sorteio não encontrado' }, { status: 404 });
    }

    // Executar limpeza proativa de números expirados
    await NumberReservationService.expirePendingReservations(raffle.id);
    const updatedState = await Database.getState();

    // Obter números do sorteio
    const numbers = updatedState.raffleNumbers
      .filter((n) => n.raffleId === raffle.id)
      .map((n) => ({
        id: n.id,
        number: n.number,
        formattedNumber: n.formattedNumber,
        status: n.status,
        customerName: raffle.showPartialCustomerName && n.customerName ? maskName(n.customerName) : null,
      }));

    // Métricas
    const totalNumbers = raffle.totalNumbers;
    const paidNumbers = numbers.filter((n) => n.status === 'paid').length;
    const reservedNumbers = numbers.filter((n) => n.status === 'pending_payment' || n.status === 'reserved_manual').length;
    const availableNumbers = numbers.filter((n) => n.status === 'available').length;
    const percentagePaid = totalNumbers > 0 ? ((paidNumbers / totalNumbers) * 100).toFixed(1) : '0';

    return NextResponse.json({
      raffle,
      numbers,
      metrics: {
        totalNumbers,
        paidNumbers,
        reservedNumbers,
        availableNumbers,
        percentagePaid: parseFloat(percentagePaid),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao carregar dados do sorteio';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
