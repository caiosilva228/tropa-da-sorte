---
name: automated-tests
description: Estratégias de testes automatizados para concorrência, idempotência, reservas com expiração e fluxos E2E.
---

# Skill: Automated Tests

## Quando Utilizar
Utilize esta skill para projetar, escrever e executar testes de unidade, integração e ponta a ponta com foco nas regras críticas do sistema de sorteios.

## Cenários de Testes Obrigatórios

### 1. Teste de Concorrência Extrema (Race Conditions)
- Simular 100 requisições simultâneas disputando o mesmo número (`007`).
- Asserção: Exatamente 1 requisição deve obter sucesso (HTTP 200/201) e status `pending_payment` com reserva criada. 99 requisições devem receber erro de conflito (HTTP 409) informando indisponibilidade.
- Asserção no banco: Apenas um registro na tabela de reservas atrelado ao número `007`.

### 2. Teste de Idempotência de Webhook
- Enviar o mesmo payload de notificação de pagamento do Mercado Pago 10 vezes consecutivas para o endpoint de webhook.
- Asserção: A primeira requisição processa a aprovação e marca os números como `paid`. As 9 seguintes retornam HTTP 200/204 informando que o evento já foi processado sem duplicar comprovantes ou reexecutar efeitos colaterais.

### 3. Teste de Expiração de Reserva
- Criar reserva com TTL curto e avançar o relógio do sistema.
- Executar a rotina de limpeza de reservas expiradas.
- Asserção: Os números com reserva vencida voltam imediatamente ao status `available`.

### 4. Teste de Tentativa de Manipulação de Preço
- Enviar payload malicioso com valor total menor do que a quantidade de números multiplicada pelo preço do sorteio.
- Asserção: O backend ignora o valor enviado pelo cliente, recalcula o preço correto com base no sorteio ou rejeita a requisição.

### 5. Testes E2E (Playwright)
- Fluxo de ponta a ponta do comprador: escolha de números → dados cadastrais → pagamento Pix simulado → aprovação → tela de sucesso → download de comprovante.
- Fluxo do administrador: login → wizard de criação de ação → visualização no mapa de números → reserva manual → confirmação manual.

## Checklist
- [ ] Testes unitários com Vitest rodando em tempo mínimo.
- [ ] Testes de integração cobrindo transações com banco de dados real/isolado.
- [ ] Testes de concorrência com asserções numéricas estritas.
- [ ] Testes E2E cobrindo resoluções mobile e desktop.

## Regras Que Nunca Devem Ser Violadas
- NUNCA considerar o sistema concluído sem testes de concorrência e idempotência passando com 100% de sucesso.
