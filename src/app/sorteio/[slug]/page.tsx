'use client';

import React, { useState, useEffect, use, useCallback } from 'react';
import { Raffle, RaffleNumber, CustomerInput } from '@/types';
import { TropaLogo } from '@/components/tropa/TropaLogo';
import { PrizeHero } from '@/components/tropa/PrizeHero';
import { RaffleProgress } from '@/components/tropa/RaffleProgress';
import { QuickNumberSelector } from '@/components/tropa/QuickNumberSelector';
import { PublicNumberGrid } from '@/components/tropa/PublicNumberGrid';
import { SelectedNumbersBar } from '@/components/tropa/SelectedNumbersBar';
import { CheckoutDrawer } from '@/components/tropa/CheckoutDrawer';
import { PixWaitingScreen } from '@/components/tropa/PixWaitingScreen';
import { TrustSection } from '@/components/tropa/TrustSection';
import { MyNumbersButton } from '@/components/tropa/MyNumbersButton';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, HelpCircle } from 'lucide-react';
import Link from 'next/link';


interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function SorteioPublicPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [numbers, setNumbers] = useState<RaffleNumber[]>([]);
  const [metrics, setMetrics] = useState<{
    totalNumbers: number;
    paidNumbers: number;
    reservedNumbers: number;
    availableNumbers: number;
    percentagePaid: number;
  }>({
    totalNumbers: 0,
    paidNumbers: 0,
    reservedNumbers: 0,
    availableNumbers: 0,
    percentagePaid: 0,
  });

  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados do Checkout
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Estado do Pix ativo
  const [activePixOrder, setActivePixOrder] = useState<{
    orderId: string;
    orderPublicId: string;
    totalAmountInCents: number;
    qrCode: string;
    qrCodeBase64: string;
    expiresAt: string;
  } | null>(null);

  // Carregar dados da ação
  const loadRaffleData = useCallback(async () => {
    try {
      const res = await fetch(`/api/raffles/${resolvedParams.slug}`);
      if (!res.ok) {
        throw new Error('Sorteio não encontrado ou indisponível.');
      }
      const data = await res.json();
      setRaffle(data.raffle);
      setNumbers(data.numbers);
      setMetrics(data.metrics);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar sorteio';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.slug]);

  useEffect(() => {
    loadRaffleData();
  }, [loadRaffleData]);

  // Alternar seleção manual do número
  const handleToggleNumber = (numInt: number) => {
    setSelectedNumbers((prev) => {
      if (prev.includes(numInt)) {
        return prev.filter((n) => n !== numInt);
      }
      if (raffle && prev.length >= raffle.maxNumbersPerOrder) {
        alert(`O limite máximo por pedido é de ${raffle.maxNumbersPerOrder} números.`);
        return prev;
      }
      return [...prev, numInt].sort((a, b) => a - b);
    });
  };

  // Seleção aleatória rápida (+5, +10, etc.)
  const handleSelectRandom = async (count: number) => {
    if (!raffle) return;
    try {
      const res = await fetch(`/api/raffles/${raffle.id}/random?qty=${count}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Falha ao buscar números aleatórios');
      }
      const data = await res.json();
      // Adicionar os novos números aos já selecionados sem duplicação
      setSelectedNumbers((prev) => {
        const combined = Array.from(new Set([...prev, ...data.numbers])).sort((a, b) => a - b);
        if (raffle && combined.length > raffle.maxNumbersPerOrder) {
          return combined.slice(0, raffle.maxNumbersPerOrder);
        }
        return combined;
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao selecionar números';
      alert(msg);
    }
  };

  // Submissão do Checkout
  const handleSubmitCheckout = async (customer: CustomerInput, method: 'pix' | 'credit_card') => {
    if (!raffle || selectedNumbers.length === 0) return;

    setIsSubmitting(true);
    setCheckoutError(null);

    try {
      // 1. Criar Reserva Atômica no Backend
      const reserveRes = await fetch('/api/checkout/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raffleId: raffle.id,
          numbers: selectedNumbers,
          customer,
          paymentMethod: method,
        }),
      });

      const reserveData = await reserveRes.json();
      if (!reserveRes.ok) {
        throw new Error(reserveData.error || 'Erro ao reservar números.');
      }

      const orderId = reserveData.order.id;

      // 2. Se Pix, gerar cobrança Pix
      if (method === 'pix') {
        const pixRes = await fetch('/api/checkout/pix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId }),
        });

        const pixData = await pixRes.json();
        if (!pixRes.ok) {
          throw new Error(pixData.error || 'Erro ao gerar dados do Pix.');
        }

        setIsDrawerOpen(false);
        setActivePixOrder({
          orderId,
          orderPublicId: reserveData.order.publicId,
          totalAmountInCents: reserveData.order.totalAmountInCents,
          qrCode: pixData.pix.qrCode,
          qrCodeBase64: pixData.pix.qrCodeBase64,
          expiresAt: reserveData.order.expiresAt,
        });
      } else {
        // Redirecionamento ou fluxo de cartão
        router.push(`/checkout/${orderId}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha no processamento';
      setCheckoutError(msg);
      // Recarregar os números para atualizar estados de conflito
      loadRaffleData();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#101214] text-white gap-3 p-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#16C784]" />
        <span className="text-sm font-bold text-gray-300">Carregando a Tropa da Sorte...</span>
      </div>
    );
  }

  if (error || !raffle) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#101214] text-white gap-4 p-4 text-center">
        <AlertCircle className="w-12 h-12 text-[#EF4444]" />
        <h2 className="text-xl font-black">Ação Não Encontrada</h2>
        <p className="text-sm text-gray-400 max-w-md">
          {error || 'Não encontramos este sorteio ou a campanha foi finalizada.'}
        </p>
        <Link
          href="/"
          className="py-2.5 px-5 rounded-xl bg-[#16C784] text-[#101214] font-bold text-sm"
        >
          Voltar para a Página Inicial
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#101214] text-white flex flex-col pb-28">
      {/* Header Fixo da Tropa da Sorte */}
      <header className="sticky top-0 z-40 w-full bg-[#101214]/90 backdrop-blur-md border-b border-[#262A30] py-3 px-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <TropaLogo />

          <div className="flex items-center gap-2">
            {/* Botão de Verificar Meus Números */}
            <MyNumbersButton raffleId={raffle.id} raffleSlug={raffle.slug} variant="header" />

            <Link
              href={`/sorteio/${raffle.slug}/regulamento`}
              className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-[#181B1F] border border-[#262A30]"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Regulamento</span>
            </Link>

            <Link
              href="/admin/login"
              className="text-[11px] font-bold text-gray-400 hover:text-[#16C784] px-2.5 py-1.5 rounded-lg border border-[#262A30] bg-[#181B1F]"
            >
              Área Admin
            </Link>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal Mobile-First */}
      <main className="w-full max-w-2xl mx-auto px-4 py-5 flex flex-col gap-6">
        {/* Caso haja pedido Pix ativo, mostrar tela de pagamento em destaque */}
        {activePixOrder ? (
          <PixWaitingScreen
            orderId={activePixOrder.orderId}
            orderPublicId={activePixOrder.orderPublicId}
            totalAmountInCents={activePixOrder.totalAmountInCents}
            qrCode={activePixOrder.qrCode}
            qrCodeBase64={activePixOrder.qrCodeBase64}
            expiresAt={activePixOrder.expiresAt}
            numbers={selectedNumbers.map((n) => n.toString().padStart(raffle.numberDigits, '0'))}
            onPaymentConfirmed={(receiptCode) => {
              router.push(`/sucesso/${activePixOrder.orderId}?receipt=${receiptCode}`);
            }}
          />
        ) : (
          <>
            {/* 1. Hero do Prêmio */}
            <PrizeHero raffle={raffle} />

            {/* Banner de Consulta de Números pelo Telefone */}
            <MyNumbersButton raffleId={raffle.id} raffleSlug={raffle.slug} variant="banner" />

            {/* 2. Barra de Progresso Real */}
            <RaffleProgress
              totalNumbers={metrics.totalNumbers}
              paidNumbers={metrics.paidNumbers}
              percentagePaid={metrics.percentagePaid}
              reservedNumbers={metrics.reservedNumbers}
            />

            {/* 3. Seleção Rápida */}
            {raffle.allowRandomChoice && (
              <QuickNumberSelector
                onSelectRandom={handleSelectRandom}
                disabled={raffle.status !== 'active'}
              />
            )}

            {/* 4. Grid de Números */}
            <PublicNumberGrid
              numbers={numbers}
              selectedNumbers={selectedNumbers}
              onToggleNumber={handleToggleNumber}
              disabled={raffle.status !== 'active'}
            />

            {/* 5. Seção de Confiança e Suporte */}
            <TrustSection />
          </>
        )}
      </main>

      {/* Sticky Bottom Cart no Rodapé Mobile */}
      {!activePixOrder && (
        <SelectedNumbersBar
          selectedCount={selectedNumbers.length}
          totalAmountInCents={selectedNumbers.length * raffle.pricePerNumberInCents}
          onProceed={() => setIsDrawerOpen(true)}
          disabled={raffle.status !== 'active'}
        />
      )}

      {/* Drawer Modal de Checkout */}
      <CheckoutDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        raffleName={raffle.name}
        selectedNumbers={selectedNumbers}
        pricePerNumberInCents={raffle.pricePerNumberInCents}
        onSubmitCheckout={handleSubmitCheckout}
        isLoading={isSubmitting}
        errorMessage={checkoutError}
      />
    </div>
  );
}
