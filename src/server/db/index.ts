import {
  Raffle,
  RaffleNumber,
  Customer,
  Order,
  Payment,
  Receipt,
  AuditLog,
  AdminUser,
  WebhookEventStatus,
} from '@/types';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

// Interface do Repositório Transacional do Domínio
export interface DatabaseState {
  admins: AdminUser[];
  raffles: Raffle[];
  raffleNumbers: RaffleNumber[];
  customers: Customer[];
  orders: Order[];
  payments: Payment[];
  receipts: Receipt[];
  auditLogs: AuditLog[];
  webhookEvents: Array<{
    id: string;
    provider: string;
    providerEventId: string;
    eventType: string;
    payload: Record<string, unknown>;
    status: WebhookEventStatus;
    receivedAt: string;
    processedAt: string | null;
  }>;
}

const DB_FILE_PATH = path.join(process.cwd(), '.db_state.json');

// Mutex para simular LOCK atômico transacional e isolar requisições concorrentes
class Mutex {
  private queue: Array<() => void> = [];
  private locked = false;

  async acquire(): Promise<() => void> {
    return new Promise((resolve) => {
      const execute = () => {
        this.locked = true;
        resolve(() => {
          this.locked = false;
          const next = this.queue.shift();
          if (next) next();
        });
      };

      if (!this.locked) {
        execute();
      } else {
        this.queue.push(execute);
      }
    });
  }
}

const dbMutex = new Mutex();

