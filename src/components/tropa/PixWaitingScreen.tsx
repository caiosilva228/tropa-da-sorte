import React, { useState, useEffect } from 'react';
import { formatCentsToBRL } from '@/lib/formatters';
import { Copy, Check, Clock, Loader2, ShieldCheck, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PixWaitingScreenProps {
  orderId: string;
  orderPublicId: string;
  totalAmountInCents: number;
  qrCode: string;
  qrCodeBase64?: string | null;
  expiresAt: string;
  numbers: string[];
  onPaymentConfirmed: (receiptCode: string) => void;
}

export const PixWaitingScreen: React.FC<PixWaitingScreenProps> = ({
  orderId,
  orderPublicId,
  totalAmountInCents,
  qrCode,
  qrCodeBase64,
  expiresAt,
  numbers,
  onPaymentConfirmed,
}) => {
  const [copied, setCopied] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(900); // 15 min default
  const [isVerifying, setIsVerifying] = useState(false);

  // Countdown timer
  useEffect(() => {
    const target = new Date(expiresAt).getTime();
    const updateCountdown = () => {
      const now = new Date().getTime();
      const diff = Math.max(0, Math.floor((target - now) / 1000));
      setSecondsRemaining(diff);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  // Polling inteligente para detecção da aprovação do pagamento
  useEffect(() => {
    let isCancelled = false;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/checkout/status/${orderId}`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.status === 'paid' && !isCancelled) {
          // Disparar confetes de celebração "TÁ NA TROPA!"
          try {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#16C784', '#FFC928', '#ffffff'],
            });
          } catch {
            // Se canvas não suportado, segue normalmente
          }

          onPaymentConfirmed(data.receiptCode || `RCPT-${orderPublicId}`);
        }
      } catch (err) {
        console.warn('Erro na checagem de status:', err);
      }
    };

    const pollInterval = setInterval(checkStatus, 3000);
    return () => {
      isCancelled = true;
      clearInterval(pollInterval);
    };
  }, [orderId, orderPublicId, onPaymentConfirmed]);

  const handleCopyPix = () => {
    if (!qrCode) return;
    navigator.clipboard.writeText(qrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleManualCheck = async () => {
    setIsVerifying(true);
    try {
      const res = await fetch(`/api/checkout/status/${orderId}`);
      const data = await res.json();
      if (data.status === 'paid') {
        onPaymentConfirmed(data.receiptCode || `RCPT-${orderPublicId}`);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedCountdown = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="w-full max-w-md mx-auto bg-[#181B1F] border border-[#262A30] rounded-2xl p-5 flex flex-col items-center gap-4 text-center shadow-2xl">
      {/* Título de Pagamento */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs uppercase font-black tracking-wider text-[#FFC928] flex items-center gap-1">
          <Flame className="w-4 h-4 text-[#FFC928]" />
          AGORA É SÓ PAGAR
        </span>
        <h2 className="text-xl font-black text-white">Pagamento via Pix</h2>
        <span className="text-sm font-black text-[#16C784]">
          {formatCentsToBRL(totalAmountInCents)}
        </span>
      </div>

      {/* Contador de Expiração da Reserva */}
      <div className="w-full py-2 px-3 rounded-xl bg-[#101214] border border-[#262A30] flex items-center justify-center gap-2 text-xs font-bold text-gray-300">
        <Clock className="w-4 h-4 text-[#FFC928] animate-pulse" />
        <span>Seus números estão reservados por:</span>
        <span className="text-[#FFC928] font-mono text-sm">{formattedCountdown}</span>
      </div>

      {/* QR Code */}
      <div className="p-3 bg-white rounded-2xl shadow-inner border-4 border-[#16C784]/20 flex items-center justify-center">
        {qrCodeBase64 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`data:image/png;base64,${qrCodeBase64}`}
            alt="QR Code Pix"
            className="w-48 h-48 object-contain"
          />
        ) : (
          <div className="w-48 h-48 flex flex-col items-center justify-center bg-gray-100 text-gray-900 text-xs text-center p-3 font-mono">
            <span className="font-bold mb-1">PIX TROPA DA SORTE</span>
            <span className="text-[10px] break-all">{qrCode.substring(0, 50)}...</span>
          </div>
        )}
      </div>

      {/* Botão de Copiar Chave Pix */}
      <div className="w-full flex flex-col gap-2">
        <button
          type="button"
          onClick={handleCopyPix}
          className="w-full py-3.5 px-4 rounded-xl bg-[#16C784] hover:bg-[#12A66D] active:scale-[0.98] text-[#101214] font-black text-sm tracking-wide shadow-lg shadow-[#16C784]/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 stroke-[3]" />
              <span>PIX COPIADO! 🔥</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>COPIAR CÓDIGO PIX</span>
            </>
          )}
        </button>

        <span className="text-[11px] text-gray-400">
          Abra o app do seu banco, escolha <strong>Pix Copia e Cola</strong> e cole o código.
        </span>
      </div>

      {/* Status de Aguardo e Botão de Verificação Manual */}
      <div className="w-full pt-2 border-t border-[#262A30] flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 text-xs text-gray-300">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#16C784]" />
          <span>Aguardando confirmação do banco...</span>
        </div>

        <button
          type="button"
          disabled={isVerifying}
          onClick={handleManualCheck}
          className="text-[11px] font-bold text-gray-400 hover:text-white underline cursor-pointer disabled:opacity-50"
        >
          {isVerifying ? 'Verificando...' : 'Já fiz o pagamento, verificar agora'}
        </button>
      </div>

      {/* Rodapé com Selo de Segurança */}
      <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
        <ShieldCheck className="w-3.5 h-3.5 text-[#16C784]" />
        <span>Pagamento processado com segurança pelo Mercado Pago</span>
      </div>
    </div>
  );
};
