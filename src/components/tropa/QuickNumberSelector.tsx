import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

interface QuickNumberSelectorProps {
  onSelectRandom: (count: number) => Promise<void>;
  disabled?: boolean;
}

export const QuickNumberSelector: React.FC<QuickNumberSelectorProps> = ({
  onSelectRandom,
  disabled = false,
}) => {
  const [loadingCount, setLoadingCount] = useState<number | null>(null);

  const handleQuickAdd = async (count: number) => {
    try {
      setLoadingCount(count);
      await onSelectRandom(count);
    } finally {
      setLoadingCount(null);
    }
  };

  const quickOptions = [5, 10, 20, 50];

  return (
    <div className="w-full flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase font-black text-gray-400 tracking-wider">
          Seleção Rápida
        </span>
        <span className="text-[11px] text-[#16C784] font-bold">
          Mais chances de vencer 🍀
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {quickOptions.map((qty) => (
          <button
            key={qty}
            type="button"
            disabled={disabled || loadingCount !== null}
            onClick={() => handleQuickAdd(qty)}
            className="flex items-center justify-center py-2.5 px-3 rounded-xl bg-[#181B1F] border border-[#262A30] hover:border-[#16C784] hover:bg-[#16C784]/10 active:scale-95 transition-all text-sm font-black text-white cursor-pointer disabled:opacity-50"
          >
            {loadingCount === qty ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#16C784]" />
            ) : (
              <span>+{qty}</span>
            )}
          </button>
        ))}
      </div>

      {/* Botão Especial "Escolher para mim" */}
      <button
        type="button"
        disabled={disabled || loadingCount !== null}
        onClick={() => handleQuickAdd(5)}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#181B1F] via-[#20252b] to-[#181B1F] border border-[#FFC928]/40 hover:border-[#FFC928] text-sm font-bold text-[#FFC928] shadow-md transition-all active:scale-[0.98] cursor-pointer"
      >
        <Sparkles className="w-4 h-4 text-[#FFC928]" />
        <span>🍀 Escolher números pra mim (+5)</span>
      </button>
    </div>
  );
};
