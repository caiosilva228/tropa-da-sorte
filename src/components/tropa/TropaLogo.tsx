import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface TropaLogoProps {
  compact?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const TropaLogo: React.FC<TropaLogoProps> = ({ compact = false, className = '', size = 'md' }) => {
  const iconDimensions = size === 'sm' ? 32 : size === 'lg' ? 48 : 40;

  return (
    <Link href="/" className={`inline-flex items-center gap-2.5 transition-transform hover:scale-[1.02] ${className}`}>
      {/* Símbolo Oficial da Tropa da Sorte: Trevo Dourado Real com Fundo Transparente */}
      <div
        className="relative flex items-center justify-center flex-shrink-0"
        style={{ width: iconDimensions, height: iconDimensions }}
      >
        <Image
          src="/brand/tropa-symbol.webp"
          alt="Tropa da Sorte"
          width={iconDimensions}
          height={iconDimensions}
          priority
          className="object-contain drop-shadow-[0_2px_10px_rgba(22,199,132,0.35)]"
        />
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
