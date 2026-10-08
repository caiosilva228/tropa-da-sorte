'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TropaLogo } from '@/components/tropa/TropaLogo';
import Link from 'next/link';
import { ShieldCheck, Search, ArrowLeft, Loader2, Sparkles, AlertCircle } from 'lucide-react';

export default function VerificarIndexPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().replace(/^#/, '').toUpperCase();

    if (!cleanCode) {
      setError('Por favor, informe o código de verificação ou o número do pedido.');
      return;
    }

    setError(null);
    setLoading(true);
    router.push(`/verificar/${encodeURIComponent(cleanCode)}`);
  };

  return (
    <div className="min-h-screen bg-[#101214] text-white flex flex-col items-center px-4 py-8">
      <header className="mb-6">
        <TropaLogo />
      </header>

      <main className="w-full max-w-md bg-[#181B1F] border border-[#262A30] rounded-3xl p-6 sm:p-8 flex flex-col items-center gap-6 shadow-2xl relative overflow-hidden">
        {/* Faixa decorativa superior */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#16C784] via-[#FFC928] to-[#16C784]" />

        {/* Ícone de Escudo e Autenticação */}
        <div className="w-16 h-16 rounded-2xl bg-[#16C784]/15 border border-[#16C784]/40 flex items-center justify-center text-[#16C784] shadow-lg shadow-[#16C784]/15">
          <ShieldCheck className="w-10 h-10 stroke-[2.2]" />
        </div>

        {/* Título e Instrução */}
        <div className="flex flex-col items-center text-center gap-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase text-[#16C784] tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#FFC928]" />
            <span>Validação Pública Oficial</span>
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">
            Verificar Comprovante
          </h1>
          <p className="text-xs text-gray-300 max-w-xs">
            Consulte a autenticidade oficial de qualquer comprovante ou pedido emitido pela Tropa da Sorte.
          </p>
        </div>

        {/* Formulário de Busca por Código */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="verify-code" className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
              <span>Código de Verificação ou Pedido</span>
            </label>
            <div className="relative w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="verify-code"
                type="text"
                autoFocus
                placeholder="Ex: RCPT-4YX6-N7NX ou SRT-D4GBGQ"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  if (error) setError(null);
                }}
                className="w-full bg-[#101214] border border-[#262A30] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 font-mono focus:outline-none focus:border-[#16C784] transition-all tracking-wider"
              />
            </div>
            {error && (
              <div className="flex items-center gap-1.5 text-xs text-[#EF4444] pt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full py-3.5 px-4 rounded-xl bg-[#16C784] hover:bg-[#12A66D] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-[#101214] font-black text-sm tracking-wide shadow-lg shadow-[#16C784]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#101214]" />
                <span>CONSULTANDO AUTENTICIDADE...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                <span>VERIFICAR AUTENTICIDADE</span>
              </>
            )}
          </button>
        </form>

        {/* Dica de Ajuda */}
        <div className="w-full p-3.5 rounded-2xl bg-[#101214] border border-[#262A30] text-[11px] text-gray-400 flex flex-col gap-1 text-left">
          <span className="font-bold text-gray-300">💡 Onde encontrar o código?</span>
          <span>
            O código consta no rodapé do seu comprovante digital oficial (Ex: <strong className="text-white font-mono">RCPT-XXXX-XXXX</strong>) ou no número do seu pedido (Ex: <strong className="text-white font-mono">#SRT-XXXXXX</strong>).
          </span>
        </div>

        {/* Voltar ao início */}
        <Link
          href="/"
          className="w-full py-3 rounded-xl bg-[#101214] border border-[#262A30] hover:border-gray-500 text-xs font-bold text-gray-300 flex items-center justify-center gap-2 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao início</span>
        </Link>
      </main>
    </div>
  );
}
