import React from 'react';
import { Database } from '@/server/db';
import { formatCentsToBRL } from '@/lib/formatters';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FolderKanban, Hash, ExternalLink, ArrowRight, CheckCircle2, Clock, DollarSign, Layers } from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SorteioDetailPage({ params }: Props) {
  const { id } = await params;
  const state = await Database.getState();

  const raffle = state.raffles.find((r) => r.id === id);
  if (!raffle) {
    notFound();
  }

  const numbers = state.raffleNumbers.filter((n) => n.raffleId === raffle.id);
  const totalNumbers = raffle.totalNumbers;
  const paidNumbers = numbers.filter((n) => n.status === 'paid').length;
  const reservedNumbers = numbers.filter((n) => n.status === 'pending_payment' || n.status === 'reserved_manual').length;
  const availableNumbers = numbers.filter((n) => n.status === 'available').length;
  const faturamentoInCents = paidNumbers * raffle.pricePerNumberInCents;
  const percentage = totalNumbers > 0 ? ((paidNumbers / totalNumbers) * 100).toFixed(1) : '0';
  const remaining = Math.max(0, totalNumbers - paidNumbers - reservedNumbers);

  return (
    <div className="w-full flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Header da Pasta */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#262A30]">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase">
            <Link href="/admin" className="hover:text-white">Admin</Link>
            <span>/</span>
            <span className="text-[#16C784]">Pasta do Sorteio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            <FolderKanban className="w-7 h-7 text-[#FFC928]" />
            <span>{raffle.name}</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/admin/sorteios/${raffle.id}/numeros`}
            className="py-2.5 px-4 rounded-xl bg-[#16C784] hover:bg-[#12A66D] text-[#101214] font-black text-xs flex items-center gap-1.5 shadow-md shadow-[#16C784]/20"
          >
            <Hash className="w-4 h-4" />
            <span>MAPA DE NÚMEROS</span>
          </Link>

          <Link
            href={`/sorteio/${raffle.slug}`}
            target="_blank"
            className="py-2.5 px-4 rounded-xl border border-[#262A30] hover:border-gray-500 text-gray-300 hover:text-white font-bold text-xs flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Página Pública</span>
          </Link>
        </div>
      </div>

      {/* Grid de Cards de Métricas Específicas do Sorteio */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[#181B1F] border border-[#262A30] flex flex-col gap-1">
          <span className="text-xs font-bold text-gray-400 uppercase">Total de Bolas</span>
          <span className="text-2xl font-black text-white">{totalNumbers.toLocaleString('pt-BR')}</span>
          <span className="text-[11px] text-gray-500">100% configuradas</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#181B1F] border border-[#262A30] flex flex-col gap-1">
          <span className="text-xs font-bold text-gray-400 uppercase">Bolas Pagas</span>
          <span className="text-2xl font-black text-[#16C784] flex items-center gap-1">
            <CheckCircle2 className="w-5 h-5 text-[#16C784]" />
            <span>{paidNumbers}</span>
          </span>
          <span className="text-[11px] text-[#16C784] font-bold">{percentage}% da meta</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#181B1F] border border-[#262A30] flex flex-col gap-1">
          <span className="text-xs font-bold text-gray-400 uppercase">Reservadas</span>
          <span className="text-2xl font-black text-[#FFC928] flex items-center gap-1">
            <Clock className="w-5 h-5 text-[#FFC928]" />
            <span>{reservedNumbers}</span>
          </span>
          <span className="text-[11px] text-gray-500">Aguardando pagamento</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#181B1F] border border-[#262A30] flex flex-col gap-1">
          <span className="text-xs font-bold text-gray-400 uppercase">Disponíveis</span>
          <span className="text-2xl font-black text-white">{availableNumbers}</span>
          <span className="text-[11px] text-gray-500">Prontas para venda</span>
        </div>
      </div>

      {/* Card Grande de Faturamento e Meta */}
      <div className="w-full bg-[#181B1F] border border-[#262A30] rounded-2xl p-6 flex flex-col gap-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase text-gray-400">Faturamento Real</span>
            <span className="text-3xl font-black text-[#16C784]">
              {formatCentsToBRL(faturamentoInCents)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Meta projetada:</span>
            <span className="text-sm font-bold text-white">
              {formatCentsToBRL(totalNumbers * raffle.pricePerNumberInCents)}
            </span>
          </div>
        </div>

        {/* Barra de Progresso Real */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs font-bold text-gray-400">
            <span>Progresso da Ação: {percentage}%</span>
            <span>Faltam {remaining} números</span>
          </div>
          <div className="w-full h-3 bg-[#101214] rounded-full overflow-hidden border border-[#262A30]">
            <div
              className="h-full bg-gradient-to-r from-[#16C784] to-[#FFC928] transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(1, parseFloat(percentage)))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Acesso Rápido às Subpastas do Sorteio */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href={`/admin/sorteios/${raffle.id}/numeros`}
          className="p-5 rounded-2xl bg-[#181B1F] border border-[#262A30] hover:border-[#16C784] transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#16C784]/15 border border-[#16C784]/30 flex items-center justify-center text-[#16C784]">
              <Hash className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-white">Mapa Visual de Números</span>
              <span className="text-xs text-gray-400">Ver todas as bolas, reservas manuais e confirmações</span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
        </Link>

        <Link
          href={`/sorteio/${raffle.slug}`}
          target="_blank"
          className="p-5 rounded-2xl bg-[#181B1F] border border-[#262A30] hover:border-[#FFC928] transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFC928]/15 border border-[#FFC928]/30 flex items-center justify-center text-[#FFC928]">
              <ExternalLink className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-white">Ver Página de Venda</span>
              <span className="text-xs text-gray-400">Testar a experiência do comprador no mobile</span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
        </Link>
      </div>
    </div>
  );
}
