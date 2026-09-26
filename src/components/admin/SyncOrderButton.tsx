'use client';

import React, { useState } from 'react';
import { RefreshCw, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SyncOrderButtonProps {
  orderId: string;
  orderPublicId: string;
}

export const SyncOrderButton: React.FC<SyncOrderButtonProps> = ({
  orderId,
  orderPublicId,
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [synced, setSynced] = useState(false);

  const handleSync = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/sync`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.status === 'paid') {
        setSynced(true);
        router.refresh();
      } else {
        alert(data.reconciled ? 'Pedido reconciliado!' : 'Status verificado no Mercado Pago: ' + (data.status || 'Pendente'));
        router.refresh();
      }
    } catch (err: unknown) {
      alert('Erro ao consultar Mercado Pago: ' + (err instanceof Error ? err.message : 'Falha na conexão'));
    } finally {
      setLoading(false);
    }
  };

  if (synced) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#16C784]">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Pago Confirmado!</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleSync}
      disabled={loading}
      className="py-1.5 px-3 rounded-lg border border-[#FFC928]/40 hover:border-[#FFC928] bg-[#FFC928]/10 hover:bg-[#FFC928]/20 text-[#FFC928] font-bold text-[11px] flex items-center gap-1.5 transition-all disabled:opacity-50"
      title="Consultar status deste pedido diretamente no Mercado Pago"
    >
      <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
      <span>{loading ? 'Consultando MP...' : 'Sincronizar MP'}</span>
    </button>
  );
};
