import React from 'react';
import Link from 'next/link';

interface TropaLogoProps {
  compact?: boolean;
  className?: string;
}

export const TropaLogo: React.FC<TropaLogoProps> = ({ compact = false, className = '' }) => {
  return (
    <Link href="/" className={`inline-flex items-center gap-2.5 transition-transform hover:scale-[1.02] ${className}`}>
      {/* Ícone TS com Trevo e Raio estilizado */}
      <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#16C784] to-[#0E8A5A] text-[#101214] font-black text-xl shadow-lg shadow-[#16C784]/20 border border-[#16C784]/40">
        <span className="tracking-tighter">TS</span>
        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#FFC928] rounded-full border-2 border-[#101214] flex items-center justify-center text-[8px] font-bold">
          ⚡
        </div>
      </div>

      {!compact && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1 font-black text-xl tracking-tight leading-none text-white">
            <span>TROPA</span>
            <span className="text-[#16C784]">DA SORTE</span>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#FFC928]">
            Ações Oficiais 🍀
          </span>
        </div>
      )}
    </Link>
  );
};
