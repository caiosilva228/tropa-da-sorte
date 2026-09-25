import { ReceiptService } from '@/server/services/receipt.service';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await context.params;
    const receipt = await ReceiptService.getReceiptByVerificationCode(code);

    if (!receipt) {
      return NextResponse.json({ valid: false, message: 'Comprovante não encontrado ou inválido' }, { status: 404 });
    }

    return NextResponse.json({
      valid: true,
      receipt: {
        verificationCode: receipt.verificationCode,
        orderPublicId: receipt.orderPublicId,
        raffleName: receipt.raffleName,
        customerName: receipt.customerName,
        numbersCount: receipt.numbers.length,
        numbers: receipt.numbers,
        totalAmountInCents: receipt.totalAmountInCents,
        issuedAt: receipt.issuedAt,
        status: 'PAGO',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao validar comprovante';
    return NextResponse.json({ valid: false, error: message }, { status: 500 });
  }
}
