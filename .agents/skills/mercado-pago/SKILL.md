---
name: mercado-pago
description: Integração segura com Mercado Pago, Checkout Transparente (Pix e Cartão), Webhooks com HMAC e conformidade PCI.
---

# Skill: Mercado Pago Integration

## Quando Utilizar
Utilize esta skill sempre que estiver criando, configurando ou refatorando integrações com o gateway Mercado Pago, gerando cobranças Pix, processando pagamentos com cartão via tokenização segura e validando webhooks.

## Arquitetura da Integração

### Componentes Chave
- **SDK v2 / API REST Oficial**: Comunicação direta com a API do Mercado Pago via endpoints `/v1/payments`.
- **Checkout Transparente**:
  - **Pix**: Criado via API no backend (`payment_method_id: 'pix'`). Retorna `point_of_interaction.transaction_data.qr_code` (código Copia e Cola) e `qr_code_base64` (imagem do QR Code).
  - **Cartão de Crédito**: Token gerado no navegador do usuário utilizando MercadoPago.js (`mp.fields.createCardToken(...)`). O token de uso único (`token`) é enviado ao backend juntamente com `installments` e `payment_method_id`.
- **Webhooks Seguros (`/api/webhooks/mercadopago`)**:
  - Validação do cabeçalho `x-signature` usando o `MP_WEBHOOK_SECRET`:
    1. Extrair `ts` (timestamp) e `v1` (hash HMAC SHA256) do header `x-signature`.
    2. Montar o template: `id:[data.id_url];request-id:[x-request-id];ts:[ts];`.
    3. Gerar HMAC SHA256 com a chave secreta e comparar em tempo constante (`crypto.timingSafeEqual`).
    4. Se inválido, retornar HTTP 401/403 imediatamente sem processamento.
- **Idempotência**: Todo request de pagamento envia cabeçalho `X-Idempotency-Key` único gerado para o pedido.

## Erros Comuns
1. Enviar o número do cartão (PAN), data de validade e CVV diretamente para o backend da nossa aplicação (violação grave de PCI-DSS).
2. Deixar credenciais privadas (`MP_ACCESS_TOKEN` ou `MP_WEBHOOK_SECRET`) com prefixo `NEXT_PUBLIC_`.
3. Confiar no status retornado no redirecionamento do navegador sem consultar a API ou aguardar o webhook verificado.
4. Processar o mesmo webhook repetidamente quando o Mercado Pago reenviar a notificação.

## Checklist
- [ ] Credenciais carregadas estritamente no ambiente do servidor.
- [ ] Validação criptográfica do header `x-signature` no webhook.
- [ ] Registro do evento na tabela `webhook_events` antes de disparar ações transacionais.
- [ ] Suporte a dev/sandbox com mock controlado ou credenciais de teste do MP.
- [ ] Polling inteligente com limite de tentativas no frontend enquanto o webhook processa.

## Regras Que Nunca Devem Ser Violadas
- NUNCA armazenar dados sensíveis de cartão (PAN, CVV, trilha).
- NUNCA marcar pedido como pago sem validação criptográfica do webhook ou consulta direta à API do Mercado Pago no backend.
