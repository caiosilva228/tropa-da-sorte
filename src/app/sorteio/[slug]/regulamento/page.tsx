import React from 'react';
import { Database } from '@/server/db';
import { TropaLogo } from '@/components/tropa/TropaLogo';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ShieldCheck, FileText } from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function RegulamentoPage({ params }: Props) {
  const { slug } = await params;
  const state = await Database.getState();
  const raffle = state.raffles.find((r) => r.slug === slug);

  if (!raffle) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#101214] text-white flex flex-col items-center px-4 py-8">
      <header className="mb-6">
        <TropaLogo />
      </header>

      <main className="w-full max-w-2xl bg-[#181B1F] border border-[#262A30] rounded-3xl p-6 sm:p-8 flex flex-col gap-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#262A30]">
          <div className="flex flex-col">
            <span className="text-xs uppercase font-bold text-[#16C784]">Tropa da Sorte</span>
            <h1 className="text-xl sm:text-2xl font-black text-white uppercase flex items-center gap-2">
              <FileText className="w-6 h-6 text-[#FFC928]" />
              <span>Regulamento Oficial da Ação</span>
            </h1>
          </div>

          <Link
            href={`/sorteio/${raffle.slug}`}
            className="py-2 px-3.5 rounded-xl border border-[#262A30] hover:border-gray-500 text-xs font-bold text-gray-300 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar à Ação</span>
          </Link>
        </div>

        <div className="flex flex-col gap-4 text-xs text-gray-300 leading-relaxed">
          <div className="p-4 rounded-xl bg-[#101214] border border-[#262A30] flex flex-col gap-1.5">
            <span className="font-bold text-white uppercase">Ação: {raffle.name}</span>
            <span>Prêmio Principal: <strong className="text-[#16C784]">{raffle.prizeName}</strong></span>
            <span>Total de Bolas Participantes: <strong>{raffle.totalNumbers.toLocaleString('pt-BR')}</strong></span>
            <span>Método de Apuração: <strong>{raffle.drawMethod.toUpperCase()} ({raffle.drawReference || '1º Prêmio da Loteria Federal'})</strong></span>
            <span>Tempo de Reserva Pix: <strong>{raffle.reservationMinutes} minutos</strong></span>
            <span>Limite por Pedido: <strong>{raffle.minNumbersPerOrder} a {raffle.maxNumbersPerOrder} cotas</strong></span>
          </div>

          {raffle.descriptionFull && (
            <div className="p-4 rounded-xl bg-[#101214] border border-[#16C784]/30 flex flex-col gap-2">
              <h3 className="text-sm font-bold text-[#16C784] uppercase">Regras Específicas desta Ação</h3>
              <p className="whitespace-pre-line text-xs text-gray-200 leading-relaxed">
                {raffle.descriptionFull}
              </p>
            </div>
          )}

          <h3 className="text-sm font-bold text-white uppercase">1. Da Participação</h3>
          <p>
            Qualquer pessoa física maior de 18 anos residente no território nacional pode participar desta ação numerada promovida pela Tropa da Sorte. Ao adquirir um ou mais números, o participante declara estar ciente e de acordo com todas as regras aqui dispostas.
          </p>

          <h3 className="text-sm font-bold text-white uppercase">2. Das Reservas e Pagamentos</h3>
          <p>
            A seleção dos números gera uma reserva temporária com prazo de {raffle.reservationMinutes} minutos para a conclusão do pagamento via Pix ou Cartão de Crédito processado pelo Mercado Pago. Findo o prazo sem confirmação bancária, os números retornam automaticamente ao status disponível.
          </p>

          <h3 className="text-sm font-bold text-white uppercase">3. Da Apuração do Ganhador</h3>
          <p>
            A definição do número vencedor ocorrerá com base no resultado oficial da extração da {raffle.drawMethod === 'loteria_federal' ? 'Loteria Federal' : raffle.drawMethod} indicada com ampla antecedência nos canais oficiais da Tropa da Sorte ({raffle.drawReference || '1º Prêmio'}). O resultado é auditável e público.
          </p>

          <h3 className="text-sm font-bold text-white uppercase">4. Da Entrega do Prêmio</h3>
          <p>
            O prêmio será entregue ao titular do pedido devidamente identificado pelo documento de identificação cadastrado no momento da compra, com frete e custos de transferência por conta do organizador.
          </p>
        </div>

        <div className="pt-4 border-t border-[#262A30] flex items-center justify-between text-[11px] text-gray-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#16C784]" />
            Ação regulamentada e transparente
          </span>
          <span>Tropa da Sorte © 2026</span>
        </div>
      </main>
    </div>
  );
}
