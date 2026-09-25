'use client';

import React, { useEffect, useState, use } from 'react';
import { TropaLogo } from '@/components/tropa/TropaLogo';
import { formatCentsToBRL } from '@/lib/formatters';
import Link from 'next/link';
import { Download, Share2, CheckCircle2, ShieldCheck, Sparkles, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SuccessPageProps {
  params: Promise<{ orderId: string }>;
}

export default function SuccessPage({ params }: SuccessPageProps) {
  const resolvedParams = use(params);
  const [orderData, setOrderData] = useState<{
    orderId: string;
    publicId: string;
    status: string;
    numbers: string[];
    totalAmountInCents: number;
    receiptCode: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Disparar confetes de celebração
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#16C784', '#FFC928', '#ffffff'],
      });
    } catch {
      // Ignorar se indisponível
    }

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/checkout/status/${resolvedParams.orderId}`);
        if (res.ok) {
          const data = await res.json();
          setOrderData(data);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [resolvedParams.orderId]);

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      'Já garanti meus números na Tropa da Sorte! 🔥🍀 Venha participar você também: ' +
        window.location.origin
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#101214] text-white flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#16C784]" />
        <span className="text-sm font-bold text-gray-400">Verificando seus números...</span>
      </div>
    );
  }

  const receiptCode = orderData?.receiptCode || `RCPT-${orderData?.publicId}`;

  return (
    <div className="min-h-screen bg-[#101214] text-white flex flex-col items-center px-4 py-8">
      <header className="mb-6">
        <TropaLogo />
      </header>

      <main className="w-full max-w-md bg-[#181B1F] border border-[#262A30] rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center gap-5 shadow-2xl relative overflow-hidden">
        {/* Faixa decorativa no topo */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#16C784] via-[#FFC928] to-[#16C784]" />

        {/* Ícone de Sucesso */}
        <div className="w-16 h-16 rounded-2xl bg-[#16C784]/15 border border-[#16C784]/40 flex items-center justify-center text-[#16C784] shadow-lg shadow-[#16C784]/20">
          <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
        </div>

        {/* Headline Popular da Tropa */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-center gap-1.5 text-xs font-black uppercase text-[#FFC928] tracking-widest">
            <Sparkles className="w-4 h-4 text-[#FFC928]" />
            <span>PAGAMENTO CONFIRMADO</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white uppercase">
            TÁ NA TROPA! 🔥🍀
          </h1>
          <p className="text-xs text-gray-300">
            Seus números já estão no sorteio oficial. Agora é só torcer!
          </p>
        </div>

        {/* Números Garantidos em Destaque */}
        <div className="w-full p-4 rounded-2xl bg-[#101214] border border-[#262A30] flex flex-col gap-2">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Seus Números da Sorte ({orderData?.numbers.length || 0})
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {orderData?.numbers.map((num) => (
              <span
                key={num}
                className="px-3 py-1.5 rounded-xl bg-[#16C784]/15 border border-[#16C784]/50 text-[#16C784] font-black text-base font-mono shadow-sm"
              >
                {num}
              </span>
            ))}
          </div>
          <span className="text-[11px] text-gray-400 pt-1">
            Pedido: <strong className="text-white font-mono">#{orderData?.publicId}</strong> • Total:{' '}
            <strong className="text-[#16C784]">
              {formatCentsToBRL(orderData?.totalAmountInCents || 0)}
            </strong>
          </span>
        </div>

        {/* Botões de Ação */}
        <div className="w-full flex flex-col gap-2.5">
          <a
            href={`/api/receipts/${resolvedParams.orderId}/pdf`}
            download
            className="w-full py-3.5 px-4 rounded-xl bg-[#16C784] hover:bg-[#12A66D] active:scale-[0.98] text-[#101214] font-black text-sm tracking-wide shadow-lg shadow-[#16C784]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>BAIXAR COMPROVANTE OFICIAL</span>
          </a>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="w-full py-3 px-4 rounded-xl bg-[#25D366]/15 border border-[#25D366]/40 hover:bg-[#25D366]/25 text-[#25D366] font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>COMPARTILHAR NO WHATSAPP</span>
          </button>
        </div>

        {/* Código de Auditoria Verificável */}
        <div className="w-full pt-3 border-t border-[#262A30] flex flex-col items-center gap-1.5 text-[11px] text-gray-400">
          <div className="flex items-center gap-1 text-gray-300">
            <ShieldCheck className="w-3.5 h-3.5 text-[#16C784]" />
            <span>Código de Verificação:</span>
            <strong className="text-white font-mono">{receiptCode}</strong>
          </div>
          <Link
            href={`/verificar/${receiptCode}`}
            className="text-[10px] text-[#16C784] hover:underline"
          >
            Validar autenticidade do comprovante publicamente →
          </Link>
        </div>
      </main>
    </div>
  );
}
