import React from 'react';
import { Database } from '@/server/db';
import { formatCentsToBRL, formatDateTime } from '@/lib/formatters';
import Link from 'next/link';
import { ShoppingCart, CheckCircle2, Clock, AlertTriangle, Download } from 'lucide-react';
import { SyncOrderButton } from '@/components/admin/SyncOrderButton';

export default async function AdminPedidosPage() {
  const state = await Database.getState();
  const orders = state.orders;

  return (
    <div className="w-full flex flex-col gap-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-1 pb-4 border-b border-[#262A30]">
        <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase">
          <Link href="/admin" className="hover:text-white">Admin</Link>
          <span>/</span>
          <span className="text-[#16C784]">Pedidos</span>
        </div>
        <h1 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-purple-400" />
          <span>Gestão de Pedidos</span>
        </h1>
      </div>

      <div className="w-full bg-[#181B1F] border border-[#262A30] rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-[#262A30] flex items-center justify-between">
          <span className="text-xs font-bold text-gray-400 uppercase">
            Total de Pedidos Registrados: {orders.length}
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">
            Nenhum pedido registrado ainda.
          </div>
        ) : (
          <div className="divide-y divide-[#262A30]">
            {orders.map((o) => {
              const customer = state.customers.find((c) => c.id === o.customerId);
              const isPaid = o.status === 'paid';
              const isAwaiting = o.status === 'awaiting_payment';

              return (
                <div key={o.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#101214]/40 transition-colors">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-bold text-white">#{o.publicId}</span>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          isPaid
                            ? 'bg-[#16C784]/15 text-[#16C784] border border-[#16C784]/30'
                            : isAwaiting
                            ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                            : 'bg-gray-800 text-gray-400'
                        }`}
                      >
                        {o.status}
                      </span>
                    </div>

                    <span className="text-xs text-gray-300 mt-1">
                      Cliente: <strong>{customer?.name || 'Não identificado'}</strong> ({customer?.phone || '—'})
                    </span>

                    <span className="text-[11px] text-gray-500">
                      Criado em: {formatDateTime(o.createdAt)} • Números: {o.numbers.join(', ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex flex-col sm:items-end">
                      <span className="text-xs font-black text-[#16C784]">
                        {formatCentsToBRL(o.totalAmountInCents)}
                      </span>
                      <span className="text-[10px] text-gray-400 uppercase">
                        {o.paymentMethod || 'Pix'}
                      </span>
                    </div>

                    {!isPaid && (
                      <SyncOrderButton orderId={o.id} orderPublicId={o.publicId} />
                    )}

                    {isPaid && (
                      <a
                        href={`/api/receipts/${o.id}/pdf`}
                        download
                        title="Baixar Comprovante PDF"
                        className="p-2 rounded-xl bg-[#101214] border border-[#262A30] text-gray-400 hover:text-white transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
