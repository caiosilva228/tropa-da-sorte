-- ==============================================================================
-- TROPA DA SORTE - SCHEMA INICIAL DO BANCO DE DADOS (PostgreSQL / Supabase)
-- ==============================================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Tabela de Administradores
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'ADMIN' CHECK (role IN ('OWNER', 'ADMIN', 'OPERATOR', 'VIEWER')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Sorteios / Campanhas (Raffles)
CREATE TABLE IF NOT EXISTS raffles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description_short TEXT,
    description_full TEXT,
    prize_name VARCHAR(255) NOT NULL,
    prize_value_in_cents BIGINT NOT NULL DEFAULT 0,
    banner_desktop_url TEXT,
    banner_mobile_url TEXT,
    total_numbers INTEGER NOT NULL CHECK (total_numbers >= 10),
    first_number INTEGER NOT NULL DEFAULT 0,
    last_number INTEGER NOT NULL DEFAULT 999,
    number_digits INTEGER NOT NULL DEFAULT 4,
    price_per_number_in_cents BIGINT NOT NULL CHECK (price_per_number_in_cents > 0),
    min_numbers_per_order INTEGER NOT NULL DEFAULT 1,
    max_numbers_per_order INTEGER NOT NULL DEFAULT 100,
    reservation_minutes INTEGER NOT NULL DEFAULT 15,
    allow_manual_choice BOOLEAN NOT NULL DEFAULT true,
    allow_random_choice BOOLEAN NOT NULL DEFAULT true,
    show_sold_numbers BOOLEAN NOT NULL DEFAULT true,
    show_reserved_numbers BOOLEAN NOT NULL DEFAULT true,
    show_partial_customer_name BOOLEAN NOT NULL DEFAULT true,
    draw_method VARCHAR(100) DEFAULT 'loteria_federal',
    draw_reference VARCHAR(255),
    draw_date TIMESTAMP WITH TIME ZONE,
    winning_number VARCHAR(50),
    draw_evidence_url TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'sold_out', 'completed', 'cancelled')),
    starts_at TIMESTAMP WITH TIME ZONE,
    ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Compradores / Clientes
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    cpf_masked VARCHAR(20),
    cpf_hash VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de Pedidos (Orders)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_id VARCHAR(50) UNIQUE NOT NULL,
    raffle_id UUID NOT NULL REFERENCES raffles(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    subtotal_in_cents BIGINT NOT NULL CHECK (subtotal_in_cents >= 0),
    discount_in_cents BIGINT NOT NULL DEFAULT 0,
    total_amount_in_cents BIGINT NOT NULL CHECK (total_amount_in_cents > 0),
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'awaiting_payment', 'processing', 'paid', 'failed', 'expired', 'cancelled', 'refunded')),
    payment_method VARCHAR(50) CHECK (payment_method IN ('pix', 'credit_card', 'manual')),
    reservation_token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela de Números do Sorteio (Raffle Numbers)
CREATE TABLE IF NOT EXISTS raffle_numbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    raffle_id UUID NOT NULL REFERENCES raffles(id) ON DELETE CASCADE,
    number INTEGER NOT NULL,
    formatted_number VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'held', 'pending_payment', 'reserved_manual', 'paid', 'cancelled', 'expired', 'refunded', 'blocked')),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    reservation_id UUID,
    reserved_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_raffle_number UNIQUE (raffle_id, number)
);

-- 6. Tabela de Números do Pedido (Order Numbers)
CREATE TABLE IF NOT EXISTS order_numbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    raffle_number_id UUID NOT NULL REFERENCES raffle_numbers(id) ON DELETE RESTRICT,
    number INTEGER NOT NULL,
    formatted_number VARCHAR(50) NOT NULL,
    price_in_cents BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tabela de Pagamentos (Payments)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    provider VARCHAR(50) NOT NULL DEFAULT 'mercadopago',
    provider_payment_id VARCHAR(100),
    provider_order_id VARCHAR(100),
    amount_in_cents BIGINT NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'BRL',
    method VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'refunded', 'in_process')),
    external_reference VARCHAR(255),
    idempotency_key VARCHAR(255) UNIQUE,
    qr_code TEXT,
    qr_code_base64 TEXT,
    raw_payload JSONB,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Tabela de Eventos de Webhook (Webhook Events - Idempotência)
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL DEFAULT 'mercadopago',
    provider_event_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processed', 'ignored', 'failed')),
    error_message TEXT,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uq_provider_event UNIQUE (provider, provider_event_id)
);

-- 9. Tabela de Comprovantes (Receipts)
CREATE TABLE IF NOT EXISTS receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verification_code VARCHAR(100) UNIQUE NOT NULL,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    raffle_id UUID NOT NULL REFERENCES raffles(id) ON DELETE RESTRICT,
    pdf_url TEXT,
    metadata JSONB,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Tabela de Auditoria (Audit Logs - Append-Only)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id VARCHAR(255) NOT NULL,
    actor_role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    old_value JSONB,
    new_value JSONB,
    reason TEXT,
    ip_address VARCHAR(100),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Tabela de Configurações Gerais da Plataforma
CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- ÍNDICES DE PERFORMANCE E INTEGRIDADE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_raffle_numbers_status ON raffle_numbers (raffle_id, status);
CREATE INDEX IF NOT EXISTS idx_raffle_numbers_lookup ON raffle_numbers (raffle_id, number);
CREATE INDEX IF NOT EXISTS idx_raffle_numbers_expires ON raffle_numbers (status, expires_at) WHERE status = 'pending_payment';
CREATE INDEX IF NOT EXISTS idx_orders_public_id ON orders (public_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders (customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_raffle ON orders (raffle_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments (order_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_id ON payments (provider_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_idempotency ON payments (idempotency_key);
CREATE INDEX IF NOT EXISTS idx_receipts_code ON receipts (verification_code);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers (phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers (email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs (created_at DESC);
