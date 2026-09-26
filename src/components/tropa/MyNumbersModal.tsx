'use client';

import React, { useState } from 'react';
import {
  X,
  Search,
  CheckCircle2,
  Clock,
  ExternalLink,
  Copy,
  Check,
  Phone,
  AlertCircle,
  Loader2,
  Ticket,
  Trophy,
} from 'lucide-react';
import Link from 'next/link';
import { formatCentsToBRL, formatDateTime } from '@/lib/formatters';

interface PurchaseItem {
  orderId: string;
  orderPublicId: string;
  raffleId: string;
  raffleName: string;
  raffleSlug: string;
  prizeName: string;
  quantity: number;
  numbers: string[];
  status: string;
  totalAmountInCents: number;
  paymentMethod: string | null;
  receiptCode: string | null;
  createdAt: string;
  paidAt: string | null;
  expiresAt: string | null;
}

interface MyNumbersModalProps {
  isOpen: boolean;
  onClose: () => void;
  raffleId?: string;
  raffleSlug?: string;
  defaultPhone?: string;
}

export const MyNumbersModal: React.FC<MyNumbersModalProps> = ({
  isOpen,
  onClose,
  raffleId,
  raffleSlug,
  defaultPhone = '',
}) => {
  const [phone, setPhone] = useState(defaultPhone);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Formatação de telefone brasileiro (XX) XXXXX-XXXX
  const formatPhoneInput = (value: string) => {
    const raw = value.replace(/\D/g, '').slice(0, 11);
    if (raw.length <= 2) return raw;
    if (raw.length <= 7) return `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
    return `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhoneInput(e.target.value));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');

    if (cleanPhone.length < 10) {
      setError('Por favor, informe seu telefone completo com DDD.');
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(false);

    try {
      const res = await fetch('/api/raffles/my-numbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          raffleId,
          raffleSlug,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao consultar números');
      }

      setSearched(true);
      if (data.found) {
        setCustomerName(data.customer?.name || 'Participante');
        setPurchases(data.purchases || []);
      } else {
        setCustomerName(null);
        setPurchases([]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao buscar cotas';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyNumbers = (orderId: string, numbersList: string[]) => {
    const text = numbersList.join(', ');
    navigator.clipboard.writeText(text);
    setCopiedOrderId(orderId);
    setTimeout(() => setCopiedOrderId(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg my-6 bg-[#181B1F] border border-[#262A30] rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header do Modal */}
        <div className="p-5 border-b border-[#262A30] flex items-center justify-between bg-[#141619]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#16C784]/15 border border-[#16C784]/30 flex items-center justify-center text-[#16C784] shadow-inner">
              <Ticket className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#FFC928]">
                Tropa da Sorte 🍀
              </span>
              <h2 className="text-base sm:text-lg font-black text-white">
                Verificar Meus Números
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#262A30] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário de Busca */}
        <div className="p-5 border-b border-[#262A30] bg-[#101214]/60">
          <form onSubmit={handleSearch} className="flex flex-col gap-3">
            <label className="text-xs font-bold text-gray-300">
              Digite seu número de telefone com DDD para consultar:
            </label>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Phone className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="(61) 98211-5107"
                  className="w-full bg-[#181B1F] border border-[#262A30] focus:border-[#16C784] focus:ring-1 focus:ring-[#16C784] rounded-xl pl-10 pr-4 py-3 text-sm text-white font-mono font-bold outline-none transition-all placeholder:text-gray-600"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="py-3 px-5 rounded-xl bg-[#16C784] hover:bg-[#12A66D] disabled:opacity-50 text-[#101214] font-black text-xs uppercase tracking-wide flex items-center gap-1.5 shadow-md shadow-[#16C784]/20 transition-all shrink-0"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span>Buscar</span>
              </button>
            </div>

            {error && (
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </form>
        </div>

        {/* Lista de Resultados com Scroll */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {!searched && !loading && (
            <div className="py-8 text-center flex flex-col items-center gap-2 text-gray-400">
              <Search className="w-8 h-8 text-gray-600" />
              <p className="text-xs">
                Informe seu telefone cadastrado no momento da compra para ver suas cotas.
              </p>
            </div>
          )}

          {searched && purchases.length === 0 && (
            <div className="py-8 text-center flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="flex flex-col gap-1 max-w-xs">
                <span className="text-sm font-bold text-white">Nenhum número encontrado</span>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Não encontramos compras vinculadas ao telefone <strong className="text-white">{phone}</strong>. Certifique-se de usar o mesmo telefone digitado no checkout.
                </p>
              </div>
            </div>
          )}

          {searched && purchases.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="p-3 rounded-2xl bg-[#16C784]/10 border border-[#16C784]/30 flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-[#16C784] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs font-black text-white">
                    Olá, {customerName}! 🍀
                  </span>
                  <span className="text-[11px] text-gray-400">
                    Encontramos {purchases.length} pedido(s) associado(s) ao seu número.
                  </span>
                </div>
              </div>

              {purchases.map((purchase) => {
                const isPaid = purchase.status === 'paid';
                const isAwaiting = purchase.status === 'awaiting_payment';

                return (
                  <div
                    key={purchase.orderId}
                    className="p-4 rounded-2xl bg-[#141619] border border-[#262A30] flex flex-col gap-3.5 shadow-md"
                  >
                    {/* Header do Pedido */}
                    <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-[#262A30]">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase text-[#FFC928]">
                          {purchase.raffleName}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-mono font-bold text-white">
                            #{purchase.orderPublicId}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            • {formatDateTime(purchase.createdAt)}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1 ${
                          isPaid
                            ? 'bg-[#16C784]/15 text-[#16C784] border border-[#16C784]/30'
                            : isAwaiting
                            ? 'bg-[#FFC928]/15 text-[#FFC928] border border-[#FFC928]/30'
                            : 'bg-gray-800 text-gray-400'
                        }`}
                      >
                        {isPaid ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-[#16C784]" />
                            <span>Pago & Concorrendo</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-[#FFC928]" />
                            <span>Aguardando Pix</span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* Números da Sorte */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400 font-bold">
                          Seus Números ({purchase.numbers.length}):
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyNumbers(purchase.orderId, purchase.numbers)}
                          className="text-[11px] text-[#16C784] hover:underline font-bold flex items-center gap-1"
                        >
                          {copiedOrderId === purchase.orderId ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copiar Números</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 rounded-xl bg-[#101214] border border-[#262A30]">
                        {purchase.numbers.map((num) => (
                          <div
                            key={num}
                            className={`py-1 px-2.5 rounded-lg text-xs font-mono font-black border tracking-wider ${
                              isPaid
                                ? 'bg-[#16C784]/20 border-[#16C784]/50 text-[#16C784]'
                                : 'bg-[#FFC928]/15 border-[#FFC928]/40 text-[#FFC928]'
                            }`}
                          >
                            {num}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Footer do Pedido */}
                    <div className="pt-2 flex items-center justify-between text-xs">
                      <div className="flex items-baseline gap-1">
                        <span className="text-gray-400">Total:</span>
                        <span className="font-black text-[#16C784]">
                          {formatCentsToBRL(purchase.totalAmountInCents)}
                        </span>
                      </div>

                      {isPaid && purchase.receiptCode && (
                        <Link
                          href={`/sucesso/${purchase.orderId}?receipt=${purchase.receiptCode}`}
                          target="_blank"
                          className="py-1.5 px-3 rounded-lg bg-[#181B1F] border border-[#262A30] hover:border-[#16C784] text-[11px] font-bold text-gray-300 hover:text-white flex items-center gap-1 transition-all"
                        >
                          <span>Ver Comprovante</span>
                          <ExternalLink className="w-3 h-3 text-[#16C784]" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer do Modal */}
        <div className="p-4 border-t border-[#262A30] bg-[#141619] flex items-center justify-between text-[11px] text-gray-500">
          <span>Tropa da Sorte • Consulta Segura</span>
          <button
            type="button"
            onClick={onClose}
            className="py-1.5 px-4 rounded-xl border border-[#262A30] text-gray-300 hover:text-white text-xs font-bold transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
