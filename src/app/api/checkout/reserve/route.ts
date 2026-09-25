import { NumberReservationService } from '@/server/services/number-reservation.service';
import { CreateReservationSchema } from '@/types';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = CreateReservationSchema.parse(body);

    const result = await NumberReservationService.reserveNumbers(validated);

    return NextResponse.json({
      success: true,
      order: {
        id: result.order.id,
        publicId: result.order.publicId,
        quantity: result.order.quantity,
        totalAmountInCents: result.order.totalAmountInCents,
        reservationToken: result.order.reservationToken,
        expiresAt: result.order.expiresAt,
        numbers: result.order.numbers,
      },
    }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Falha ao processar reserva';
    const isConflict = message.includes('acabou(aram) de ser escolhido(s)');
    return NextResponse.json(
      { success: false, error: message },
      { status: isConflict ? 409 : 400 }
    );
  }
}
