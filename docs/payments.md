# Integração Mercado Pago e Conciliação Financeira — Tropa da Sorte

## 1. Visão Geral
A integração utiliza a API REST oficial do Mercado Pago (Checkout Transparente) para Pix e Cartão com tokenização client-side.

## 2. Fluxo do Pix
1. Cliente seleciona números e clica em "Garantir meus números".
2. Backend reserva os números com TTL de 15 minutos e status `pending_payment`.
3. Backend requisita a criação do pagamento na API do Mercado Pago com `X-Idempotency-Key: idemp-{orderId}`.
4. Mercado Pago retorna o QR Code visual (`qr_code_base64`) e a chave Copia e Cola (`qr_code`).
5. Frontend exibe a tela de pagamento com botão "COPIAR CÓDIGO PIX" e countdown da reserva.
6. Ao receber o pagamento, o Mercado Pago envia a notificação via Webhook.

## 3. Webhook com Assinatura Criptográfica HMAC SHA256
- Endpoint: `/api/webhooks/mercadopago`
- O header `x-signature` é validado usando a chave `MP_WEBHOOK_SECRET`:
  - Se a assinatura for inválida, a requisição é rejeitada com HTTP 401 para impedir ataques de spoofing.
- **Idempotência**:
  - Antes de alterar qualquer registro, verifica-se a tabela `webhook_events`.
  - Se o evento já tiver sido processado, retorna HTTP 200 imediatamente sem duplicar efeitos colaterais.

## 4. Reconciliação Transacional
Ao confirmar a aprovação:
```sql
BEGIN;
  -- Atualiza pagamento
  UPDATE payments SET status = 'approved', approved_at = NOW() WHERE order_id = $orderId;
  -- Atualiza pedido
  UPDATE orders SET status = 'paid', paid_at = NOW() WHERE id = $orderId;
  -- Atualiza números
  UPDATE raffle_numbers SET status = 'paid', expires_at = NULL WHERE order_id = $orderId;
  -- Emite recibo
  INSERT INTO receipts ...;
  -- Registra auditoria
  INSERT INTO audit_logs ...;
COMMIT;
```
