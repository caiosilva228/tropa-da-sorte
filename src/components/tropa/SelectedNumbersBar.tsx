import React from 'react';
import { formatCentsToBRL } from '@/lib/formatters';
import { ArrowRight, Flame } from 'lucide-react';

interface SelectedNumbersBarProps {
  selectedCount: number;
  totalAmountInCents: number;
  onProceed: () => void;
  disabled?: boolean;
}

export const SelectedNumbersBar: React.FC<SelectedNumbersBarProps> = ({
  selectedCount,
  totalAmountInCents,
  onProceed,
  disabled = false,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 bg-[#101214]/95 backdrop-blur-lg border-t border-[#262A30] shadow-[0_-8px_30px_rgba(0,0,0,0.8)]">
      <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
        {/* Resumo da Seleção */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black uppercase text-[#16C784]">
              {selectedCount} {selectedCount === 1 ? 'número escolhido' : 'números escolhidos'}
            </span>
            <Flame className="w-3.5 h-3.5 text-[#FFC928]" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-[10px] text-gray-400">Total:</span>
            <span className="text-lg sm:text-xl font-black text-white tracking-tight">
              {formatCentsToBRL(totalAmountInCents)}
            </span>
          </div>
        </div>

        {/* CTA Principal de Avanço */}
        <button
          type="button"
          disabled={disabled}
          onClick={onProceed}
          className="flex items-center justify-center gap-2 py-3 px-5 sm:px-6 rounded-xl bg-[#16C784] hover:bg-[#12A66D] active:scale-[0.98] text-[#101214] font-black text-sm tracking-wide shadow-lg shadow-[#16C784]/25 transition-all cursor-pointer disabled:opacity-50"
        >
          <span>CONTINUAR</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
