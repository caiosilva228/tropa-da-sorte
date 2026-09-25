'use client';

import React, { useState } from 'react';
import { CreateRaffleInput } from '@/types';
import { formatCentsToBRL } from '@/lib/formatters';
import { X, ArrowRight, ArrowLeft, Check, Sparkles, Image as ImageIcon, Hash, FileText, Loader2, Upload, Link as LinkIcon, Info, Trash2 } from 'lucide-react';

interface CreateRaffleWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onRaffleCreated: () => void;
}

export const CreateRaffleWizard: React.FC<CreateRaffleWizardProps> = ({
  isOpen,
  onClose,
  onRaffleCreated,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados do Formulário
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [descriptionShort, setDescriptionShort] = useState('');
  const [descriptionFull, setDescriptionFull] = useState('');
  const [prizeName, setPrizeName] = useState('');
  const [prizeValueInReais, setPrizeValueInReais] = useState('20000');
  const [bannerDesktopUrl, setBannerDesktopUrl] = useState('');
  const [bannerMobileUrl, setBannerMobileUrl] = useState('');
  const [totalNumbers, setTotalNumbers] = useState<number>(1000);
  const [priceInReais, setPriceInReais] = useState('5.00');
  const [minPerOrder, setMinPerOrder] = useState<number>(1);
  const [maxPerOrder, setMaxPerOrder] = useState<number>(100);
  const [reservationMinutes, setReservationMinutes] = useState<number>(15);

  // Estados de Upload de Imagem
  const [uploadMode, setUploadMode] = useState<'upload' | 'url'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    setUploadError(null);

    // Validação de formato
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Formato inválido! Envie uma imagem em WebP, JPG ou PNG.');
      setIsUploading(false);
      return;
    }

    // Validação de tamanho (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Arquivo muito grande! O tamanho máximo recomendado é de 5MB.');
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
      setUploadedFileName(file.name);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao enviar arquivo';
      setUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  // Gerar slug automaticamente ao digitar o nome
  const handleNameChange = (val: string) => {
    setName(val);
    const autoSlug = val
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setSlug(autoSlug);
  };

  // Calcular número de dígitos automaticamente
  const calculateDigits = (total: number) => {
    if (total <= 100) return 2;
    if (total <= 1000) return 3;
    if (total <= 10000) return 4;
    return 5;
  };

  const numberDigits = calculateDigits(totalNumbers);

  const handleSubmit = async (publishImmediately: boolean) => {
    setLoading(true);
    setError(null);

    try {
      const priceCents = Math.round(parseFloat(priceInReais.replace(',', '.')) * 100);
      const prizeCents = Math.round(parseFloat(prizeValueInReais.replace(',', '.')) * 100);

      if (isNaN(priceCents) || priceCents <= 0) {
        throw new Error('Preço por número inválido.');
      }

      const payload: CreateRaffleInput = {
        name,
        slug,
        descriptionShort,
        descriptionFull,
        prizeName: prizeName || name,
        prizeValueInCents: prizeCents || 0,
        bannerDesktopUrl: bannerDesktopUrl || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1200&q=80',
        bannerMobileUrl: bannerMobileUrl || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80',
        totalNumbers,
        firstNumber: 0,
        numberDigits,
        pricePerNumberInCents: priceCents,
        minNumbersPerOrder: minPerOrder,
        maxNumbersPerOrder: maxPerOrder,
        reservationMinutes,
        allowManualChoice: true,
        allowRandomChoice: true,
        showSoldNumbers: true,
        showReservedNumbers: true,
        showPartialCustomerName: true,
      };

      const res = await fetch('/api/admin/raffles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao criar sorteio');
      }

      // Se solicitado publicar imediatamente
      if (publishImmediately && data.raffle?.id) {
        await fetch(`/api/admin/raffles/${data.raffle.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'active' }),
        });
      }

      onRaffleCreated();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na criação';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl bg-[#181B1F] border border-[#262A30] rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header do Wizard */}
        <div className="flex items-center justify-between p-5 border-b border-[#262A30]">
          <div className="flex flex-col">
            <span className="text-xs uppercase font-bold text-[#16C784]">Tropa da Sorte</span>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#FFC928]" />
              <span>Criar Nova Ação / Sorteio</span>
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#101214] border border-[#262A30] flex items-center justify-center text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Indicador de Etapas */}
        <div className="grid grid-cols-3 border-b border-[#262A30] bg-[#101214]/60 text-xs font-bold">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-all ${
              step === 1 ? 'border-[#16C784] text-[#16C784]' : 'border-transparent text-gray-400'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>1. Informações</span>
          </button>
          <button
            type="button"
            onClick={() => setStep(2)}
            className={`py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-all ${
              step === 2 ? 'border-[#16C784] text-[#16C784]' : 'border-transparent text-gray-400'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>2. Banners & Mídia</span>
          </button>
          <button
            type="button"
            onClick={() => setStep(3)}
            className={`py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-all ${
              step === 3 ? 'border-[#16C784] text-[#16C784]' : 'border-transparent text-gray-400'
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            <span>3. Bolas & Preço</span>
          </button>
        </div>

        {/* Corpo do Formulário */}
        <div className="p-5 sm:p-6 overflow-y-auto flex flex-col gap-4 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-200">
              {error}
            </div>
          )}

          {/* ETAPA 1 */}
          {step === 1 && (
            <div className="flex flex-col gap-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  Nome da Ação / Sorteio *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Honda CG 160 Titan 0KM"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full bg-[#101214] border border-[#262A30] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#16C784]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  Slug da Página Pública (URL)
                </label>
                <div className="flex items-center rounded-xl bg-[#101214] border border-[#262A30] px-3.5 py-2.5 text-xs text-gray-400">
                  <span>/sorteio/</span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="bg-transparent text-white font-mono flex-1 focus:outline-none ml-1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  Nome do Prêmio Principal *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Honda CG 160 0KM"
                  value={prizeName}
                  onChange={(e) => setPrizeName(e.target.value)}
                  className="w-full bg-[#101214] border border-[#262A30] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#16C784]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    Valor Estimado do Prêmio (R$)
                  </label>
                  <input
                    type="text"
                    value={prizeValueInReais}
                    onChange={(e) => setPrizeValueInReais(e.target.value)}
                    className="w-full bg-[#101214] border border-[#262A30] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#16C784]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    Tempo de Reserva (Minutos)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={60}
                    value={reservationMinutes}
                    onChange={(e) => setReservationMinutes(parseInt(e.target.value, 10))}
                    className="w-full bg-[#101214] border border-[#262A30] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#16C784]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  Descrição Curta (chamada rápida)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Leve para casa uma moto 0km com frete grátis para todo o Brasil!"
                  value={descriptionShort}
                  onChange={(e) => setDescriptionShort(e.target.value)}
                  className="w-full bg-[#101214] border border-[#262A30] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#16C784]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  Regulamento Completo / Informações do Sorteio
                </label>
                <textarea
                  rows={3}
                  placeholder="Regras oficiais de apuração pela Loteria Federal..."
                  value={descriptionFull}
                  onChange={(e) => setDescriptionFull(e.target.value)}
                  className="w-full bg-[#101214] border border-[#262A30] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#16C784]"
                />
              </div>
            </div>
          )}

          {/* ETAPA 2 - BANNERS & MÍDIA */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              {/* Seletor de Modo: Upload ou URL */}
              <div className="flex items-center gap-2 p-1 bg-[#101214] rounded-xl border border-[#262A30]">
                <button
                  type="button"
                  onClick={() => setUploadMode('upload')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    uploadMode === 'upload'
                      ? 'bg-[#16C784] text-[#101214] shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload de Arquivo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('url')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    uploadMode === 'url'
                      ? 'bg-[#16C784] text-[#101214] shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>Inserir Link / URL</span>
                </button>
              </div>

              {/* Guia de Tamanho Ideal e Resoluções Recomendadas */}
              <div className="p-3.5 rounded-2xl bg-[#16C784]/10 border border-[#16C784]/25 flex flex-col gap-1.5 text-xs">
                <div className="flex items-center gap-2 text-[#16C784] font-black uppercase text-[11px] tracking-wide">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>Guia de Tamanho Ideal da Imagem</span>
                </div>
                <div className="text-gray-300 text-[11px] leading-relaxed flex flex-col gap-1">
                  <p>
                    • <strong className="text-white">Resolução Ideal Recomendada:</strong> 1200 x 675 pixels (proporção 16:9 widescreen) ou 1080 x 1080 pixels (1:1 quadrado).
                  </p>
                  <p>
                    • <strong className="text-white">Resolução Mínima:</strong> 800 x 450 pixels para garantir nitidez em telas Retina e Full HD.
                  </p>
                  <p>
                    • <strong className="text-white">Formatos Permitidos:</strong> WebP (mais rápido e leve), JPG ou PNG até 5 MB.
                  </p>
                  <p className="text-gray-400 italic">
                    💡 A imagem se adapta dinamicamente no mobile e no desktop com recorte proporcional automático.
                  </p>
                </div>
              </div>

              {/* Área de Upload ou Input de URL */}
              {uploadMode === 'upload' ? (
                <div className="flex flex-col gap-2">
                  <label className="block text-xs font-bold text-gray-300">
                    Selecione a Imagem do Prêmio *
                  </label>
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleFileUpload(e.dataTransfer.files[0]);
                      }
                    }}
                    className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-center transition-all cursor-pointer ${
                      isUploading
                        ? 'border-[#16C784] bg-[#16C784]/5'
                        : 'border-[#262A30] hover:border-[#16C784]/60 bg-[#101214]/60 hover:bg-[#101214]'
                    }`}
                    onClick={() => {
                      const input = document.getElementById('raffle-image-upload') as HTMLInputElement;
                      input?.click();
                    }}
                  >
                    <input
                      id="raffle-image-upload"
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload(e.target.files[0]);
                        }
                      }}
                    />

                    {isUploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 text-[#16C784] animate-spin" />
                        <span className="text-xs font-bold text-[#16C784]">Enviando imagem para a nuvem...</span>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-[#181B1F] border border-[#262A30] flex items-center justify-center text-[#16C784]">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-white">
                            Clique para escolher do computador/celular ou arraste o arquivo aqui
                          </span>
                          <span className="text-[11px] text-gray-500">
                            Recomendado: 1200x675px • WebP, JPG ou PNG até 5MB
                          </span>
                        </div>
                        {uploadedFileName && (
                          <div className="mt-1 px-3 py-1 rounded-full bg-[#16C784]/20 border border-[#16C784]/40 text-[#16C784] text-xs font-bold flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5" />
                            <span>Imagem carregada: {uploadedFileName}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {uploadError && (
                    <span className="text-xs text-red-400 font-medium">{uploadError}</span>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <label className="block text-xs font-bold text-gray-300">
                    URL Direta da Imagem do Prêmio / Banner Desktop
                  </label>
                  <input
                    type="url"
                    placeholder="https://exemplo.com/imagem-moto.jpg"
                    value={bannerDesktopUrl}
                    onChange={(e) => {
                      setBannerDesktopUrl(e.target.value);
                      setBannerMobileUrl(e.target.value);
                    }}
                    className="w-full bg-[#101214] border border-[#262A30] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#16C784]"
                  />
                  <span className="text-[11px] text-gray-500">
                    Insira o link direto de uma imagem hospedada na web.
                  </span>
                </div>
              )}

              {/* Preview em Tempo Real */}
              <div className="flex flex-col gap-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400">Preview do Banner na Ação:</span>
                  {bannerDesktopUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setBannerDesktopUrl('');
                        setBannerMobileUrl('');
                        setUploadedFileName(null);
                      }}
                      className="text-[11px] font-bold text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remover Imagem</span>
                    </button>
                  )}
                </div>

                <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden bg-[#101214] border border-[#262A30] relative shadow-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={bannerDesktopUrl || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1200&q=80'}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2.5 left-2.5 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold text-white border border-[#262A30]">
                    {name || 'Nome do Sorteio'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ETAPA 3 */}
          {step === 3 && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  Quantidade Total de Bolas / Números *
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[100, 500, 1000, 5000, 10000, 100000].map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => setTotalNumbers(qty)}
                      className={`py-2 px-3 rounded-xl border text-xs font-black transition-all ${
                        totalNumbers === qty
                          ? 'bg-[#16C784] text-[#101214] border-[#16C784] shadow-md'
                          : 'bg-[#101214] border-[#262A30] text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      {qty.toLocaleString('pt-BR')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Exibição do Formato Numérico Calculado */}
              <div className="p-3.5 rounded-2xl bg-[#101214] border border-[#262A30] flex items-center justify-between text-xs">
                <span className="text-gray-400">Formato dos Números:</span>
                <span className="font-mono font-bold text-[#FFC928]">
                  {Array.from({ length: Math.min(3, totalNumbers) }).map((_, idx) => idx.toString().padStart(numberDigits, '0')).join(', ')} ... { (totalNumbers - 1).toString().padStart(numberDigits, '0') }
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    Preço por Número (R$) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="5.00"
                    value={priceInReais}
                    onChange={(e) => setPriceInReais(e.target.value)}
                    className="w-full bg-[#101214] border border-[#262A30] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#16C784]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    Faturamento Estimado
                  </label>
                  <div className="py-2.5 px-3.5 rounded-xl bg-[#101214] border border-[#262A30] text-sm font-black text-[#16C784]">
                    {formatCentsToBRL(Math.round(parseFloat(priceInReais || '0') * 100) * totalNumbers)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    Mínimo de números por pedido
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={minPerOrder}
                    onChange={(e) => setMinPerOrder(parseInt(e.target.value, 10))}
                    className="w-full bg-[#101214] border border-[#262A30] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#16C784]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    Máximo de números por pedido
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={maxPerOrder}
                    onChange={(e) => setMaxPerOrder(parseInt(e.target.value, 10))}
                    className="w-full bg-[#101214] border border-[#262A30] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#16C784]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé com Navegação */}
        <div className="p-4 sm:p-5 border-t border-[#262A30] bg-[#101214]/60 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
              className="py-2.5 px-4 rounded-xl border border-[#262A30] text-gray-300 hover:text-white flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar</span>
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
              className="py-2.5 px-5 rounded-xl bg-[#16C784] hover:bg-[#12A66D] text-[#101214] font-black text-xs flex items-center gap-1.5 shadow-md shadow-[#16C784]/20"
            >
              <span>Avançar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleSubmit(false)}
                className="py-2.5 px-4 rounded-xl border border-[#262A30] hover:border-gray-500 text-xs font-bold text-gray-300 disabled:opacity-50"
              >
                Salvar Rascunho
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleSubmit(true)}
                className="py-2.5 px-5 rounded-xl bg-[#16C784] hover:bg-[#12A66D] text-[#101214] font-black text-xs flex items-center gap-1.5 shadow-lg shadow-[#16C784]/25 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#101214]" />
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>PUBLICAR AÇÃO 🔥</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
