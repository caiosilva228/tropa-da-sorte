import React, { useState, useMemo } from 'react';
import { RaffleNumber } from '@/types';
import { Search, Check, Lock, Clock } from 'lucide-react';

interface PublicNumberGridProps {
  numbers: RaffleNumber[];
  selectedNumbers: number[];
  onToggleNumber: (numberInt: number) => void;
  disabled?: boolean;
}

export const PublicNumberGrid: React.FC<PublicNumberGridProps> = ({
  numbers,
  selectedNumbers,
  onToggleNumber,
  disabled = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'selected'>('all');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 150; // Janelamento ótimo para mobile sem renderizar nós excessivos

  // Filtragem inteligente com busca por número
  const filteredNumbers = useMemo(() => {
    return numbers.filter((item) => {
      // 1. Filtro de status
      if (statusFilter === 'available' && item.status !== 'available') return false;
      if (statusFilter === 'selected' && !selectedNumbers.includes(item.number)) return false;

      // 2. Busca textual
      if (searchTerm.trim()) {
        const cleanTerm = searchTerm.trim();
        const matchesFormatted = item.formattedNumber.includes(cleanTerm);
        const matchesInt = item.number.toString().includes(cleanTerm);
        return matchesFormatted || matchesInt;
      }

      return true;
    });
  }, [numbers, statusFilter, searchTerm, selectedNumbers]);

  const totalPages = Math.ceil(filteredNumbers.length / PAGE_SIZE);
  const currentSlice = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filteredNumbers.slice(start, start + PAGE_SIZE);
  }, [filteredNumbers, page]);

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Cabeçalho da Seção de Escolha */}
      <div className="flex flex-col gap-1">
        <h2 className="text-lg md:text-xl font-black uppercase text-white flex items-center gap-2">
          <span>ESCOLHA A SORTE</span>
          <span className="text-sm">👇</span>
        </h2>
        <p className="text-xs text-gray-400">
          Toque nos números para selecionar ou use a busca abaixo:
        </p>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="flex flex-col gap-2.5">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="🔎 Procurar número (ex: 007 ou 777)"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0);
            }}
            className="w-full bg-[#181B1F] border border-[#262A30] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#16C784]"
          />
        </div>

        {/* Abas Rápidas de Filtro */}
        <div className="flex items-center gap-1.5 p-1 bg-[#181B1F] rounded-xl border border-[#262A30]">
          <button
            type="button"
            onClick={() => { setStatusFilter('all'); setPage(0); }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'all'
                ? 'bg-[#262A30] text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Todos ({numbers.length})
          </button>
          <button
            type="button"
            onClick={() => { setStatusFilter('available'); setPage(0); }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'available'
                ? 'bg-[#16C784] text-[#101214] font-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Disponíveis
          </button>
          <button
            type="button"
            onClick={() => { setStatusFilter('selected'); setPage(0); }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'selected'
                ? 'bg-[#FFC928] text-[#101214] font-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Escolhidos ({selectedNumbers.length})
          </button>
        </div>
      </div>

      {/* Legenda de Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-gray-400">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#181B1F] border border-[#262A30]" />
          Disponível
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#16C784]" />
          Selecionado
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FFC928]" />
          Reservado
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#262A30]" />
          Pago
        </span>
      </div>

      {/* Grid de Números */}
      {filteredNumbers.length === 0 ? (
        <div className="w-full py-12 text-center text-sm text-gray-400 bg-[#181B1F] rounded-2xl border border-[#262A30]">
          Nenhum número encontrado para os critérios selecionados.
        </div>
      ) : (
        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-1.5">
          {currentSlice.map((item) => {
            const isSelected = selectedNumbers.includes(item.number);
            const isAvailable = item.status === 'available';
            const isPaid = item.status === 'paid';
            const isReserved = item.status === 'pending_payment' || item.status === 'reserved_manual';

            let cellClass = 'bg-[#181B1F] text-gray-200 border-[#262A30] hover:border-[#16C784]/60 cursor-pointer active:scale-95';

            if (isSelected) {
              cellClass = 'bg-[#16C784] text-[#101214] font-black border-[#16C784] scale-[1.03] shadow-md shadow-[#16C784]/30 cursor-pointer';
            } else if (isPaid) {
              cellClass = 'bg-[#131518] text-gray-600 border-[#1f2226] opacity-60 cursor-not-allowed';
            } else if (isReserved) {
              cellClass = 'bg-[#221f14] text-[#FFC928]/70 border-[#FFC928]/30 cursor-not-allowed';
            }

            return (
              <button
                key={item.id}
                type="button"
                disabled={disabled || (!isAvailable && !isSelected)}
                onClick={() => isAvailable && onToggleNumber(item.number)}
                className={`relative aspect-square flex flex-col items-center justify-center p-1 rounded-xl border text-xs sm:text-sm font-bold transition-all ${cellClass}`}
                title={
                  isPaid
                    ? `Número ${item.formattedNumber} - PAGO`
                    : isReserved
                    ? `Número ${item.formattedNumber} - RESERVADO`
                    : `Número ${item.formattedNumber} - DISPONÍVEL`
                }
              >
                <span>{item.formattedNumber}</span>

                {isSelected && (
                  <Check className="w-2.5 h-2.5 text-[#101214] absolute top-1 right-1 stroke-[3]" />
                )}
                {isPaid && (
                  <Lock className="w-2.5 h-2.5 text-gray-600 absolute bottom-1 right-1" />
                )}
                {isReserved && !isSelected && (
                  <Clock className="w-2.5 h-2.5 text-[#FFC928]/60 absolute bottom-1 right-1" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Controles de Paginação (Janelamento de Performance) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 px-1 text-xs">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="px-3 py-1.5 rounded-lg bg-[#181B1F] border border-[#262A30] text-gray-300 disabled:opacity-40 hover:border-gray-500"
          >
            ← Faixa anterior
          </button>
          <span className="text-gray-400 font-medium">
            Página {page + 1} de {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            className="px-3 py-1.5 rounded-lg bg-[#181B1F] border border-[#262A30] text-gray-300 disabled:opacity-40 hover:border-gray-500"
          >
            Próxima faixa →
          </button>
        </div>
      )}
    </div>
  );
};
