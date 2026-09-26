import React from 'react';
import { Database } from '@/server/db';
import { TropaLogo } from '@/components/tropa/TropaLogo';
import { formatCentsToBRL } from '@/lib/formatters';
import Link from 'next/link';
import { ArrowRight, Flame, ShieldCheck, Sparkles, Trophy } from 'lucide-react';
import { MyNumbersButton } from '@/components/tropa/MyNumbersButton';

export default async function HomePage() {
  const state = await Database.getState();
  const activeRaffles = state.raffles.filter((r) => r.status === 'active');
  const primaryRaffle = activeRaffles[0] || state.raffles[0];

  return (
    <div className="min-h-screen bg-[#101214] text-white flex flex-col">
      {/* Header Fixo */}
      <header className="sticky top-0 z-40 w-full bg-[#101214]/90 backdrop-blur-md border-b border-[#262A30] py-3 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <TropaLogo />

          <div className="flex items-center gap-2">
            <MyNumbersButton variant="header" />

            <Link
              href="/admin/login"
              className="text-xs font-bold text-gray-400 hover:text-white px-3 py-1.5 rounded-lg border border-[#262A30] bg-[#181B1F] transition-colors"
            >
              Painel Admin
            </Link>
          </div>
        </div>
      </header>


      {/* Hero da Página Inicial */}
      <main className="w-full max-w-4xl mx-auto px-4 py-8 flex flex-col gap-8 flex-1">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#16C784]/10 border border-[#16C784]/30 text-xs font-black text-[#16C784] uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sua chance tá num número 🍀</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase max-w-2xl">
            A PLATAFORMA OFICIAL DE PRÊMIOS DA <span className="text-[#16C784]">TROPA DA SORTE</span>
          </h1>

          <p className="text-sm sm:text-base text-gray-400 max-w-xl">
            Escolha seus números da sorte, pague via Pix instantâneo pelo Mercado Pago e receba seu comprovante auditado na hora.
          </p>
        </div>

        {/* Destaque do Sorteio Principal */}
        {primaryRaffle && (
          <div className="w-full bg-[#181B1F] border border-[#262A30] rounded-3xl p-5 sm:p-7 flex flex-col md:flex-row gap-6 items-center shadow-2xl relative overflow-hidden group hover:border-[#16C784]/50 transition-all">
            <div className="w-full md:w-1/2 aspect-[16/9] rounded-2xl overflow-hidden bg-[#101214] relative">
              {primaryRaffle.bannerDesktopUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={primaryRaffle.bannerDesktopUrl}
                  alt={primaryRaffle.prizeName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Trophy className="w-16 h-16 text-[#FFC928]" />
                </div>
              )}
              <div className="absolute top-3 left-3 bg-[#101214]/90 backdrop-blur-md px-3 py-1 rounded-full border border-[#FFC928]/40 text-[10px] font-black uppercase text-[#FFC928] flex items-center gap-1">
                <Flame className="w-3 h-3" />
                <span>AÇÃO PRINCIPAL</span>
              </div>
            </div>

            <div className="w-full md:w-1/2 flex flex-col gap-3">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#16C784] uppercase tracking-wider">
                  Prêmio da Vez
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white uppercase">
                  {primaryRaffle.prizeName}
                </h2>
              </div>

              <p className="text-xs text-gray-400 line-clamp-2">
                {primaryRaffle.descriptionShort || 'Participe agora mesmo e garanta sua chance de ganhar!'}
              </p>

              <div className="flex items-baseline gap-2 py-1">
                <span className="text-xs text-gray-400">Por apenas</span>
                <span className="text-2xl font-black text-[#16C784]">
                  {formatCentsToBRL(primaryRaffle.pricePerNumberInCents)}
                </span>
                <span className="text-xs text-gray-400">cada número</span>
              </div>

              <Link
                href={`/sorteio/${primaryRaffle.slug}`}
                className="w-full py-3.5 px-6 rounded-xl bg-[#16C784] hover:bg-[#12A66D] active:scale-[0.98] text-[#101214] font-black text-sm tracking-wide shadow-lg shadow-[#16C784]/25 transition-all flex items-center justify-center gap-2"
              >
                <span>ESCOLHER MEUS NÚMEROS</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </Link>
            </div>
          </div>
        )}

        {/* Lista de Outras Campanhas Disponíveis */}
        {state.raffles.length > 1 && (
          <div className="flex flex-col gap-4 pt-4">
            <h2 className="text-xl font-black uppercase text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-[#FFC928]" />
              <span>OUTROS SORTEIOS DA TROPA</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {state.raffles.slice(1).map((r) => (
                <Link
                  key={r.id}
                  href={`/sorteio/${r.slug}`}
                  className="p-4 rounded-2xl bg-[#181B1F] border border-[#262A30] hover:border-[#16C784] transition-all flex items-center justify-between"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-white">{r.name}</span>
                    <span className="text-xs text-[#16C784] font-bold">
                      {formatCentsToBRL(r.pricePerNumberInCents)} por número
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Card de Atalho para Verificar Números */}
        <MyNumbersButton variant="card" />

        {/* Pilares de Transparência */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-[#262A30]">
          <div className="p-4 rounded-2xl bg-[#181B1F] border border-[#262A30] flex flex-col gap-1.5">
            <ShieldCheck className="w-5 h-5 text-[#16C784]" />
            <span className="text-xs font-bold text-white">Pagamento Seguro</span>
            <span className="text-[11px] text-gray-400">Processado via Checkout Transparente do Mercado Pago com Pix imediato.</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#181B1F] border border-[#262A30] flex flex-col gap-1.5">
            <Trophy className="w-5 h-5 text-[#FFC928]" />
            <span className="text-xs font-bold text-white">Sorteio Auditável</span>
            <span className="text-[11px] text-gray-400">Apuração transparente baseada na Loteria Federal ou método oficial registrado.</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#181B1F] border border-[#262A30] flex flex-col gap-1.5">
            <Sparkles className="w-5 h-5 text-[#16C784]" />
            <span className="text-xs font-bold text-white">Comprovante na Hora</span>
            <span className="text-[11px] text-gray-400">Emissão de comprovante em PDF com código de verificação público.</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[#262A30] py-6 px-4 bg-[#101214] text-center text-xs text-gray-500">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>© 2026 Tropa da Sorte. Todos os direitos reservados.</span>
          <div className="flex items-center gap-4 text-gray-400">
            <Link href="/" className="hover:text-white">Início</Link>
            <Link href="/verificar/RCPT-F8K2-X7P9" className="hover:text-white">Verificar Comprovante</Link>
            <Link href="/admin/login" className="hover:text-white">Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
