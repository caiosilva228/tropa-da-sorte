'use client';

import React, { useState, useMemo } from 'react';
import { RaffleNumber, Order } from '@/types';
import { formatDateTime } from '@/lib/formatters';
import { Search, Check, Lock, Clock, X, AlertCircle, ShieldCheck, User, Phone, Mail, FileText, CheckCircle2 } from 'lucide-react';

import { useRouter } from 'next/navigation';

interface NumberMapGridProps {
  raffleId: string;
  numbers: RaffleNumber[];
  orders: Order[];
  onRefresh?: () => void;
}

export const NumberMapGrid: React.FC<NumberMapGridProps> = ({
  raffleId,
  numbers,
  orders,
  onRefresh,
}) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'paid' | 'reserved' | 'pending' | 'blocked'>('all');
  const [selectedNumberDetail, setSelectedNumberDetail] = useState<RaffleNumber | null>(null);

  // Estados de Modais de Ação
  const [isManualReserveOpen, setIsManualReserveOpen] = useState(false);
  const [isManualPayOpen, setIsManualPayOpen] = useState(false);

  // Formulário de Reserva Manual
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [manualNeverExpires, setManualNeverExpires] = useState(false);

  // Formulário de Pagamento Manual
  const [payMethod, setPayMethod] = useState<'pix_externo' | 'dinheiro' | 'transferencia' | 'outro'>('pix_externo');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Filtragem dos números
  const filtered = useMemo(() => {
    return numbers.filter((n) => {
      if (statusFilter === 'available' && n.status !== 'available') return false;
      if (statusFilter === 'paid' && n.status !== 'paid') return false;
      if (statusFilter === 'reserved' && n.status !== 'reserved_manual') return false;
      if (statusFilter === 'pending' && n.status !== 'pending_payment') return false;
      if (statusFilter === 'blocked' && n.status !== 'blocked') return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchesNum = n.formattedNumber.includes(term) || n.number.toString().includes(term);
        const matchesClient = n.customerName?.toLowerCase().includes(term);
        return matchesNum || matchesClient;
      }
      return true;
    });
  }, [numbers, statusFilter, searchTerm]);

  // Localizar pedido relacionado ao número selecionado no drawer
  const relatedOrder = useMemo(() => {
    if (!selectedNumberDetail?.orderId) return null;
    return orders.find((o) => o.id === selectedNumberDetail.orderId) || null;
  }, [selectedNumberDetail, orders]);

  // Executar Reserva Manual
  const handleSaveManualReserve = async () => {
    if (!selectedNumberDetail) return;
    setActionLoading(true);
    setActionError(null);

    try {
      const res = await fetch('/api/admin/manual-reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raffleId,
          numbers: [selectedNumberDetail.number],
          customerName: manualName || 'Cliente Balcão',
          customerPhone: manualPhone || '11999999999',
          notes: manualNotes,
          neverExpires: manualNeverExpires,
          durationMinutes: 60,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao reservar número');

      setIsManualReserveOpen(false);
      setSelectedNumberDetail(null);
      onRefresh?.();
      router.refresh();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Falha na reserva');
    } finally {
      setActionLoading(false);
    }
  };

  // Executar Confirmação Manual de Pagamento
  const handleConfirmManualPayment = async () => {
    if (!selectedNumberDetail) return;
    setActionLoading(true);
    setActionError(null);

    try {
      // Se não tiver orderId, precisamos de uma ordem para o pagamento manual
      const orderIdToConfirm = selectedNumberDetail.orderId || relatedOrder?.id;

      if (!orderIdToConfirm) {
        throw new Error('Não há pedido associado a este número. Faça uma reserva antes de confirmar o pagamento.');
      }

      const res = await fetch('/api/admin/manual-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderIdToConfirm,
          paymentMethod: payMethod,
          referenceCode: payRef || 'COMPROVANTE-MANUAL',
          notes: payNotes || 'Pagamento confirmado manualmente pelo administrador',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao confirmar pagamento');

      setIsManualPayOpen(false);
      setSelectedNumberDetail(null);
      onRefresh?.();
      router.refresh();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Falha ao confirmar');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Controles de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="🔎 Buscar número (ex: 007), cliente ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#181B1F] border border-[#262A30] rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#16C784]"
          />
        </div>

        {/* Abas de Status */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-[#181B1F] rounded-xl border border-[#262A30] text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
              statusFilter === 'all' ? 'bg-[#262A30] text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Todos ({numbers.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('available')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
              statusFilter === 'available' ? 'bg-[#181B1F] text-white border border-[#262A30]' : 'text-gray-400 hover:text-white'
            }`}
          >
            Disponíveis
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('paid')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
              statusFilter === 'paid' ? 'bg-[#16C784] text-[#101214]' : 'text-gray-400 hover:text-white'
            }`}
          >
            Pagos
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('reserved')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
              statusFilter === 'reserved' ? 'bg-[#FFC928] text-[#101214]' : 'text-gray-400 hover:text-white'
            }`}
          >
            Reservados
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
              statusFilter === 'pending' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Pendentes
          </button>
        </div>
      </div>

      {/* Legenda Fixa no Topo */}
      <div className="flex flex-wrap items-center gap-4 p-3 bg-[#181B1F] rounded-xl border border-[#262A30] text-xs text-gray-400">
        <span className="font-bold text-white uppercase text-[10px]">Legenda:</span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#101214] border border-[#262A30]" />
          Disponível
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#16C784]" />
          Pago
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#FFC928]" />
          Reservado Manual
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-orange-500" />
          Aguardando Pagamento
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-600" />
          Bloqueado
        </span>
      </div>

      {/* Grid Interativo do Mapa de Números */}
      <div className="w-full bg-[#181B1F] border border-[#262A30] rounded-2xl p-4 sm:p-5">
        <div className="grid grid-cols-5 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-16 gap-1.5 max-h-[600px] overflow-y-auto pr-1">
          {filtered.map((item) => {
            const isPaid = item.status === 'paid';
            const isReserved = item.status === 'reserved_manual';
            const isPending = item.status === 'pending_payment';
            const isBlocked = item.status === 'blocked';

            let cellClass = 'bg-[#101214] text-gray-300 border-[#262A30] hover:border-[#16C784]';

            if (isPaid) {
              cellClass = 'bg-[#16C784] text-[#101214] font-black border-[#16C784] shadow-sm';
            } else if (isReserved) {
              cellClass = 'bg-[#FFC928] text-[#101214] font-bold border-[#FFC928]';
            } else if (isPending) {
              cellClass = 'bg-orange-500/20 text-orange-300 border-orange-500/50';
            } else if (isBlocked) {
              cellClass = 'bg-red-950/40 text-red-400 border-red-500/40';
            }

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedNumberDetail(item)}
                className={`aspect-square flex items-center justify-center p-1 rounded-lg border text-xs font-mono font-bold transition-all active:scale-95 cursor-pointer ${cellClass}`}
                title={`Número ${item.formattedNumber} - ${item.status}`}
              >
                {item.formattedNumber}
              </button>
            );
          })}
        </div>
      </div>

      {/* DRAWER LATERAL DE DETALHES DO NÚMERO */}
      {selectedNumberDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/75 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full sm:max-w-md h-full sm:h-auto max-h-screen sm:max-h-[92vh] bg-[#181B1F] border border-[#262A30] rounded-none sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header do Drawer */}
            <div className="flex items-center justify-between p-5 border-b border-[#262A30]">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl font-black font-mono text-[#16C784]">
                  #{selectedNumberDetail.formattedNumber}
                </span>
                <span className="text-xs uppercase font-bold px-2 py-0.5 rounded-full bg-[#101214] border border-[#262A30] text-gray-300">
                  {selectedNumberDetail.status}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNumberDetail(null)}
                className="w-8 h-8 rounded-full bg-[#101214] border border-[#262A30] flex items-center justify-center text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Informações do Comprador / Pedido */}
            <div className="p-5 overflow-y-auto flex flex-col gap-4 flex-1">
              {actionError && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-200">
                  {actionError}
                </div>
              )}

              <div className="p-4 rounded-xl bg-[#101214] border border-[#262A30] flex flex-col gap-2.5 text-xs">
                <div className="flex items-center gap-2 text-gray-300">
                  <User className="w-4 h-4 text-gray-500" />
                  <span>Cliente:</span>
                  <strong className="text-white ml-auto">
                    {selectedNumberDetail.customerName || relatedOrder?.customer?.name || 'Não vinculado'}
                  </strong>
                </div>

                <div className="flex items-center gap-2 text-gray-300">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span>WhatsApp:</span>
                  <strong className="text-white ml-auto">
                    {relatedOrder?.customer?.phone || '—'}
                  </strong>
                </div>

                <div className="flex items-center gap-2 text-gray-300">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span>E-mail:</span>
                  <strong className="text-white ml-auto">
                    {relatedOrder?.customer?.email || '—'}
                  </strong>
                </div>

                <div className="flex items-center gap-2 text-gray-300">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span>Pedido:</span>
                  <strong className="text-white font-mono ml-auto">
                    {relatedOrder ? `#${relatedOrder.publicId}` : '—'}
                  </strong>
                </div>

                <div className="flex items-center gap-2 text-gray-300">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span>Data da Ação:</span>
                  <strong className="text-white ml-auto">
                    {formatDateTime(selectedNumberDetail.paidAt || selectedNumberDetail.reservedAt)}
                  </strong>
                </div>
              </div>

              {/* Botões de Ações Administrativas */}
              <div className="flex flex-col gap-2 pt-2">
                <span className="text-xs uppercase font-bold text-gray-400">
                  Ações do Operador:
                </span>

                {selectedNumberDetail.status === 'available' && (
                  <button
                    type="button"
                    onClick={() => setIsManualReserveOpen(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#FFC928] hover:bg-[#E5B21F] text-[#101214] font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>RESERVAR MANUALMENTE</span>
                  </button>
                )}

                {(selectedNumberDetail.status === 'reserved_manual' || selectedNumberDetail.status === 'pending_payment') && (
                  <button
                    type="button"
                    onClick={() => setIsManualPayOpen(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#16C784] hover:bg-[#12A66D] text-[#101214] font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>MARCAR COMO PAGO MANUALMENTE</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE RESERVA MANUAL */}
      {isManualReserveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-sm bg-[#181B1F] border border-[#262A30] rounded-2xl p-5 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#262A30]">
              <h3 className="text-sm font-black text-white uppercase">
                Reserva Manual - #{selectedNumberDetail?.formattedNumber}
              </h3>
              <button
                type="button"
                onClick={() => setIsManualReserveOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">Nome do Cliente *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Oliveira"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full bg-[#101214] border border-[#262A30] rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">WhatsApp / Telefone</label>
                <input
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  className="w-full bg-[#101214] border border-[#262A30] rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">Observações</label>
                <input
                  type="text"
                  placeholder="Ex: Cliente vai pagar no balcão"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-full bg-[#101214] border border-[#262A30] rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="never-expires"
                  checked={manualNeverExpires}
                  onChange={(e) => setManualNeverExpires(e.target.checked)}
                  className="rounded text-[#16C784] focus:ring-0"
                />
                <label htmlFor="never-expires" className="text-xs text-gray-300">
                  Reserva sem expiração (até liberação manual)
                </label>
              </div>

              <button
                type="button"
                disabled={actionLoading}
                onClick={handleSaveManualReserve}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#FFC928] hover:bg-[#E5B21F] text-[#101214] font-black text-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? 'Salvando...' : 'Salvar Reserva Manual'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO MANUAL DE PAGAMENTO */}
      {isManualPayOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-sm bg-[#181B1F] border border-[#262A30] rounded-2xl p-5 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#262A30]">
              <h3 className="text-sm font-black text-white uppercase flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#16C784]" />
                <span>Confirmar Pagamento Manual?</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsManualPayOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Esta ação registrará o pagamento definitivo do número e emitirá um comprovante auditável.
            </p>

            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">Forma de Pagamento</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="w-full bg-[#101214] border border-[#262A30] rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="pix_externo">Pix Externo</option>
                  <option value="dinheiro">Dinheiro em Espécie</option>
                  <option value="transferencia">Transferência Bancária</option>
                  <option value="outro">Outro Meio</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">Código de Referência / Comprovante *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: DOC-998811"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full bg-[#101214] border border-[#262A30] rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">Justificativa / Motivo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Recebido em mãos pelo operador"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full bg-[#101214] border border-[#262A30] rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmManualPayment}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#16C784] hover:bg-[#12A66D] text-[#101214] font-black text-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? 'Confirmando...' : 'Confirmar e Emitir Comprovante'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