function getInitialState(): DatabaseState {
  const adminId = 'd8f583bf-7c8a-4c54-93e1-3e4b097b6a12';
  const raffleId = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';

  const defaultAdmin: AdminUser = {
    id: adminId,
    name: 'Administrador Tropa',
    email: 'admin@tropadasorte.com.br',
    passwordHash: bcrypt.hashSync('michael001234', 10),
    role: 'OWNER',
    isActive: true,
    lastLoginAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  const defaultRaffle: Raffle = {
    id: raffleId,
    name: 'Honda CG 160 0KM',
    slug: 'honda-cg-160',
    descriptionShort: 'Leve para casa a moto mais querida do Brasil 0km com documentação e tanque cheio!',
    descriptionFull: 'Ação numerada Tropa da Sorte. Sorteio com apuração baseada na extração da Loteria Federal. A moto será entregue emplacada e com frete pago para todo o Brasil.',
    prizeName: 'Honda CG 160 Titan 0KM',
    prizeValueInCents: 2150000, // R$ 21.500,00
    bannerDesktopUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1200&q=80',
    bannerMobileUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80',
    totalNumbers: 1000,
    firstNumber: 0,
    lastNumber: 999,
    numberDigits: 4,
    pricePerNumberInCents: 500, // R$ 5,00
    minNumbersPerOrder: 1,
    maxNumbersPerOrder: 100,
    reservationMinutes: 15,
    allowManualChoice: true,
    allowRandomChoice: true,
    showSoldNumbers: true,
    showReservedNumbers: true,
    showPartialCustomerName: true,
    drawMethod: 'loteria_federal',
    drawReference: '1º Prêmio da Loteria Federal',
    drawDate: null,
    winningNumber: null,
    drawEvidenceUrl: null,
    status: 'active',
    startsAt: new Date().toISOString(),
    endsAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Gerar 1000 números
  const numbers: RaffleNumber[] = [];
  const sampleCustomer: Customer = {
    id: 'c1e2a3b4-5678-90ab-cdef-1234567890ab',
    name: 'Carlos Oliveira',
    email: 'carlos@email.com',
    phone: '11987654321',
    cpfMasked: '***.456.789-**',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  for (let i = 0; i < 1000; i++) {
    const formatted = i.toString().padStart(4, '0');
    // Definir alguns números já pagos e reservados para o seed inicial
    if (i === 7 || i === 23 || i === 42 || i === 128 || i === 777) {
      numbers.push({
        id: `num-${raffleId}-${i}`,
        raffleId,
        number: i,
        formattedNumber: formatted,
        status: 'paid',
        customerId: sampleCustomer.id,
        customerName: 'Carlos Oliveira',
        orderId: 'ord-seed-paid-1',
        paidAt: new Date().toISOString(),
      });
    } else if (i === 15 || i === 88) {
      numbers.push({
        id: `num-${raffleId}-${i}`,
        raffleId,
        number: i,
        formattedNumber: formatted,
        status: 'reserved_manual',
        customerId: sampleCustomer.id,
        customerName: 'Carlos Oliveira',
        reservedAt: new Date().toISOString(),
      });
    } else {
      numbers.push({
        id: `num-${raffleId}-${i}`,
        raffleId,
        number: i,
        formattedNumber: formatted,
        status: 'available',
      });
    }
  }

  const sampleOrder: Order = {
    id: 'ord-seed-paid-1',
    publicId: 'SRT-K7P2F9',
    raffleId,
    customerId: sampleCustomer.id,
    customer: sampleCustomer,
    quantity: 5,
    subtotalInCents: 2500,
    discountInCents: 0,
    totalAmountInCents: 2500,
    status: 'paid',
    paymentMethod: 'pix',
    reservationToken: 'res-seed-token-1',
    expiresAt: null,
    paidAt: new Date().toISOString(),
    numbers: ['0007', '0023', '0042', '0128', '0777'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const sampleReceipt: Receipt = {
    id: 'rcpt-seed-1',
    verificationCode: 'RCPT-F8K2-X7P9',
    orderId: sampleOrder.id,
    customerId: sampleCustomer.id,
    raffleId,
    orderPublicId: sampleOrder.publicId,
    customerName: sampleCustomer.name,
    customerPhoneMasked: '(11) 9****-4321',
    raffleName: defaultRaffle.name,
    numbers: sampleOrder.numbers,
    totalAmountInCents: sampleOrder.totalAmountInCents,
    paymentMethod: 'pix',
    issuedAt: new Date().toISOString(),
  };

  return {
    admins: [defaultAdmin],
    raffles: [defaultRaffle],
    raffleNumbers: numbers,
    customers: [sampleCustomer],
    orders: [sampleOrder],
    payments: [],
    receipts: [sampleReceipt],
    auditLogs: [
      {
        id: 'log-seed-1',
        actorId: adminId,
        actorRole: 'OWNER',
        action: 'system_initialized',
        entityType: 'system',
        entityId: 'initial_seed',
        oldValue: null,
        newValue: { note: 'Seed com sorteio Honda CG 160 e 1.000 números inicializado' },
        reason: 'Ambiente pronto para desenvolvimento e testes',
        ipAddress: '127.0.0.1',
        userAgent: 'SeedRunner/1.0',
        createdAt: new Date().toISOString(),
      },
    ],
    webhookEvents: [],
  };
}

import { fetchStateFromSupabase, syncStateToSupabase } from './supabaseAdapter';

export class Database {
  private static cachedState: DatabaseState | null = null;
  private static lastSyncTime = 0;
  private static readonly CACHE_TTL_MS = 30_000; // 30 segundos

  private static async loadStateAsync(): Promise<DatabaseState> {
    const now = Date.now();
    if (this.cachedState && now - this.lastSyncTime < this.CACHE_TTL_MS) {
      return this.cachedState;
    }

    // 1. Tentar buscar do Supabase se configurado
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
      try {
        const remoteState = await fetchStateFromSupabase();
        if (remoteState && remoteState.raffles.length > 0) {
          this.cachedState = remoteState;
          this.lastSyncTime = now;
          return this.cachedState;
        }
      } catch (err) {
        console.warn('Erro ao carregar do Supabase, usando fallback local:', err);
      }
    }

    // 2. Se já temos cache em memória, manter
    if (this.cachedState) {
      return this.cachedState;
    }

    // 3. Tentar ler do arquivo local (se acessível)
    if (fs.existsSync(DB_FILE_PATH)) {
      try {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        this.cachedState = JSON.parse(raw) as DatabaseState;
        this.lastSyncTime = now;
        return this.cachedState;
      } catch (err) {
        console.error('Erro ao ler DB_FILE_PATH, reinicializando estado:', err);
      }
    }

    // 4. Estado inicial de fallback
    const initial = getInitialState();
    this.cachedState = initial;
    this.lastSyncTime = now;

    // Tentar persistir no disco de forma segura (sem quebrar em ambiente read-only / serverless)
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(initial, null, 2), 'utf-8');
    } catch {
      // Ignora erro EROFS em ambiente serverless (Netlify / Lambda)
    }

    return initial;
  }

  private static async saveStateAsync(state: DatabaseState): Promise<void> {
    this.cachedState = state;
    this.lastSyncTime = Date.now();

    // 1. Salvar no arquivo local se o sistema permitir
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(state, null, 2), 'utf-8');
    } catch {
      // Ambiente serverless somente leitura
    }

    // 2. Sincronizar assincronamente com o Supabase se disponível
    syncStateToSupabase(state).catch((err) => {
      console.error('Erro na sincronização em background com Supabase:', err);
    });
  }

  // Executa uma transação com bloqueio atômico absoluto
  static async transaction<T>(callback: (state: DatabaseState) => Promise<T>): Promise<T> {
    const release = await dbMutex.acquire();
    try {
      const state = await this.loadStateAsync();
      const result = await callback(state);
      await this.saveStateAsync(state);
      return result;
    } finally {
      release();
    }
  }

  static async getState(): Promise<DatabaseState> {
    const release = await dbMutex.acquire();
    try {
      return await this.loadStateAsync();
    } finally {
      release();
    }
  }

  // Reset do banco para testes automatizados
  static async reset(): Promise<void> {
    const release = await dbMutex.acquire();
    try {
      const initial = getInitialState();
      this.cachedState = initial;
      this.lastSyncTime = Date.now();
      try {
        fs.writeFileSync(DB_FILE_PATH, JSON.stringify(initial, null, 2), 'utf-8');
      } catch {
        // Ignora EROFS
      }
    } finally {
      release();
    }
  }
}

