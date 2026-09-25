'use client';

import React, { useEffect, useState, use } from 'react';
import { TropaLogo } from '@/components/tropa/TropaLogo';
import { formatCentsToBRL, formatDateTime } from '@/lib/formatters';
import Link from 'next/link';
import { ShieldCheck, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';

interface VerifyPageProps {
  params: Promise<{ code: string }>;
}

export default function VerifyReceiptPage({ params }: VerifyPageProps) {
  const resolvedParams = use(params);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    valid: boolean;
    receipt?: {
      verificationCode: string;
      orderPublicId: string;
      raffleName: string;
      customerName: string;
      numbersCount: number;
      numbers: string[];
      totalAmountInCents: number;
      issuedAt: string;
      status: string;
    };
    error?: string;
  } | null>(null);

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await fetch(`/api/receipts/verify/${resolvedParams.code}`);
        const json = await res.json();
        setData(json);
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [resolvedParams.code]);

  return (
    <div className="min-h-screen bg-[#101214] text-white flex flex-col items-center px-4 py-8">
      <header className="mb-6">
        <TropaLogo />
      </header>

      <main className="w-full max-w-md bg-[#181B1F] border border-[#262A30] rounded-3xl p-6 sm:p-8 flex flex-col items-center gap-5 shadow-2xl">
        {loading ? (
          <div className="py-12 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#16C784]" />
            <span className="text-xs text-gray-400">Consultando autenticidade do comprovante...</span>
          </div>
        ) : data?.valid && data.receipt ? (
          <>
            <div className="w-16 h-16 rounded-2xl bg-[#16C784]/15 border border-[#16C784]/40 flex items-center justify-center text-[#16C784]">
              <ShieldCheck className="w-10 h-10" />
            </div>

            <div className="flex flex-col items-center text-center gap-1">
              <span className="text-xs font-black uppercase text-[#16C784] tracking-wider">
                AUTENTICIDADE CONFIRMADA
              </span>
              <h1 className="text-xl font-black text-white">Comprovante Válido</h1>
              <span className="text-xs text-gray-400 font-mono">
                {data.receipt.verificationCode}
              </span>
            </div>

            <div className="w-full p-4 rounded-2xl bg-[#101214] border border-[#262A30] flex flex-col gap-2.5 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-[#262A30]">
                <span className="text-gray-400">Ação / Sorteio:</span>
                <span className="font-bold text-white text-right">{data.receipt.raffleName}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#262A30]">
                <span className="text-gray-400">Pedido:</span>
                <span className="font-bold text-white font-mono">#{data.receipt.orderPublicId}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#262A30]">
                <span className="text-gray-400">Participante:</span>
                <span className="font-bold text-white">{data.receipt.customerName}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#262A30]">
                <span className="text-gray-400">Data de Emissão:</span>
                <span className="font-bold text-white">{formatDateTime(data.receipt.issuedAt)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#262A30]">
                <span className="text-gray-400">Total Pago:</span>
                <span className="font-bold text-[#16C784]">{formatCentsToBRL(data.receipt.totalAmountInCents)}</span>
              </div>
              <div className="flex flex-col gap-1.5 pt-1">
                <span className="text-gray-400">
                  Números Adquiridos ({data.receipt.numbersCount}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {data.receipt.numbers.map((num) => (
                    <span
                      key={num}
                      className="px-2 py-0.5 rounded-lg bg-[#16C784]/15 border border-[#16C784]/40 text-[#16C784] font-mono font-bold text-xs"
                    >
                      {num}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <span className="text-[11px] text-gray-500 text-center">
              Este comprovante foi emitido oficialmente pelo sistema Tropa da Sorte.
            </span>
          </>
        ) : (
          <div className="py-8 flex flex-col items-center gap-3 text-center">
            <AlertCircle className="w-12 h-12 text-[#EF4444]" />
            <h2 className="text-lg font-black text-white">Comprovante Não Encontrado</h2>
            <p className="text-xs text-gray-400">
              O código informado não corresponde a nenhum comprovante ativo em nossa base.
            </p>
          </div>
        )}

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
