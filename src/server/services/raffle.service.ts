import { Database } from '@/server/db';
import { CreateRaffleInput, Raffle, RaffleNumber, RaffleStatus } from '@/types';
import { formatNumberWithDigits } from '@/lib/utils';

export class RaffleService {
  static async listRaffles(): Promise<Raffle[]> {
    const state = await Database.getState();
    return state.raffles;
  }

  static async getRaffleBySlug(slug: string): Promise<Raffle | null> {
    const state = await Database.getState();
    return state.raffles.find((r) => r.slug === slug) || null;
  }

  static async getRaffleById(id: string): Promise<Raffle | null> {
    const state = await Database.getState();
    return state.raffles.find((r) => r.id === id) || null;
  }

  static async createRaffle(input: CreateRaffleInput, actorId: string, actorRole: string): Promise<Raffle> {
    return await Database.transaction(async (db) => {
      // 1. Verificar duplicidade de slug
      const slugExists = db.raffles.some((r) => r.slug === input.slug);
      if (slugExists) {
        throw new Error(`Já existe um sorteio cadastrado com a URL /sorteio/${input.slug}`);
      }

      const raffleId = `raf-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date().toISOString();

      const newRaffle: Raffle = {
        id: raffleId,
        name: input.name,
        slug: input.slug,
        descriptionShort: input.descriptionShort || null,
        descriptionFull: input.descriptionFull || null,
        prizeName: input.prizeName,
        prizeValueInCents: input.prizeValueInCents,
        bannerDesktopUrl: input.bannerDesktopUrl || null,
        bannerMobileUrl: input.bannerMobileUrl || null,
        totalNumbers: input.totalNumbers,
        firstNumber: input.firstNumber,
        lastNumber: input.firstNumber + input.totalNumbers - 1,
        numberDigits: input.numberDigits,
        pricePerNumberInCents: input.pricePerNumberInCents,
        minNumbersPerOrder: input.minNumbersPerOrder,
        maxNumbersPerOrder: input.maxNumbersPerOrder,
        reservationMinutes: input.reservationMinutes,
        allowManualChoice: input.allowManualChoice,
        allowRandomChoice: input.allowRandomChoice,
        showSoldNumbers: input.showSoldNumbers,
        showReservedNumbers: input.showReservedNumbers,
        showPartialCustomerName: input.showPartialCustomerName,
        drawMethod: 'loteria_federal',
        drawReference: '1º Prêmio da Loteria Federal',
        drawDate: null,
        winningNumber: null,
        drawEvidenceUrl: null,
        status: 'draft',
        startsAt: null,
        endsAt: null,
        createdAt: now,
        updatedAt: now,
      };

      db.raffles.unshift(newRaffle);

      // 2. Gerar fisicamente todos os números atrelados ao sorteio
      const generatedNumbers: RaffleNumber[] = [];
      const endNumber = input.firstNumber + input.totalNumbers;

      for (let num = input.firstNumber; num < endNumber; num++) {
        generatedNumbers.push({
          id: `num-${raffleId}-${num}`,
          raffleId: raffleId,
          number: num,
          formattedNumber: formatNumberWithDigits(num, input.numberDigits),
          status: 'available',
        });
      }

      db.raffleNumbers.push(...generatedNumbers);

      // 3. Registrar no log de auditoria
      db.auditLogs.unshift({
        id: `log-${Date.now()}`,
        actorId,
        actorRole,
        action: 'raffle_created',
        entityType: 'raffle',
        entityId: raffleId,
        oldValue: null,
        newValue: {
          name: newRaffle.name,
          slug: newRaffle.slug,
          totalNumbers: newRaffle.totalNumbers,
          pricePerNumberInCents: newRaffle.pricePerNumberInCents,
        },
        reason: 'Criação de nova ação no painel administrativo',
        ipAddress: '127.0.0.1',
        userAgent: 'AdminWizard',
        createdAt: now,
      });

      return newRaffle;
    });
  }

  static async updateRaffleStatus(id: string, newStatus: RaffleStatus, actorId: string, actorRole: string): Promise<Raffle> {
    return await Database.transaction(async (db) => {
      const raffle = db.raffles.find((r) => r.id === id);
      if (!raffle) {
        throw new Error('Sorteio não encontrado.');
      }

      const oldStatus = raffle.status;
      raffle.status = newStatus;
      raffle.updatedAt = new Date().toISOString();

      if (newStatus === 'active' && !raffle.startsAt) {
        raffle.startsAt = new Date().toISOString();
      }

      db.auditLogs.unshift({
        id: `log-${Date.now()}`,
        actorId,
        actorRole,
        action: 'raffle_status_changed',
        entityType: 'raffle',
        entityId: id,
        oldValue: { status: oldStatus },
        newValue: { status: newStatus },
        reason: `Status alterado de ${oldStatus} para ${newStatus}`,
        ipAddress: '127.0.0.1',
        userAgent: 'AdminPanel',
        createdAt: new Date().toISOString(),
      });

      return raffle;
    });
  }
}
