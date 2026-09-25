---
name: security-review
description: Protocolos de segurança de aplicações financeiras, proteção OWASP, rate limiting, mitigação de spoofing e conformidade LGPD.
---

# Skill: Security Review & Hardening

## Quando Utilizar
Utilize esta skill em revisões de código, novos endpoints de API, validação de rotas autenticadas, tratamento de dados de clientes e validação de webhooks.

## Pilares de Segurança

### 1. Autenticação e Autorização Servidora (RBAC)
- Todas as rotas sob `/admin` e `/api/admin` devem validar o token de sessão no servidor.
- Os perfis permitidos são:
  - `OWNER`: Acesso irrestrito a configurações, credenciais, relatórios e auditoria.
  - `ADMIN`: Gestão de sorteios, publicação e parametrizações.
  - `OPERATOR`: Criação de reservas manuais, confirmação manual de pagamento (com justificativa) e atendimento ao cliente.
  - `VIEWER`: Apenas leitura de relatórios e métricas.

### 2. Proteção contra Manipulação de Parâmetros e Preços
- O cliente nunca envia o preço unitário ou o total a ser pago.
- O endpoint de checkout recebe apenas os números solicitados e o ID do sorteio. O backend consulta a base de dados, calcula o total em centavos e gera a ordem de pagamento.

### 3. Rate Limiting em Rotas Críticas
- Login administrativo: máximo de 5 tentativas por minuto por IP.
- Reserva de números e checkout: máximo de 10 requisições por minuto por IP/sessão para conter bots.
- Busca pública de números e comprovantes: limite para conter raspagem e enumeração de dados.

### 4. Privacidade e LGPD
- O número de CPF nunca é exposto publicamente nem usado como chave primária exposta em URLs.
- Listagens públicas ou de ganhadores exibem apenas nome parcial e telefone com máscara (ex: `João da S. - (11) 9****-8844`).

## Checklist
- [ ] Validação criptográfica de assinaturas HMAC em webhooks externos.
- [ ] Proteção contra SQL Injection assegurada por ORM/queries parametrizadas com prepared statements.
- [ ] Headers de segurança HTTP (`Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`).
- [ ] Sanitização contra XSS em descrições e títulos de sorteios.

## Regras Que Nunca Devem Ser Violadas
- NUNCA trafegar nem armazenar número de cartão, CVV ou dados PCI sem conformidade.
- NUNCA expor dados sensíveis de compradores em endpoints públicos.
