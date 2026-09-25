---
name: admin-dashboard
description: Estrutura do painel administrativo profissional, arquitetura em pastas por ação, mapa visual de números e gestão transacional.
---

# Skill: Admin Dashboard

## Quando Utilizar
Utilize esta skill sempre que estiver desenvolvendo ou refinando telas, componentes e fluxos do painel administrativo: home do admin, criação de sorteios via wizard dialog, mapa visual de números (grid administrativo), reservas manuais, confirmações manuais de pagamento, clientes, pedidos e auditoria.

## Arquitetura do Painel Administrativo

### Conceito de Pastas Independentes por Sorteio
Cada sorteio criado funciona como uma pasta independente de gestão:
- **Visão Geral**: Métricas em tempo real (Faturamento, Total de números, Vendidos, Reservados, Disponíveis, Barra de progresso e faltantes).
- **Mapa de Números**: Grid interativo de alta legibilidade com legenda fixa (`Disponível`, `Pago`, `Reservado`, `Pendente`, `Bloqueado`), busca rápida (por número, cliente, telefone ou pedido) e drawers contextuais.
- **Ações no Número**: Ao clicar em um número, abrir drawer com detalhes completos do comprador/pedido e ações contextuais:
  - Reservar manualmente (com dados do cliente e prazo ou sem expiração);
  - Marcar como pago manualmente (com obrigatoriedade de motivo, forma e referência/comprovante);
  - Liberar número;
  - Bloquear número.
- **Seleção em Massa**: Checkboxes para aplicar ações em lote com validações de integridade.
- **Clientes**: Listagem com busca, perfil individual, histórico de compras por sorteio e total investido.
- **Pedidos e Pagamentos**: Tabelas com filtros de status e visualização de eventos brutos de webhook.
- **Configurações**: Edição de dados da ação, imagens, banners, regulamento, termos e SEO.
- **Auditoria**: Tabela imutável de logs de ações administrativas.

### Wizard de Criação de Sorteio (Modal / Dialog com Etapas)
- **Etapa 1 - Informações**: Nome, slug auto-gerado, descrição curta/completa, prêmio, valor estimado, organizador e datas.
- **Etapa 2 - Banners e Identidade**: Upload desktop, mobile, logo e cores de destaque com preview em tempo real.
- **Etapa 3 - Configuração Numérica**: Total de números (100 a 100.000), cálculo de dígitos (`000` a `999`), número inicial/final, preço unitário em centavos, limites por pedido e regras de escolha (manual vs. aleatório).
- **Ações Finais**: Salvar Rascunho, Visualizar Preview Protegido e Publicar Ação.

## Checklist
- [ ] Operações críticas (confirmar pagamento manual, bloquear número) exigem modal de confirmação com campo de justificativa.
- [ ] Grid de números com suporte a paginação/virtualização para não renderizar 100.000 nós no DOM.
- [ ] Responsividade no celular: tabelas convertidas em cards ou drawers touch-friendly.
- [ ] Registro automático de `audit_logs` para toda ação do operador.

## Regras Que Nunca Devem Ser Violadas
- NUNCA executar confirmação de pagamento manual sem registrar quem realizou, quando, motivo e referência.
- NUNCA expor segredos de credenciais no frontend do dashboard administrativo.
