import { ReceiptService } from '@/server/services/receipt.service';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await context.params;
    const receipt = await ReceiptService.getReceiptByOrderId(orderId);

    if (!receipt) {
      return NextResponse.json({ error: 'Comprovante não encontrado para este pedido.' }, { status: 404 });
    }

    const pdfBuffer = await ReceiptService.generateReceiptPdfBuffer(receipt);

    return new Response(pdfBuffer as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="comprovante-${receipt.orderPublicId}.pdf"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao gerar comprovante';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
