'use client';

import React, { useState } from 'react';
import { Ticket, Search, ArrowRight, Sparkles } from 'lucide-react';
import { MyNumbersModal } from './MyNumbersModal';

interface MyNumbersButtonProps {
  raffleId?: string;
  raffleSlug?: string;
  variant?: 'header' | 'banner' | 'card' | 'inline';
  className?: string;
}

export const MyNumbersButton: React.FC<MyNumbersButtonProps> = ({
  raffleId,
  raffleSlug,
  variant = 'header',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {variant === 'header' && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`py-1.5 px-3 rounded-lg bg-[#181B1F] border border-[#FFC928]/40 hover:border-[#FFC928] text-xs font-black text-[#FFC928] flex items-center gap-1.5 transition-all shadow-sm active:scale-95 ${className}`}
          title="Verificar meus números comprados"
        >
          <Ticket className="w-3.5 h-3.5" />
          <span>Meus Números</span>
        </button>
      )}

      {variant === 'banner' && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`w-full p-3.5 rounded-2xl bg-[#181B1F] border border-[#262A30] hover:border-[#16C784] transition-all flex items-center justify-between group text-left shadow-lg active:scale-[0.99] ${className}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#16C784]/15 border border-[#16C784]/30 flex items-center justify-center text-[#16C784] group-hover:scale-105 transition-transform">
              <Search className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black text-white flex items-center gap-1">
                <span>Verificar Meus Números</span>
                <Sparkles className="w-3 h-3 text-[#FFC928]" />
              </span>
              <span className="text-[11px] text-gray-400">
                Já participou? Consulte suas cotas pelo seu telefone
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs font-bold text-[#16C784] group-hover:translate-x-1 transition-transform">
            <span className="hidden sm:inline">Consultar</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </button>
      )}

      {variant === 'card' && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`w-full p-4 rounded-2xl bg-gradient-to-r from-[#181B1F] to-[#141619] border border-[#FFC928]/30 hover:border-[#FFC928] transition-all flex items-center justify-between group text-left shadow-md ${className}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFC928]/15 border border-[#FFC928]/30 flex items-center justify-center text-[#FFC928]">
              <Ticket className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-white group-hover:text-[#FFC928] transition-colors">
                Buscar Meus Números Comprados
              </span>
              <span className="text-xs text-gray-400">
                Acesse seus bilhetes, pedidos e comprovantes pelo número de telefone
              </span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#FFC928] group-hover:translate-x-1 transition-all" />
        </button>
      )}

      {variant === 'inline' && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`inline-flex items-center gap-1.5 text-xs font-bold text-[#16C784] hover:underline cursor-pointer ${className}`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Verificar meus números</span>
        </button>
      )}

      <MyNumbersModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        raffleId={raffleId}
        raffleSlug={raffleSlug}
      />
    </>
  );
};
