'use client';

import React, { useState } from 'react';
import { Raffle } from '@/types';
import { SlidersHorizontal, Settings2, ArrowRight } from 'lucide-react';
import { EditRaffleRulesModal } from './EditRaffleRulesModal';

interface EditRaffleRulesButtonProps {
  raffle: Raffle;
  variant?: 'header' | 'card';
  className?: string;
}

export const EditRaffleRulesButton: React.FC<EditRaffleRulesButtonProps> = ({
  raffle,
  variant = 'header',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {variant === 'header' ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`py-2.5 px-4 rounded-xl border border-[#FFC928]/40 hover:border-[#FFC928] bg-[#FFC928]/10 hover:bg-[#FFC928]/20 text-[#FFC928] font-black text-xs flex items-center gap-1.5 transition-all shadow-sm ${className}`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>EDITAR REGRAS</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`p-5 rounded-2xl bg-[#181B1F] border border-[#262A30] hover:border-[#FFC928] transition-all flex items-center justify-between group text-left w-full ${className}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFC928]/15 border border-[#FFC928]/30 flex items-center justify-center text-[#FFC928]">
              <Settings2 className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-white group-hover:text-[#FFC928] transition-colors">
                Editar Regras da Ação
              </span>
              <span className="text-xs text-gray-400">
                Reserva ({raffle.reservationMinutes}m), limites ({raffle.minNumbersPerOrder}-{raffle.maxNumbersPerOrder} cotas), visibilidade e termos
              </span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#FFC928] transition-colors" />
        </button>
      )}

      <EditRaffleRulesModal
        raffle={raffle}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
};
