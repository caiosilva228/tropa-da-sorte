# 🍀 TROPA DA SORTE — Plataforma Completa de Ações Numeradas & Sorteios

Plataforma profissional, transacional e de alta concorrência para gerenciamento e venda de números de sorteios/ações digitais, com identidade visual urbana e moderna da **Tropa da Sorte**, checkout transparente integrado ao **Mercado Pago** (Pix instantâneo e Cartão), geração de comprovantes oficiais em PDF e painel administrativo organizado em **pastas de ações** com **mapa visual de números**.

---

## ⚡ Principais Funcionalidades

### 📱 Experiência Pública do Comprador (Mobile-First)
- **Design System Tropa da Sorte**: Dark Mode imersivo (`#101214`), Verde Neon (`#16C784`), Dourado (`#FFC928`) e tipografia moderna de alto contraste.
- **Hero do Prêmio**: Destaque para o prêmio (ex: Honda CG 160 0KM), valor por número e badges de confiança imediata.
- **Barra de Progresso Real**: "A tropa tá fechando! 🔥" com percentual preenchido e contagem de números faltantes.
- **Seleção Rápida**: Botões `+5`, `+10`, `+20`, `+50` e botão inteligente **"🍀 Escolher números pra mim"**.
- **Grid de Números Interativo**: Janelamento de alta performance, busca com preenchimento de zeros e status claros (Disponível, Selecionado, Reservado, Pago).
- **Sticky Bottom Cart**: Barra ergonômica fixada no rodapé mobile com total em Reais e CTA "CONTINUAR 🔥".
- **Checkout Transparente**: Cadastro simples com nome, WhatsApp e e-mail.
- **Pagamento Pix**: Geração de QR Code dinâmico, código Copia e Cola com cópia em 1 toque ("Pix copiado! 🔥"), contador regressivo de 15 minutos e polling em tempo real.
- **Tela de Conquista**: "TÁ NA TROPA! 🔥🍀" com confetes e números adquiridos em destaque.
- **Comprovante Oficial PDF**: Download instantâneo de comprovante em PDF e código de validação pública (`/verificar/[code]`).

### 💻 Painel Administrativo Profissional
- **Organização em Pastas Independentes**: Cada sorteio funciona como uma pasta de trabalho isolada.
- **Home com Métricas**: Faturamento total, bolas vendidas, reservas ativas e progresso global.
- **Wizard de Nova Ação**: Dialog modal em 3 etapas (Informações, Banners & Mídia, Bolas & Preço) com geração de slug em tempo real e cálculo automático de dígitos (`0000` a `0999`).
- **Mapa Visual de Números**: Grade de alta legibilidade com legenda fixa (`Disponível`, `Pago`, `Reservado Manual`, `Aguardando Pagamento`, `Bloqueado`).
- **Drawer de Ações no Número**:
  - Detalhes completos do comprador, pedido, telefone e valor.
  - Reserva manual administrativa (com ou sem prazo de expiração).
  - Confirmação manual de pagamento (com obrigatoriedade de motivo, forma e referência).
- **Gestão de Compradores e Pedidos**: Histórico de clientes, total investido e download de comprovantes.
- **Auditoria Imutável (Append-Only)**: Rastreabilidade de cada alteração sensível efetuada por administradores e operadores.

---

## 🔒 Regras de Ouro e Segurança Financeira
1. **NUNCA VENDER O MESMO NÚMERO DUAS VEZES**: Constraint relacional `UNIQUE(raffle_id, number)` e bloqueio atômico de linha com `SELECT ... FOR UPDATE`.
2. **Autoridade Servidora**: O frontend nunca dita preços ou status de pagamento. Todo o valor financeiro é calculado no backend em **centavos inteiros** (`integer cents`).
3. **Idempotência no Webhook**: Tabela `webhook_events` com chave única `provider + provider_event_id` impede confirmações duplicadas.
4. **Validação de Assinatura HMAC SHA256**: Validação criptográfica do header `x-signature` do Mercado Pago contra ataques de webhook spoofing.
5. **Conformidade LGPD**: CPFs mascarados e sem exposição pública de dados sensíveis.

---

## 🚀 Como Executar o Projeto Localmente

### 1. Clonar e Instalar Dependências
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente
Copie o arquivo de exemplo:
```bash
cp .env.example .env.local
```

### 3. Executar em Desenvolvimento
```bash
npm run dev
```
Acesse:
- **Página Pública**: [http://localhost:3000](http://localhost:3000)
- **Ação Honda CG 160**: [http://localhost:3000/sorteio/honda-cg-160](http://localhost:3000/sorteio/honda-cg-160)
- **Painel Administrativo**: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)  
  *Credenciais de teste padrão:*  
  E-mail: `admin@tropadasorte.com.br`  
  Senha: `admin123456`

### 4. Executar os Testes Automatizados
```bash
npm test
```
A suíte executa testes de concorrência com 100 requisições simultâneas disputando o mesmo número, testes de idempotência com 10 webhooks repetidos e testes de expiração de reserva (TTL).

### 5. Build de Produção
```bash
npm run build
```

---

## 📁 Estrutura de Documentação
- [Arquitetura do Sistema](docs/architecture.md)
- [Modelo de Banco de Dados e Concorrência](docs/database.md)
- [Integração Mercado Pago e Conciliação](docs/payments.md)
- [Segurança e Conformidade LGPD](docs/security.md)
- [Guia de Deploy e Produção](docs/deployment.md)

---

Desenvolvido para a **Tropa da Sorte** 🍀
