---
name: raffle-domain
description: Regras de negócio, máquina de estados do sorteio e entidades fundamentais da plataforma de ações numeradas.
---

# Skill: Raffle Domain

## Quando Utilizar
Utilize esta skill sempre que estiver modelando, implementando ou alterando regras de negócio relativas a campanhas de sorteios (Raffles), status de números, cálculo de valores, limites de compra por pedido e máquina de estados das ações.

## Arquitetura do Domínio

### Estados do Sorteio (`RaffleStatus`)
- `draft`: Rascunho, visível apenas para administradores. Não aceita compras nem reservas.
- `scheduled`: Agendado para data futura de início automático.
- `active`: Ativo para seleção de números e compras públicas.
- `paused`: Interrompido temporariamente. Página pública visível com aviso, mas compras travadas.
- `sold_out`: Todos os números foram definitivamente vendidos (`paid`). Novas compras bloqueadas.
- `completed`: Sorteio finalizado com apuração do vencedor e registro de auditoria.
- `cancelled`: Ação cancelada com rotinas de reembolso.

### Estados do Número (`NumberStatus`)
- `available`: Disponível para escolha ou sorteio aleatório.
- `held`: Selecionado temporariamente na sessão do cliente atual (carrinho local / pré-reserva).
- `pending_payment`: Reservado com pedido criado e aguardando confirmação do pagamento (TTL ativo).
- `reserved_manual`: Reservado administrativamente por um operador.
- `paid`: Pagamento confirmado com sucesso. Número pertence definitivamente ao comprador.
- `cancelled`: Reserva cancelada por desistência do comprador ou operador.
- `expired`: Reserva temporária expirada por decurso de prazo sem pagamento. Retorna a `available`.
- `refunded`: Pagamento foi estornado/devolvido.
- `blocked`: Bloqueado pelo administrador para fins de segurança ou contingência.

### Formatação Numérica e Dígitos
- 100 números: `00` a `99` (2 dígitos) ou `001` a `100` (3 dígitos), conforme configurado.
- 1.000 números: `000` a `999` (3 dígitos) ou `0001` a `1000` (4 dígitos).
- 10.000 números: `0000` a `9999` (4 dígitos) ou `00001` a `10000` (5 dígitos).
- 100.000 números: `00000` a `99999` (5 dígitos).

### Valores Monetários
- Todos os preços, taxas e subtotais devem ser mantidos no banco e nas operações em **centavos inteiros** (`price_in_cents: 500` para R$ 5,00).

## Erros Comuns
1. Calcular preço multiplicando floats no JavaScript (`0.1 + 0.2 = 0.30000000000000004`).
2. Confiar no total financeiro enviado no payload do cliente.
3. Permitir transição direta de `available` para `paid` sem passar pelo fluxo de pedido e validação de gateway.
4. Mudar o status do sorteio para `sold_out` contando números em reserva temporária que podem expirar e voltar a ficar disponíveis.

## Checklist
- [ ] Entidades mapeadas com TypeScript strict e schemas Zod.
- [ ] Validações de limites mínimo e máximo de números por pedido respeitadas.
- [ ] Máquina de estados validando transições válidas no backend.
- [ ] Preço total recalculado no servidor a partir da quantidade de números multiplicada pelo `price_per_number_in_cents` registrado no sorteio.
- [ ] Geração determinística de slug a partir do nome da ação.

## Regras Que Nunca Devem Ser Violadas
- NUNCA aceitar valor monetário vindo do frontend sem validação no banco.
- NUNCA permitir compra em sorteio com status diferente de `active`.
- NUNCA misturar apuração do sorteio com a rotina de transações de compra.
