import React from 'react';

interface RaffleProgressProps {
  totalNumbers: number;
  paidNumbers: number;
  percentagePaid: number;
  reservedNumbers?: number;
}

export const RaffleProgress: React.FC<RaffleProgressProps> = ({
  totalNumbers,
  paidNumbers,
  percentagePaid,
  reservedNumbers = 0,
}) => {
  const remainingNumbers = Math.max(0, totalNumbers - paidNumbers - reservedNumbers);

  return (
    <div className="w-full bg-[#181B1F] border border-[#262A30] rounded-2xl p-4 flex flex-col gap-2.5 shadow-lg">
      <div className="flex items-center justify-between">
        <span className="text-sm font-black uppercase text-white flex items-center gap-1.5">
          <span>A TROPA TÁ FECHANDO!</span>
          <span className="text-base">🔥</span>
        </span>
        <span className="text-xs font-black text-[#16C784] bg-[#16C784]/10 border border-[#16C784]/30 px-2.5 py-0.5 rounded-full">
          {percentagePaid.toFixed(1)}% garantido
        </span>
      </div>

      {/* Barra de Progresso com Gradiente Verde/Dourado */}
      <div className="relative w-full h-3.5 bg-[#101214] rounded-full overflow-hidden border border-[#262A30] p-0.5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#16C784] via-[#20df96] to-[#FFC928] transition-all duration-500 shadow-sm"
          style={{ width: `${Math.min(100, Math.max(2, percentagePaid))}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400 font-medium pt-0.5">
        <span>
          <strong className="text-white font-bold">{paidNumbers}</strong> de {totalNumbers} números
        </span>
        <span>
          Faltam apenas <strong className="text-[#FFC928] font-bold">{remainingNumbers}</strong>
        </span>
      </div>
    </div>
  );
};
