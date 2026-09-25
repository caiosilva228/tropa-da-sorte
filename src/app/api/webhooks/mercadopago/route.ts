import { MercadoPagoService } from '@/server/integrations/mercadopago';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const xSignature = request.headers.get('x-signature');
    const xRequestId = request.headers.get('x-request-id');

    let body: Record<string, unknown> = {};
    try {
      body = await request.json();
    } catch {
      // Alguns webhooks do MP enviam notification por query params
    }

    // Extrair ID do pagamento dos query params ou do body
    const dataId = (body.data as { id?: string })?.id || url.searchParams.get('data.id') || url.searchParams.get('id');
    const externalRef = (body.external_reference as string) || url.searchParams.get('external_reference') || undefined;

    if (!dataId) {
      // Notificação sem ID de dados, responder 200 para evitar retentativas desnecessárias
      return NextResponse.json({ received: true, note: 'No data.id present' }, { status: 200 });
    }

    // 1. Validação de Assinatura Criptográfica HMAC SHA256
    const isSignatureValid = MercadoPagoService.verifyWebhookSignature(xSignature, dataId, xRequestId);
    if (!isSignatureValid) {
      console.warn('[WEBHOOK SPOOFING REJECTED] Assinatura x-signature inválida:', { xSignature, dataId });
      return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 });
    }

    // 2. Processamento Transacional Idempotente
    const result = await MercadoPagoService.processWebhookPaymentApproved(dataId, externalRef);

    return NextResponse.json({
      success: true,
      processed: result.success,
      alreadyProcessed: result.alreadyProcessed,
    }, { status: 200 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Erro ao processar webhook';
    console.error('[WEBHOOK ERROR]:', errorMsg);
    // Respondemos 200 com erro logado para o MP não ficar em loop infinito se o pedido não existir
    return NextResponse.json({ success: false, error: errorMsg }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Mercado Pago Webhook Endpoint ativo' }, { status: 200 });
}
