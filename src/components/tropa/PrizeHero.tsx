import React from 'react';
import { formatCentsToBRL } from '@/lib/formatters';
import { Raffle } from '@/types';
import { ShieldCheck, Zap, Award, Sparkles } from 'lucide-react';

interface PrizeHeroProps {
  raffle: Raffle;
}

export const PrizeHero: React.FC<PrizeHeroProps> = ({ raffle }) => {
  return (
    <div className="w-full flex flex-col gap-4">
      {/* Banner Principal com Overlay Escuro e Borda Verde */}
      <div className="relative w-full aspect-[16/9] md:aspect-[21/9] rounded-2xl overflow-hidden border border-[#262A30] bg-[#181B1F] shadow-2xl shadow-black/60">
        {raffle.bannerDesktopUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={raffle.bannerDesktopUrl}
            alt={raffle.prizeName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#181B1F] to-[#101214] text-center p-6">
            <Sparkles className="w-12 h-12 text-[#FFC928] mb-2" />
            <span className="text-xl font-bold text-white">{raffle.prizeName}</span>
          </div>
        )}

        {/* Tag Flutuante do Prêmio da Vez */}
        <div className="absolute top-3 left-3 bg-[#101214]/90 backdrop-blur-md border border-[#FFC928]/40 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
          <span className="text-xs font-black uppercase text-[#FFC928] tracking-wider flex items-center gap-1">
            🔥 PRÊMIO DA VEZ
          </span>
        </div>

        {/* Badge Flutuante do Preço por Número */}
        <div className="absolute bottom-3 right-3 bg-[#101214]/95 backdrop-blur-md border border-[#16C784]/60 px-4 py-2 rounded-xl flex flex-col items-end shadow-xl">
          <span className="text-[10px] uppercase font-bold text-gray-400">Por apenas</span>
          <span className="text-xl font-black text-[#16C784] leading-tight">
            {formatCentsToBRL(raffle.pricePerNumberInCents)}
          </span>
        </div>
      </div>

      {/* Título do Prêmio e Descrição */}
      <div className="flex flex-col gap-2 px-1">
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase">
          {raffle.prizeName}
        </h1>
        {raffle.descriptionShort && (
          <p className="text-sm text-gray-300 leading-relaxed">
            {raffle.descriptionShort}
          </p>
        )}
      </div>

      {/* Badges de Confiança Imediata */}
      <div className="grid grid-cols-3 gap-2 py-1">
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#181B1F] border border-[#262A30]">
          <Zap className="w-5 h-5 text-[#FFC928] shrink-0" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white leading-tight">Pix Imediato</span>
            <span className="text-[10px] text-gray-400 leading-none">Aprovou, tá valendo</span>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#181B1F] border border-[#262A30]">
          <ShieldCheck className="w-5 h-5 text-[#16C784] shrink-0" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white leading-tight">100% Seguro</span>
            <span className="text-[10px] text-gray-400 leading-none">Via Mercado Pago</span>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#181B1F] border border-[#262A30]">
          <Award className="w-5 h-5 text-[#FFC928] shrink-0" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white leading-tight">Auditado</span>
            <span className="text-[10px] text-gray-400 leading-none">Comprovante oficial</span>
          </div>
        </div>
      </div>
    </div>
  );
};
