# Políticas de Segurança e Conformidade — Tropa da Sorte

## 1. Autoridade Servidora e Zero Confiança no Cliente
- O cliente nunca envia o preço unitário do número ou o valor total a ser pago.
- O endpoint `/api/checkout/reserve` recebe apenas os números solicitados e o `raffleId`. O backend consulta a base de dados, multiplica pelo preço oficial da ação e calcula o valor total.

## 2. Autenticação Administrativa e RBAC
- Sessões protegidas por cookies `HttpOnly`, `SameSite: Lax` e `Secure` (em produção).
- Tokens JWT assinados com `ADMIN_JWT_SECRET` com tempo de vida de 24 horas.
- Papéis suportados:
  - `OWNER`: Acesso total e configurações.
  - `ADMIN`: Criação e gestão de sorteios.
  - `OPERATOR`: Reservas e confirmações manuais (exige justificativa registrada em log).
  - `VIEWER`: Leitura de métricas e relatórios.

## 3. Conformidade com a LGPD
- O CPF dos compradores não é exposto publicamente e recebe máscara (`***.123.***-**`).
- Telefones exibidos em listagens públicas são mascarados (ex: `(11) 9****-1234`).
- A página pública de verificação de comprovantes (`/verificar/[code]`) exibe apenas dados do sorteio, data e status, sem revelar e-mails ou documentos pessoais.

## 4. Auditoria Imutável (Append-Only)
- Toda ação administrativa (login, criação de ação, alteração de status, reserva manual, pagamento manual) insere um registro na tabela `audit_logs`.
- Nenhuma rota de API possui comandos de `UPDATE` ou `DELETE` para a tabela de auditoria.
