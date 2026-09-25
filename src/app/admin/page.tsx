'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Raffle } from '@/types';
import { formatCentsToBRL } from '@/lib/formatters';
import { CreateRaffleWizard } from '@/components/admin/CreateRaffleWizard';
import Link from 'next/link';
import { Plus, FolderKanban, Users, ShoppingCart, DollarSign, TrendingUp, ExternalLink, Sparkles, Loader2 } from 'lucide-react';

export default function AdminDashboardPage() {
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const fetchRaffles = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/raffles');
      if (res.ok) {
        const data = await res.json();
        setRaffles(data.raffles || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRaffles();
  }, [fetchRaffles]);

  // Cálculos consolidados
  const totalRaffles = raffles.length;
  const activeRaffles = raffles.filter((r) => r.status === 'active').length;
  const totalPotentialRevenue = raffles.reduce(
    (acc, r) => acc + r.totalNumbers * r.pricePerNumberInCents,
    0
  );

  return (
    <div className="w-full flex flex-col gap-6 max-w-6xl mx-auto">
      {/* Topbar com Título e Botão de Destaque */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#262A30]">
        <div className="flex flex-col">
          <span className="text-xs uppercase font-bold text-[#16C784]">Tropa da Sorte</span>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
            Painel Geral
          </h1>
        </div>

        <button
          type="button"
          onClick={() => setIsWizardOpen(true)}
          className="py-3 px-5 rounded-xl bg-[#16C784] hover:bg-[#12A66D] active:scale-[0.98] text-[#101214] font-black text-sm tracking-wide shadow-lg shadow-[#16C784]/20 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-5 h-5 stroke-[3]" />
          <span>CRIAR NOVA AÇÃO</span>
        </button>
      </div>

      {/* Cards de Métricas Gerais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[#181B1F] border border-[#262A30] flex flex-col gap-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase">Ações Criadas</span>
            <FolderKanban className="w-4 h-4 text-[#FFC928]" />
          </div>
          <span className="text-2xl font-black text-white">{totalRaffles}</span>
          <span className="text-[11px] text-gray-400">{activeRaffles} ativa(s) no momento</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#181B1F] border border-[#262A30] flex flex-col gap-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase">Potencial Total</span>
            <DollarSign className="w-4 h-4 text-[#16C784]" />
          </div>
          <span className="text-2xl font-black text-[#16C784]">
            {formatCentsToBRL(totalPotentialRevenue)}
          </span>
          <span className="text-[11px] text-gray-400">Faturamento projetado</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#181B1F] border border-[#262A30] flex flex-col gap-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase">Sorteios Ativos</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <span className="text-2xl font-black text-white">{activeRaffles}</span>
          <span className="text-[11px] text-gray-400">Abertos para compra</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#181B1F] border border-[#262A30] flex flex-col gap-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase">Operação</span>
            <Sparkles className="w-4 h-4 text-[#FFC928]" />
          </div>
          <span className="text-2xl font-black text-white">Online</span>
          <span className="text-[11px] text-[#16C784] font-bold">100% Funcional</span>
        </div>
      </div>

      {/* Lista de Sorteios / Pastas Independentes */}
      <div className="flex flex-col gap-4 pt-2">
        <h2 className="text-lg font-black text-white uppercase flex items-center gap-2">
          <FolderKanban className="w-5 h-5 text-[#FFC928]" />
          <span>Pastas de Sorteios</span>
        </h2>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-[#16C784]" />
            <span className="text-xs text-gray-400">Carregando ações...</span>
          </div>
        ) : raffles.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#181B1F] border border-[#262A30] flex flex-col items-center text-center gap-3">
            <FolderKanban className="w-12 h-12 text-gray-600" />
            <h3 className="text-base font-bold text-white">Você ainda não criou nenhum sorteio.</h3>
            <p className="text-xs text-gray-400 max-w-sm">
              Crie sua primeira ação e comece a disponibilizar números para a Tropa da Sorte.
            </p>
            <button
              type="button"
              onClick={() => setIsWizardOpen(true)}
              className="py-2.5 px-5 rounded-xl bg-[#16C784] text-[#101214] font-black text-xs cursor-pointer"
            >
              + Criar Primeira Ação
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {raffles.map((raffle) => (
              <div
                key={raffle.id}
                className="bg-[#181B1F] border border-[#262A30] rounded-2xl p-5 flex flex-col gap-4 shadow-xl hover:border-[#16C784]/40 transition-all"
              >
                {/* Header do Card */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase text-gray-400">
                      Pasta do Sorteio
                    </span>
                    <h3 className="text-base font-black text-white line-clamp-1">
                      {raffle.name}
                    </h3>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      raffle.status === 'active'
                        ? 'bg-[#16C784]/15 border border-[#16C784]/30 text-[#16C784]'
                        : raffle.status === 'draft'
                        ? 'bg-gray-800 text-gray-300'
                        : 'bg-yellow-500/15 text-yellow-400'
                    }`}
                  >
                    {raffle.status === 'active' ? 'Ativo 🔥' : raffle.status}
                  </span>
                </div>

                {/* Métricas da Pasta */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-[#101214] border border-[#262A30] text-xs">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400">Total Bolas</span>
                    <span className="font-bold text-white">
                      {raffle.totalNumbers.toLocaleString('pt-BR')}
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400">Valor / Bola</span>
                    <span className="font-bold text-[#16C784]">
                      {formatCentsToBRL(raffle.pricePerNumberInCents)}
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400">Meta Total</span>
                    <span className="font-bold text-[#FFC928]">
                      {formatCentsToBRL(raffle.totalNumbers * raffle.pricePerNumberInCents)}
                    </span>
                  </div>
                </div>

                {/* Botões de Ação na Pasta */}
                <div className="flex items-center gap-2 pt-1">
                  <Link
                    href={`/admin/sorteios/${raffle.id}`}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#262A30] hover:bg-[#32363e] text-white text-xs font-bold text-center transition-colors"
                  >
                    Abrir Pasta 📁
                  </Link>

                  <Link
                    href={`/sorteio/${raffle.slug}`}
                    target="_blank"
                    className="py-2 px-3 rounded-xl border border-[#262A30] hover:border-gray-500 text-gray-300 hover:text-white text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Página Pública</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Wizard de Criação */}
      <CreateRaffleWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onRaffleCreated={fetchRaffles}
      />
    </div>
  );
}
