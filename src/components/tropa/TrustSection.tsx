import React from 'react';
import { ShieldCheck, FileCheck, Search, MessageCircle, Lock } from 'lucide-react';
import Link from 'next/link';

export const TrustSection: React.FC = () => {
  return (
    <div className="w-full bg-[#181B1F] border border-[#262A30] rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-black text-white uppercase flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#16C784]" />
          <span>Pode ficar tranquilo.</span>
        </h3>
        <p className="text-xs text-gray-400">
          A Tropa da Sorte segue as melhores práticas de transparência e segurança do Brasil:
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#101214] border border-[#262A30]/60">
          <Lock className="w-4 h-4 text-[#16C784] shrink-0 mt-0.5" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white">Pagamento Mercado Pago</span>
            <span className="text-[11px] text-gray-400">Seu dinheiro protegido na maior fintech da América Latina.</span>
          </div>
        </div>

        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#101214] border border-[#262A30]/60">
          <FileCheck className="w-4 h-4 text-[#FFC928] shrink-0 mt-0.5" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white">Comprovante Oficial PDF</span>
            <span className="text-[11px] text-gray-400">Receba seu comprovante auditável com código único.</span>
          </div>
        </div>

        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#101214] border border-[#262A30]/60">
          <Search className="w-4 h-4 text-[#16C784] shrink-0 mt-0.5" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white">Consulta Pública</span>
            <span className="text-[11px] text-gray-400">Consulte seus números a qualquer momento com seu telefone.</span>
          </div>
        </div>

        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#101214] border border-[#262A30]/60">
          <ShieldCheck className="w-4 h-4 text-[#FFC928] shrink-0 mt-0.5" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white">Zero Venda Duplicada</span>
            <span className="text-[11px] text-gray-400">Proteção física no banco de dados contra duplicidades.</span>
          </div>
        </div>
      </div>

      {/* Botão de Suporte WhatsApp */}
      <div className="pt-2 border-t border-[#262A30] flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="text-xs text-gray-400 text-center sm:text-left">
          Dúvidas sobre o sorteio ou precisa de ajuda?
        </span>
        <a
          href="https://wa.me/5511999999999?text=Olá,%20tenho%20dúvidas%20sobre%20a%20Tropa%20da%20Sorte"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-[#25D366]/10 border border-[#25D366]/40 hover:bg-[#25D366]/20 text-[#25D366] text-xs font-bold transition-all"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Falar com Atendimento</span>
        </a>
      </div>
    </div>
  );
};
