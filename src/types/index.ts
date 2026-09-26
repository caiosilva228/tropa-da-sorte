import { z } from 'zod';

// ==============================================================================
// DOMAIN STATUS TYPES
// ==============================================================================

export type RaffleStatus =
  | 'draft'
  | 'scheduled'
  | 'active'
  | 'paused'
  | 'sold_out'
  | 'completed'
  | 'cancelled';

export type NumberStatus =
  | 'available'
  | 'held'
  | 'pending_payment'
  | 'reserved_manual'
  | 'paid'
  | 'cancelled'
  | 'expired'
  | 'refunded'
  | 'blocked';

export type OrderStatus =
  | 'draft'
  | 'awaiting_payment'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'expired'
  | 'cancelled'
  | 'refunded';

export type PaymentMethod =
  | 'pix'
  | 'credit_card'
  | 'manual';

export type PaymentStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'refunded'
  | 'in_process';

export type AdminRole =
  | 'OWNER'
  | 'ADMIN'
  | 'OPERATOR'
  | 'VIEWER';

export type WebhookEventStatus =
  | 'received'
  | 'processed'
  | 'ignored'
  | 'failed';

// ==============================================================================
// DOMAIN ENTITIES
// ==============================================================================

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: AdminRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface Raffle {
  id: string;
  name: string;
  slug: string;
  descriptionShort: string | null;
  descriptionFull: string | null;
  prizeName: string;
  prizeValueInCents: number;
  bannerDesktopUrl: string | null;
  bannerMobileUrl: string | null;
  totalNumbers: number;
  firstNumber: number;
  lastNumber: number;
  numberDigits: number;
  pricePerNumberInCents: number;
  minNumbersPerOrder: number;
  maxNumbersPerOrder: number;
  reservationMinutes: number;
  allowManualChoice: boolean;
  allowRandomChoice: boolean;
  showSoldNumbers: boolean;
  showReservedNumbers: boolean;
  showPartialCustomerName: boolean;
  drawMethod: string;
  drawReference: string | null;
  drawDate: string | null;
  winningNumber: string | null;
  drawEvidenceUrl: string | null;
  status: RaffleStatus;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RaffleNumber {
  id: string;
  raffleId: string;
  number: number;
  formattedNumber: string;
  status: NumberStatus;
  customerId?: string | null;
  customerName?: string | null;
  orderId?: string | null;
  reservationId?: string | null;
  reservedAt?: string | null;
  expiresAt?: string | null;
  paidAt?: string | null;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpfMasked?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  publicId: string;
  raffleId: string;
  customerId: string;
  customer?: Customer;
  quantity: number;
  subtotalInCents: number;
  discountInCents: number;
  totalAmountInCents: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod | null;
  reservationToken: string;
  expiresAt: string | null;
  paidAt: string | null;
  numbers: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  provider: 'mercadopago' | 'manual';
  providerPaymentId: string | null;
  providerOrderId: string | null;
  amountInCents: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  externalReference: string | null;
  idempotencyKey: string;
  qrCode?: string | null;
  qrCodeBase64?: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Receipt {
  id: string;
  verificationCode: string;
  orderId: string;
  customerId: string;
  raffleId: string;
  orderPublicId: string;
  customerName: string;
  customerPhoneMasked: string;
  raffleName: string;
  numbers: string[];
  totalAmountInCents: number;
  paymentMethod: PaymentMethod;
  issuedAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  reason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

// ==============================================================================
// ZOD VALIDATION SCHEMAS
// ==============================================================================

export const CustomerInputSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100),
  email: z.string().email('E-mail inválido').toLowerCase().trim(),
  phone: z.string().min(10, 'Telefone inválido').max(20).trim(),
  cpf: z.string().optional(),
});

export type CustomerInput = z.infer<typeof CustomerInputSchema>;

export const CreateReservationSchema = z.object({
  raffleId: z.string().uuid('ID do sorteio inválido'),
  numbers: z.array(z.number().int().nonnegative()).min(1, 'Selecione ao menos 1 número'),
  customer: CustomerInputSchema,
  paymentMethod: z.enum(['pix', 'credit_card']).default('pix'),
});

