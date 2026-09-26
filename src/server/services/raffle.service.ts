import { Database } from '@/server/db';
import { CreateRaffleInput, Raffle, RaffleNumber, RaffleStatus, UpdateRaffleRulesInput } from '@/types';
import { formatNumberWithDigits } from '@/lib/utils';
import { randomUUID } from 'crypto';

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

      const raffleId = randomUUID();
      const now = new Date().toISOString();

      const newRaffle: Raffle = {
        id: raffleId,
        name: input.name,
        slug: input.slug,
        descriptionShort: input.descriptionShort || null,
        descriptionFull: input.descriptionFull || null,
        prizeName: input.prizeName,
        prizeValueInCents: input.prizeValueInCents || 0,
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
          id: randomUUID(),
          raffleId: raffleId,
          number: num,
          formattedNumber: formatNumberWithDigits(num, input.numberDigits),
          status: 'available',
        });
      }

      db.raffleNumbers.push(...generatedNumbers);

      // 3. Registrar no log de auditoria
      db.auditLogs.unshift({
        id: randomUUID(),
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
        id: randomUUID(),
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

  static async deleteRaffle(id: string, actorId: string, actorRole: string): Promise<boolean> {
    return await Database.transaction(async (db) => {
      const index = db.raffles.findIndex((r) => r.id === id);
      if (index === -1) {
        throw new Error('Sorteio não encontrado.');
      }

      const deleted = db.raffles[index];
      db.raffles.splice(index, 1);

      // Remover números do sorteio
      db.raffleNumbers = db.raffleNumbers.filter((n) => n.raffleId !== id);

      // Remover pedidos e comprovantes relacionados
      db.orders = db.orders.filter((o) => o.raffleId !== id);
      db.receipts = db.receipts.filter((rc) => rc.raffleId !== id);

      // Registrar auditoria
      db.auditLogs.unshift({
        id: randomUUID(),
        actorId,
        actorRole,
        action: 'raffle_deleted',
        entityType: 'raffle',
        entityId: id,
        oldValue: { name: deleted.name, slug: deleted.slug },
        newValue: null,
        reason: 'Exclusão definitiva de sorteio pelo painel administrativo',
        ipAddress: '127.0.0.1',
        userAgent: 'AdminPanel',
        createdAt: new Date().toISOString(),
      });

      return true;
    });
  }

  static async updateRaffleRules(
    id: string,
    input: UpdateRaffleRulesInput,
    actorId: string,
    actorRole: string
  ): Promise<Raffle> {
    return await Database.transaction(async (db) => {
      const raffle = db.raffles.find((r) => r.id === id);
      if (!raffle) {
        throw new Error('Sorteio não encontrado.');
      }

      const oldValue = {
        name: raffle.name,
        descriptionShort: raffle.descriptionShort,
        descriptionFull: raffle.descriptionFull,
        prizeName: raffle.prizeName,
        prizeValueInCents: raffle.prizeValueInCents,
        bannerDesktopUrl: raffle.bannerDesktopUrl,
        bannerMobileUrl: raffle.bannerMobileUrl,
        minNumbersPerOrder: raffle.minNumbersPerOrder,
        maxNumbersPerOrder: raffle.maxNumbersPerOrder,
        reservationMinutes: raffle.reservationMinutes,
        allowManualChoice: raffle.allowManualChoice,
        allowRandomChoice: raffle.allowRandomChoice,
        showSoldNumbers: raffle.showSoldNumbers,
        showReservedNumbers: raffle.showReservedNumbers,
        showPartialCustomerName: raffle.showPartialCustomerName,
        drawMethod: raffle.drawMethod,
        drawReference: raffle.drawReference,
        drawDate: raffle.drawDate,
        status: raffle.status,
      };

      if (input.name !== undefined) raffle.name = input.name;
      if (input.descriptionShort !== undefined) raffle.descriptionShort = input.descriptionShort;
      if (input.descriptionFull !== undefined) raffle.descriptionFull = input.descriptionFull;
      if (input.prizeName !== undefined) raffle.prizeName = input.prizeName;
      if (input.prizeValueInCents !== undefined) raffle.prizeValueInCents = input.prizeValueInCents;
      if (input.bannerDesktopUrl !== undefined) raffle.bannerDesktopUrl = input.bannerDesktopUrl;
      if (input.bannerMobileUrl !== undefined) raffle.bannerMobileUrl = input.bannerMobileUrl;
      if (input.minNumbersPerOrder !== undefined) raffle.minNumbersPerOrder = input.minNumbersPerOrder;
      if (input.maxNumbersPerOrder !== undefined) raffle.maxNumbersPerOrder = input.maxNumbersPerOrder;
      if (input.reservationMinutes !== undefined) raffle.reservationMinutes = input.reservationMinutes;
      if (input.allowManualChoice !== undefined) raffle.allowManualChoice = input.allowManualChoice;
      if (input.allowRandomChoice !== undefined) raffle.allowRandomChoice = input.allowRandomChoice;
      if (input.showSoldNumbers !== undefined) raffle.showSoldNumbers = input.showSoldNumbers;
      if (input.showReservedNumbers !== undefined) raffle.showReservedNumbers = input.showReservedNumbers;
      if (input.showPartialCustomerName !== undefined) raffle.showPartialCustomerName = input.showPartialCustomerName;
      if (input.drawMethod !== undefined) raffle.drawMethod = input.drawMethod;
      if (input.drawReference !== undefined) raffle.drawReference = input.drawReference;
      if (input.drawDate !== undefined) raffle.drawDate = input.drawDate;
      if (input.status !== undefined) raffle.status = input.status;

      raffle.updatedAt = new Date().toISOString();

      // Registro de Auditoria
      db.auditLogs.unshift({
        id: randomUUID(),
        actorId,
        actorRole,
        action: 'raffle_rules_updated',
        entityType: 'raffle',
        entityId: id,
        oldValue,
        newValue: input,
        reason: 'Edição das regras da ação pelo painel administrativo',
        ipAddress: '127.0.0.1',
        userAgent: 'AdminRulesEditor',
        createdAt: new Date().toISOString(),
      });

      return raffle;
    });
  }
}

