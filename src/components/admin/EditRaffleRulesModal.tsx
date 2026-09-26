'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Raffle, UpdateRaffleRulesInput } from '@/types';

import {
  X,
  SlidersHorizontal,
  FileText,
  Clock,
  Shield,
  Layers,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Eye,
  Shuffle,
  MousePointerClick,
  Upload,
  Link as LinkIcon,
  Trash2,
  Info,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface EditRaffleRulesModalProps {
  raffle: Raffle;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (updated: Raffle) => void;
}

export const EditRaffleRulesModal: React.FC<EditRaffleRulesModalProps> = ({
  raffle,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'geral' | 'regras' | 'visibilidade' | 'banners'>('geral');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState(raffle.name || '');
  const [descriptionShort, setDescriptionShort] = useState(raffle.descriptionShort || '');
  const [descriptionFull, setDescriptionFull] = useState(raffle.descriptionFull || '');
  const [prizeName, setPrizeName] = useState(raffle.prizeName || '');
  const [prizeValueInReais, setPrizeValueInReais] = useState(
    raffle.prizeValueInCents ? (raffle.prizeValueInCents / 100).toString() : '0'
  );

  // Regras operacionais
  const [minNumbersPerOrder, setMinNumbersPerOrder] = useState<number>(raffle.minNumbersPerOrder || 1);
  const [maxNumbersPerOrder, setMaxNumbersPerOrder] = useState<number>(raffle.maxNumbersPerOrder || 100);
  const [reservationMinutes, setReservationMinutes] = useState<number>(raffle.reservationMinutes || 15);

  // Flags de Visibilidade e Comportamento
  const [allowManualChoice, setAllowManualChoice] = useState<boolean>(
    raffle.allowManualChoice !== undefined ? raffle.allowManualChoice : true
  );
  const [allowRandomChoice, setAllowRandomChoice] = useState<boolean>(
    raffle.allowRandomChoice !== undefined ? raffle.allowRandomChoice : true
  );
  const [showSoldNumbers, setShowSoldNumbers] = useState<boolean>(
    raffle.showSoldNumbers !== undefined ? raffle.showSoldNumbers : true
  );
  const [showReservedNumbers, setShowReservedNumbers] = useState<boolean>(
    raffle.showReservedNumbers !== undefined ? raffle.showReservedNumbers : true
  );
  const [showPartialCustomerName, setShowPartialCustomerName] = useState<boolean>(
    raffle.showPartialCustomerName !== undefined ? raffle.showPartialCustomerName : true
  );

  // Apuração e Status
  const [drawMethod, setDrawMethod] = useState(raffle.drawMethod || 'loteria_federal');
  const [drawReference, setDrawReference] = useState(raffle.drawReference || '1º Prêmio da Loteria Federal');
  const [drawDate, setDrawDate] = useState(
    raffle.drawDate ? raffle.drawDate.substring(0, 16) : ''
  );
  const [status, setStatus] = useState<Raffle['status']>(raffle.status || 'draft');

  // Banners
  const [bannerDesktopUrl, setBannerDesktopUrl] = useState(raffle.bannerDesktopUrl || '');
  const [bannerMobileUrl, setBannerMobileUrl] = useState(raffle.bannerMobileUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;


  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    setUploadError(null);

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Formato inválido! Envie imagem WebP, JPG ou PNG.');
      setIsUploading(false);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Arquivo muito grande! O limite recomendado é 5MB.');
      setIsUploading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao realizar upload da imagem.');
      }

      setBannerDesktopUrl(data.url);
      setBannerMobileUrl(data.url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao enviar arquivo';
      setUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (!name || name.trim().length < 3) {
        throw new Error('O nome da ação deve ter no mínimo 3 caracteres.');
      }
      if (minNumbersPerOrder < 1) {
        throw new Error('O pedido mínimo deve ser de pelo menos 1 número.');
      }
      if (maxNumbersPerOrder < minNumbersPerOrder) {
        throw new Error('O pedido máximo não pode ser menor que o pedido mínimo.');
      }
      if (reservationMinutes < 1 || reservationMinutes > 180) {
        throw new Error('O tempo de reserva deve estar entre 1 e 180 minutos.');
      }

      const payload: UpdateRaffleRulesInput = {
        name: name.trim(),
        descriptionShort: descriptionShort.trim() || null,
        descriptionFull: descriptionFull.trim() || null,
        prizeName: prizeName.trim() || name.trim(),
        prizeValueInCents: Math.round((parseFloat(prizeValueInReais) || 0) * 100),
        minNumbersPerOrder: Number(minNumbersPerOrder),
        maxNumbersPerOrder: Number(maxNumbersPerOrder),
        reservationMinutes: Number(reservationMinutes),
        allowManualChoice,
        allowRandomChoice,
        showSoldNumbers,
        showReservedNumbers,
        showPartialCustomerName,
        drawMethod,
        drawReference: drawReference.trim() || null,
        drawDate: drawDate ? new Date(drawDate).toISOString() : null,
        status,
        bannerDesktopUrl: bannerDesktopUrl.trim() || null,
        bannerMobileUrl: bannerMobileUrl.trim() || null,
      };

      const res = await fetch(`/api/admin/raffles/${raffle.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar as regras da ação.');
      }

      setSuccessMessage('Regras e configurações da ação atualizadas com sucesso!');
      if (onSuccess && data.raffle) {
        onSuccess(data.raffle);
      }

      router.refresh();

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao atualizar regras da ação';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl my-6 bg-[#181B1F] border border-[#262A30] rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header do Modal */}
        <div className="p-5 sm:p-6 border-b border-[#262A30] flex items-center justify-between bg-[#141619]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#FFC928]/15 border border-[#FFC928]/30 flex items-center justify-center text-[#FFC928] shadow-inner">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#FFC928]">
                Painel Administrativo
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <span>Editar Regras da Ação</span>
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

        {/* Abas de Navegação */}
        <div className="px-5 pt-3 border-b border-[#262A30] flex gap-2 overflow-x-auto bg-[#141619]">
          <button
            type="button"
            onClick={() => setActiveTab('geral')}
            className={`pb-3 px-3 text-xs font-black uppercase transition-colors flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'geral'
                ? 'border-[#16C784] text-[#16C784]'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Geral & Regulamento</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('regras')}
            className={`pb-3 px-3 text-xs font-black uppercase transition-colors flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'regras'
                ? 'border-[#16C784] text-[#16C784]'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Reservas & Limites</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('visibilidade')}
            className={`pb-3 px-3 text-xs font-black uppercase transition-colors flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'visibilidade'
                ? 'border-[#16C784] text-[#16C784]'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Visibilidade & Modos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('banners')}
            className={`pb-3 px-3 text-xs font-black uppercase transition-colors flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'banners'
                ? 'border-[#16C784] text-[#16C784]'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Apuração & Banners</span>
          </button>
        </div>

        {/* Mensagens de Alerta */}
        {error && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400 text-xs font-bold">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-[#16C784]/15 border border-[#16C784]/30 flex items-center gap-3 text-[#16C784] text-xs font-bold">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Formulário com Scroll Interno */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-6">
          {/* ABA 1: GERAL & REGULAMENTO */}
          {activeTab === 'geral' && (
            <div className="flex flex-col gap-5">
              <div className="p-3.5 rounded-2xl bg-[#101214] border border-[#262A30] flex items-center gap-3 text-xs text-gray-400">
                <Info className="w-4 h-4 text-[#FFC928] shrink-0" />
                <span>
                  Edite o título, descrição e regulamento completo. Essas informações são exibidas na página pública da ação e no link de Regulamento Oficial.
                </span>
              </div>

              {/* Nome da Ação */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black uppercase text-gray-300">
                  Nome da Ação / Campanha *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#101214] border border-[#262A30] focus:border-[#16C784] focus:ring-1 focus:ring-[#16C784] rounded-xl px-4 py-3 text-sm text-white font-medium outline-none transition-all"
                  placeholder="Ex: BMW 320i M Sport ou R$ 250.000 no Pix"
                  required
                />
              </div>

              {/* Grid Prêmio e Valor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black uppercase text-gray-300">
                    Nome do Prêmio Principal *
                  </label>
                  <input
                    type="text"
                    value={prizeName}
                    onChange={(e) => setPrizeName(e.target.value)}
                    className="w-full bg-[#101214] border border-[#262A30] focus:border-[#16C784] focus:ring-1 focus:ring-[#16C784] rounded-xl px-4 py-3 text-sm text-white font-medium outline-none transition-all"
                    placeholder="Ex: BMW 320i 0km"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black uppercase text-gray-300">
                    Valor Estimado do Prêmio (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={prizeValueInReais}
                    onChange={(e) => setPrizeValueInReais(e.target.value)}
                    className="w-full bg-[#101214] border border-[#262A30] focus:border-[#16C784] focus:ring-1 focus:ring-[#16C784] rounded-xl px-4 py-3 text-sm text-white font-medium outline-none transition-all"
                    placeholder="250000.00"
                  />
                </div>
              </div>

              {/* Descrição Curta (Subtítulo) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black uppercase text-gray-300">
                  Descrição Curta (Subtítulo do Card)
                </label>
                <input
                  type="text"
                  maxLength={250}
                  value={descriptionShort}
                  onChange={(e) => setDescriptionShort(e.target.value)}
                  className="w-full bg-[#101214] border border-[#262A30] focus:border-[#16C784] focus:ring-1 focus:ring-[#16C784] rounded-xl px-4 py-3 text-sm text-white font-medium outline-none transition-all"
                  placeholder="Ex: Leve essa nave zero km para sua garagem com tanque cheio e frete grátis!"
                />
                <span className="text-[10px] text-gray-500 text-right">{descriptionShort.length}/250</span>
              </div>

              {/* Regulamento Oficial Completo */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-gray-300 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-[#16C784]" />
                    <span>Regulamento Completo e Regras da Ação</span>
                  </label>
                  <span className="text-[11px] text-gray-500">Exibido na página oficial de termos</span>
                </div>
                <textarea
                  rows={6}
                  value={descriptionFull}
                  onChange={(e) => setDescriptionFull(e.target.value)}
                  className="w-full bg-[#101214] border border-[#262A30] focus:border-[#16C784] focus:ring-1 focus:ring-[#16C784] rounded-xl p-4 text-xs text-gray-300 leading-relaxed font-sans outline-none transition-all resize-y"
                  placeholder="Descreva as regras da ação, condições de participação, entrega do prêmio, documentação necessária e termos legais..."
                />
              </div>
            </div>
          )}

          {/* ABA 2: RESERVAS & LIMITES */}
          {activeTab === 'regras' && (
            <div className="flex flex-col gap-5">
              <div className="p-3.5 rounded-2xl bg-[#101214] border border-[#262A30] flex items-center gap-3 text-xs text-gray-400">
                <Clock className="w-4 h-4 text-[#FFC928] shrink-0" />
                <span>
                  Configure o tempo de tolerância para pagamento das reservas Pix e os limites de cotas por pedido.
                </span>
              </div>

              {/* Tempo de Reserva do Pix */}
              <div className="flex flex-col gap-2 p-4 rounded-2xl bg-[#101214] border border-[#262A30]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-white flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#FFC928]" />
                    <span>Tempo de Expiração da Reserva (Minutos) *</span>
                  </label>
                  <span className="text-sm font-black text-[#FFC928]">{reservationMinutes} min</span>
                </div>
                <p className="text-[11px] text-gray-400">
                  Tempo limite para o comprador realizar o pagamento via Pix antes que os números voltem para disponíveis.
                </p>

                <div className="flex items-center gap-2 mt-1">
                  {[10, 15, 20, 30, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setReservationMinutes(mins)}
                      className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                        reservationMinutes === mins
                          ? 'bg-[#FFC928] text-[#101214] font-black shadow-md shadow-[#FFC928]/20'
                          : 'bg-[#181B1F] border border-[#262A30] text-gray-400 hover:text-white'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={reservationMinutes}
                    onChange={(e) => setReservationMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-24 bg-[#181B1F] border border-[#262A30] rounded-lg px-3 py-1.5 text-xs text-white font-bold text-center outline-none focus:border-[#FFC928]"
                  />
                </div>
              </div>

              {/* Limites por Pedido */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[#101214] border border-[#262A30] flex flex-col gap-2">
                  <label className="text-xs font-black uppercase text-white">
                    Pedido Mínimo (Cotas) *
                  </label>
                  <p className="text-[11px] text-gray-400">Quantidade mínima de números por compra.</p>
                  <input
                    type="number"
                    min={1}
                    value={minNumbersPerOrder}
                    onChange={(e) => setMinNumbersPerOrder(Math.max(1, parseInt(e.target.value) || 1))}
                    className="bg-[#181B1F] border border-[#262A30] focus:border-[#16C784] rounded-xl px-4 py-2.5 text-sm text-white font-bold outline-none"
                    required
                  />
                </div>

                <div className="p-4 rounded-2xl bg-[#101214] border border-[#262A30] flex flex-col gap-2">
                  <label className="text-xs font-black uppercase text-white">
                    Pedido Máximo (Cotas) *
                  </label>
                  <p className="text-[11px] text-gray-400">Limite máximo de cotas por transação.</p>
                  <input
                    type="number"
                    min={minNumbersPerOrder}
                    value={maxNumbersPerOrder}
                    onChange={(e) => setMaxNumbersPerOrder(Math.max(1, parseInt(e.target.value) || 100))}
                    className="bg-[#181B1F] border border-[#262A30] focus:border-[#16C784] rounded-xl px-4 py-2.5 text-sm text-white font-bold outline-none"
                    required
                  />
                </div>
              </div>

              {/* Informação sobre total e preço */}
              <div className="p-4 rounded-2xl bg-[#101214] border border-[#262A30] flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-gray-400 uppercase">
                  Parâmetros Fixos da Ação
                </span>
                <div className="flex flex-wrap gap-4 text-xs text-gray-300">
                  <span>Total de Cotas: <strong className="text-white">{raffle.totalNumbers.toLocaleString('pt-BR')}</strong></span>
                  <span>Preço por Cota: <strong className="text-[#16C784]">R$ {(raffle.pricePerNumberInCents / 100).toFixed(2).replace('.', ',')}</strong></span>
                  <span>Dígitos: <strong className="text-white">{raffle.numberDigits}</strong></span>
                </div>
                <span className="text-[10px] text-gray-500 mt-1">
                  * A quantidade total de bolas e o preço por cota são fixados na criação para garantir a integridade dos números gerados e faturamento já transacionado.
                </span>
              </div>
            </div>
          )}

          {/* ABA 3: VISIBILIDADE & MODOS */}
          {activeTab === 'visibilidade' && (
            <div className="flex flex-col gap-4">
              <div className="p-3.5 rounded-2xl bg-[#101214] border border-[#262A30] flex items-center gap-3 text-xs text-gray-400">
                <Eye className="w-4 h-4 text-[#16C784] shrink-0" />
                <span>
                  Defina os modos de escolha permitidos ao comprador e o que fica visível na página pública da ação.
                </span>
              </div>

              {/* Opção Escolha Manual */}
              <div className="p-4 rounded-2xl bg-[#101214] border border-[#262A30] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#16C784]/15 border border-[#16C784]/30 flex items-center justify-center text-[#16C784]">
                    <MousePointerClick className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-white uppercase">Permitir Escolha Manual</span>
                    <span className="text-[11px] text-gray-400">
                      O comprador pode clicar e escolher seus números preferidos individualmente no grid.
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={allowManualChoice}
                  onChange={(e) => setAllowManualChoice(e.target.checked)}
                  className="w-5 h-5 accent-[#16C784] rounded cursor-pointer"
                />
              </div>

              {/* Opção Escolha Aleatória */}
              <div className="p-4 rounded-2xl bg-[#101214] border border-[#262A30] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FFC928]/15 border border-[#FFC928]/30 flex items-center justify-center text-[#FFC928]">
                    <Shuffle className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-white uppercase">Permitir Cotas da Sorte (+5, +10, etc.)</span>
                    <span className="text-[11px] text-gray-400">
                      Habilita os botões de seleção aleatória rápida para acelerar a compra mobile.
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={allowRandomChoice}
                  onChange={(e) => setAllowRandomChoice(e.target.checked)}
                  className="w-5 h-5 accent-[#16C784] rounded cursor-pointer"
                />
              </div>

              {/* Exibir Números Vendidos */}
              <div className="p-4 rounded-2xl bg-[#101214] border border-[#262A30] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-300">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-white uppercase">Exibir Números Pagos Publicamente</span>
                    <span className="text-[11px] text-gray-400">
                      Mostra os números já comprados como desabilitados/pagos na grade pública.
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={showSoldNumbers}
                  onChange={(e) => setShowSoldNumbers(e.target.checked)}
                  className="w-5 h-5 accent-[#16C784] rounded cursor-pointer"
                />
              </div>

              {/* Exibir Números Reservados */}
              <div className="p-4 rounded-2xl bg-[#101214] border border-[#262A30] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FFC928]/15 border border-[#FFC928]/30 flex items-center justify-center text-[#FFC928]">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-white uppercase">Exibir Números Reservados</span>
                    <span className="text-[11px] text-gray-400">
                      Diferencia números aguardando pagamento Pix dos demais números livres.
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={showReservedNumbers}
                  onChange={(e) => setShowReservedNumbers(e.target.checked)}
                  className="w-5 h-5 accent-[#16C784] rounded cursor-pointer"
                />
              </div>

              {/* Exibir Nome Parcial */}
              <div className="p-4 rounded-2xl bg-[#101214] border border-[#262A30] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-white uppercase">Exibir Nome Parcial do Ganhador/Comprador</span>
                    <span className="text-[11px] text-gray-400">
                      Em conformidade com a LGPD, exibe nomes como &ldquo;Lucas S.&rdquo; sem expor dados sensíveis.
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={showPartialCustomerName}
                  onChange={(e) => setShowPartialCustomerName(e.target.checked)}
                  className="w-5 h-5 accent-[#16C784] rounded cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* ABA 4: APURAÇÃO & BANNERS */}
          {activeTab === 'banners' && (
            <div className="flex flex-col gap-5">
              {/* Status da Ação */}
              <div className="p-4 rounded-2xl bg-[#101214] border border-[#262A30] flex flex-col gap-2">
                <label className="text-xs font-black uppercase text-white">Status da Ação</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'draft', label: 'Rascunho' },
                    { id: 'active', label: 'Ativa / No Ar' },
                    { id: 'paused', label: 'Pausada' },
                    { id: 'sold_out', label: 'Esgotada' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStatus(s.id as Raffle['status'])}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                        status === s.id
                          ? 'bg-[#16C784] border-[#16C784] text-[#101214] font-black'
                          : 'bg-[#181B1F] border-[#262A30] text-gray-400 hover:text-white'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Método e Data do Sorteio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black uppercase text-gray-300">
                    Método de Apuração
                  </label>
                  <select
                    value={drawMethod}
                    onChange={(e) => setDrawMethod(e.target.value)}
                    className="bg-[#101214] border border-[#262A30] focus:border-[#16C784] rounded-xl px-4 py-3 text-xs text-white font-bold outline-none"
                  >
                    <option value="loteria_federal">Loteria Federal (Oficial Caixa)</option>
                    <option value="sorteio_eletronico">Sorteio Eletrônico Auditado</option>
                    <option value="deu_no_poste">Deu no Poste / Corujinha</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black uppercase text-gray-300">
                    Referência / Concurso
                  </label>
                  <input
                    type="text"
                    value={drawReference}
                    onChange={(e) => setDrawReference(e.target.value)}
                    className="bg-[#101214] border border-[#262A30] focus:border-[#16C784] rounded-xl px-4 py-3 text-xs text-white font-medium outline-none"
                    placeholder="Ex: 1º Prêmio da Loteria Federal - Concurso 5950"
                  />
                </div>
              </div>

              {/* Data e Hora Prevista */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black uppercase text-gray-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#16C784]" />
                  <span>Data e Hora Prevista da Apuração (Opcional)</span>
                </label>
                <input
                  type="datetime-local"
                  value={drawDate}
                  onChange={(e) => setDrawDate(e.target.value)}
                  className="bg-[#101214] border border-[#262A30] focus:border-[#16C784] rounded-xl px-4 py-3 text-xs text-white font-bold outline-none"
                />
              </div>

              {/* Upload do Banner Principal */}
              <div className="flex flex-col gap-3 p-4 rounded-2xl bg-[#101214] border border-[#262A30]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-white flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-[#16C784]" />
                    <span>Imagem / Banner da Ação</span>
                  </label>
                  <span className="text-[11px] text-gray-400">Recomendado: 1200x675 (WebP / JPG)</span>
                </div>

                {uploadError && (
                  <span className="text-xs text-red-400 font-bold">{uploadError}</span>
                )}

                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  <label className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-[#181B1F] border border-[#262A30] hover:border-[#16C784] text-xs font-bold text-gray-300 hover:text-white flex items-center justify-center gap-2 cursor-pointer transition-all">
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#16C784]" />
                    ) : (
                      <Upload className="w-4 h-4 text-[#16C784]" />
                    )}
                    <span>{isUploading ? 'Enviando imagem...' : 'Selecionar Nova Imagem'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                      disabled={isUploading}
                    />
                  </label>

                  <div className="flex-1 w-full flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-gray-500 shrink-0" />
                    <input
                      type="text"
                      value={bannerDesktopUrl}
                      onChange={(e) => {
                        setBannerDesktopUrl(e.target.value);
                        setBannerMobileUrl(e.target.value);
                      }}
                      placeholder="Ou cole a URL direta da imagem..."
                      className="w-full bg-[#181B1F] border border-[#262A30] rounded-xl px-3 py-2 text-xs text-gray-300 outline-none"
                    />
                  </div>
                </div>

                {bannerDesktopUrl && (
                  <div className="relative mt-2 rounded-xl overflow-hidden border border-[#262A30] max-h-48 bg-black/50 flex items-center justify-center">
                    <img
                      src={bannerDesktopUrl}
                      alt="Banner Preview"
                      className="w-full h-auto object-cover max-h-48"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setBannerDesktopUrl('');
                        setBannerMobileUrl('');
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/80 hover:bg-red-500 text-white transition-colors"
                      title="Remover imagem"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer Fixo de Ações */}
          <div className="pt-4 border-t border-[#262A30] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#16C784]" />
              <span>Alterações salvas são sincronizadas em tempo real.</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 sm:flex-initial py-2.5 px-4 rounded-xl border border-[#262A30] hover:bg-[#262A30] text-gray-300 font-bold text-xs transition-colors"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex-1 sm:flex-initial py-2.5 px-6 rounded-xl bg-[#16C784] hover:bg-[#12A66D] disabled:opacity-50 text-[#101214] font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#16C784]/20 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Salvando Regras...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Salvar Regras da Ação</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
