import React from 'react';
import { Database } from '@/server/db';
import { NumberMapGrid } from '@/components/admin/NumberMapGrid';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Hash } from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminNumerosMapPage({ params }: Props) {
  const { id } = await params;
  const state = await Database.getState();

  const raffle = state.raffles.find((r) => r.id === id);
  if (!raffle) {
    notFound();
  }

  const numbers = state.raffleNumbers.filter((n) => n.raffleId === raffle.id);
  const orders = state.orders.filter((o) => o.raffleId === raffle.id);

  return (
    <div className="w-full flex flex-col gap-6 max-w-6xl mx-auto">
      {/* Topo com Navegação de Retorno */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#262A30]">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase">
            <Link href="/admin" className="hover:text-white">Admin</Link>
            <span>/</span>
            <Link href={`/admin/sorteios/${raffle.id}`} className="hover:text-white">{raffle.name}</Link>
            <span>/</span>
            <span className="text-[#16C784]">Mapa de Números</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            <Hash className="w-6 h-6 text-[#16C784]" />
            <span>Mapa Visual das Bolas — {raffle.name}</span>
          </h1>
        </div>

        <Link
          href={`/admin/sorteios/${raffle.id}`}
          className="py-2 px-3.5 rounded-xl border border-[#262A30] hover:border-gray-500 text-xs font-bold text-gray-300 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar para Pasta</span>
        </Link>
      </div>

      {/* Componente Interativo do Mapa de Números */}
      <NumberMapGrid
        raffleId={raffle.id}
        numbers={numbers}
        orders={orders}
      />
    </div>
  );
}
