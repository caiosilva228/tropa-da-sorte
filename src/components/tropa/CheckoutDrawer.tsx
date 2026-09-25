import React, { useState } from 'react';
import { formatCentsToBRL } from '@/lib/formatters';
import { CustomerInput } from '@/types';
import { X, ShieldCheck, QrCode, CreditCard, Loader2 } from 'lucide-react';

interface CheckoutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  raffleName: string;
  selectedNumbers: number[];
  pricePerNumberInCents: number;
  onSubmitCheckout: (customer: CustomerInput, method: 'pix' | 'credit_card') => Promise<void>;
  isLoading?: boolean;
  errorMessage?: string | null;
}

export const CheckoutDrawer: React.FC<CheckoutDrawerProps> = ({
  isOpen,
  onClose,
  raffleName,
  selectedNumbers,
  pricePerNumberInCents,
  onSubmitCheckout,
  isLoading = false,
  errorMessage = null,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card'>('pix');
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalCents = selectedNumbers.length * pricePerNumberInCents;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (name.trim().length < 3) {
      setValidationError('Por favor, informe seu nome completo.');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setValidationError('Por favor, informe um telefone/WhatsApp válido com DDD.');
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setValidationError('Por favor, informe um e-mail válido para receber o comprovante.');
      return;
    }

    await onSubmitCheckout({ name: name.trim(), phone: cleanPhone, email: email.trim() }, paymentMethod);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full sm:max-w-lg bg-[#181B1F] border border-[#262A30] rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header do Drawer */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#262A30]">
          <div className="flex flex-col">
            <span className="text-xs uppercase font-bold text-[#16C784]">Tropa da Sorte</span>
            <h3 className="text-lg font-black text-white">Falta pouco! 🍀</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#101214] border border-[#262A30] flex items-center justify-center text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo com Scroll */}
        <div className="p-4 sm:p-5 overflow-y-auto flex flex-col gap-4">
          {/* Resumo do Pedido */}
          <div className="p-3.5 rounded-xl bg-[#101214] border border-[#262A30] flex flex-col gap-1.5">
            <span className="text-xs text-gray-400 font-medium">Ação: {raffleName}</span>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">
                {selectedNumbers.length} {selectedNumbers.length === 1 ? 'número selecionado' : 'números selecionados'}
              </span>
              <span className="text-base font-black text-[#16C784]">
                {formatCentsToBRL(totalCents)}
              </span>
            </div>
            <div className="text-[11px] text-gray-400 break-words line-clamp-2">
              Números: {selectedNumbers.map((n) => n.toString().padStart(4, '0')).join(', ')}
            </div>
          </div>

          {/* Alertas de Erro */}
          {(errorMessage || validationError) && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-200">
              {validationError || errorMessage}
            </div>
          )}

          {/* Formulário de Identificação */}
          <form id="checkout-form" onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">
                Nome Completo *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: João da Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#101214] border border-[#262A30] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#16C784]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">
                WhatsApp / Telefone *
              </label>
              <input
                type="tel"
                required
                placeholder="(DDD) 99999-9999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#101214] border border-[#262A30] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#16C784]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">
                E-mail (para receber o comprovante) *
              </label>
              <input
                type="email"
                required
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#101214] border border-[#262A30] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#16C784]"
              />
            </div>

            {/* Seleção da Forma de Pagamento */}
            <div className="flex flex-col gap-1.5 pt-1">
              <label className="block text-xs font-bold text-gray-300">
                Forma de Pagamento
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('pix')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-bold transition-all ${
                    paymentMethod === 'pix'
                      ? 'bg-[#16C784]/15 border-[#16C784] text-[#16C784]'
                      : 'bg-[#101214] border-[#262A30] text-gray-400 hover:text-white'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>Pix (Na hora)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('credit_card')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-bold transition-all ${
                    paymentMethod === 'credit_card'
                      ? 'bg-[#FFC928]/15 border-[#FFC928] text-[#FFC928]'
                      : 'bg-[#101214] border-[#262A30] text-gray-400 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Cartão (Até 12x)</span>
                </button>
              </div>
            </div>
          </form>

          <div className="flex items-center gap-2 text-[11px] text-gray-400 pt-1">
            <ShieldCheck className="w-4 h-4 text-[#16C784] shrink-0" />
            <span>Seus dados estão protegidos de acordo com a LGPD e criptografados.</span>
          </div>
        </div>

        {/* Rodapé com Botão de Conclusão */}
        <div className="p-4 sm:p-5 border-t border-[#262A30] bg-[#101214]/50">
          <button
            type="submit"
            form="checkout-form"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl bg-[#16C784] hover:bg-[#12A66D] active:scale-[0.99] text-[#101214] font-black text-sm tracking-wide shadow-lg shadow-[#16C784]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#101214]" />
                <span>RESERVANDO NÚMEROS...</span>
              </>
            ) : (
              <span>GARANTIR MEUS NÚMEROS 🔥</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
