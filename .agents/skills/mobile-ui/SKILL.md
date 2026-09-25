---
name: mobile-ui
description: Padrões de design mobile-first, sticky cart, micro-interações, virtualização de grid e experiência do usuário da Tropa da Sorte.
---

# Skill: Mobile-First UI & Tropa da Sorte Experience

## Quando Utilizar
Utilize esta skill sempre que estiver desenvolvendo ou ajustando interfaces voltadas ao usuário final ou administradores mobile, especialmente na página de vendas pública da "Tropa da Sorte", na barra de carrinho flutuante (sticky cart) e no checkout simplificado.

## Diretrizes de Identidade "Tropa da Sorte"
- **Paleta de Cores**:
  - Fundo principal: `#101214` (Dark mode imersivo de alto contraste).
  - Cor de destaque/ação: `#16C784` (Verde vibrante / prêmio).
  - Cor de premiação/destaque secundário: `#FFC928` (Dourado / troféu).
  - Texto primário: `#FFFFFF`, secundário: cinzas neutros (`#9CA3AF`, `#4B5563`).
  - Cards e superfícies: `#181B1F` com bordas sutis `#262A30`.
- **Tom de Voz Popular e Enérgico**:
  - "Escolha seus números 👇", "A tropa tá fechando! 🔥", "Garantir meus números", "TÁ NA TROPA! 🔥🍀".
- **Fluxo com Zero Fricção**:
  1. Header com Logo "Tropa da Sorte" e botão "Meus Números";
  2. Banner do Prêmio em destaque com valor por número (ex: R$ 5,00);
  3. Barra de progresso real da ação (percentual vendido e números restantes);
  4. Botões rápidos de seleção (+5, +10, +20, +50, "🍀 Escolher números pra mim");
  5. Campo de busca por número com zeros à esquerda automáticos;
  6. Grid de números com visualização clara de status;
  7. **Sticky Bottom Cart** fixo no rodapé mobile com total e botão "CONTINUAR 🔥";
  8. Modal/Drawer de Checkout com identificação e seleção de Pix/Cartão;
  9. Tela de confirmação e download de comprovante PDF.

## Virtualização e Performance no Grid
- Sorteios com milhares de números (1.000 a 100.000) não podem injetar todos os nós no DOM de uma só vez.
- Utilizar janelamento por blocos/páginas (ex: 200 a 500 números por bloco visual) com filtros rápidos por faixa (`000-499`, `500-999`).

## Checklist
- [ ] Testado nas larguras: 320px, 360px, 375px, 390px, 430px, 768px, 1024px.
- [ ] Sticky bottom bar com padding seguro para áreas de gestos no iOS/Android (`safe-area-inset-bottom`).
- [ ] Inputs com tipagem correta (`type="tel"`, `type="email"`) para abrir teclados numéricos nativos no mobile.
- [ ] Botão de Copiar Pix com feedback tátil e toast imediato ("Pix copiado! 🔥").

## Regras Que Nunca Devem Ser Violadas
- NUNCA permitir overflow horizontal (scroll lateral indesejado) em nenhum dispositivo.
- NUNCA usar contadores ou alertas falsos de escassez.