export type CreateReservationInput = z.infer<typeof CreateReservationSchema>;

export const CreateRaffleSchema = z.object({
  name: z.string().min(3, 'Nome obrigatório').max(100),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  descriptionShort: z.string().max(255).optional(),
  descriptionFull: z.string().optional(),
  prizeName: z.string().min(2, 'Nome do prêmio obrigatório'),
  prizeValueInCents: z.number().int().nonnegative('Valor do prêmio não pode ser negativo').default(0),
  bannerDesktopUrl: z.string().url().optional().or(z.literal('')).or(z.null()),
  bannerMobileUrl: z.string().url().optional().or(z.literal('')).or(z.null()),
  totalNumbers: z.number().int().min(10, 'Mínimo de 10 números').max(100000, 'Máximo de 100.000 números'),
  firstNumber: z.number().int().default(0),
  numberDigits: z.number().int().min(2).max(6).default(4),
  pricePerNumberInCents: z.number().int().positive('Preço por número deve ser maior que zero'),
  minNumbersPerOrder: z.number().int().min(1).default(1),
  maxNumbersPerOrder: z.number().int().min(1).default(100),
  reservationMinutes: z.number().int().min(5).max(60).default(15),
  allowManualChoice: z.boolean().default(true),
  allowRandomChoice: z.boolean().default(true),
  showSoldNumbers: z.boolean().default(true),
  showReservedNumbers: z.boolean().default(true),
  showPartialCustomerName: z.boolean().default(true),
});

export type CreateRaffleInput = z.infer<typeof CreateRaffleSchema>;

export const ManualReservationSchema = z.object({
  raffleId: z.string().uuid(),
  numbers: z.array(z.number().int().nonnegative()).min(1),
  customerName: z.string().min(2),
  customerPhone: z.string().min(8),
  customerEmail: z.string().email().optional().or(z.literal('')),
  notes: z.string().max(500).optional(),
  neverExpires: z.boolean().default(false),
  durationMinutes: z.number().int().min(5).default(60),
});

export type ManualReservationInput = z.infer<typeof ManualReservationSchema>;

export const ManualPaymentConfirmationSchema = z.object({
  orderId: z.string().uuid(),
  paymentMethod: z.enum(['pix_externo', 'dinheiro', 'transferencia', 'outro']),
  referenceCode: z.string().min(2, 'Informe o código ou comprovante de referência'),
  notes: z.string().min(5, 'Informe o motivo da confirmação manual'),
});

export type ManualPaymentConfirmationInput = z.infer<typeof ManualPaymentConfirmationSchema>;

export const UpdateRaffleRulesSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100).optional(),
  descriptionShort: z.string().max(255).optional().nullable(),
  descriptionFull: z.string().optional().nullable(),
  prizeName: z.string().min(2, 'Nome do prêmio é obrigatório').optional(),
  prizeValueInCents: z.number().int().nonnegative().optional(),
  bannerDesktopUrl: z.string().optional().nullable(),
  bannerMobileUrl: z.string().optional().nullable(),
  minNumbersPerOrder: z.number().int().min(1, 'Mínimo de 1 cota por pedido').optional(),
  maxNumbersPerOrder: z.number().int().min(1, 'Máximo deve ser no mínimo 1').optional(),
  reservationMinutes: z.number().int().min(1, 'Mínimo de 1 minuto').max(180, 'Máximo de 180 minutos').optional(),
  allowManualChoice: z.boolean().optional(),
  allowRandomChoice: z.boolean().optional(),
  showSoldNumbers: z.boolean().optional(),
  showReservedNumbers: z.boolean().optional(),
  showPartialCustomerName: z.boolean().optional(),
  drawMethod: z.string().optional(),
  drawReference: z.string().optional().nullable(),
  drawDate: z.string().optional().nullable(),
  status: z.enum(['draft', 'scheduled', 'active', 'paused', 'sold_out', 'completed', 'cancelled']).optional(),
});

export type UpdateRaffleRulesInput = z.infer<typeof UpdateRaffleRulesSchema>;

