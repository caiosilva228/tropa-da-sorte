import React from 'react';
import { Database } from '@/server/db';
import { formatCentsToBRL, formatDateTime, formatPhone } from '@/lib/formatters';
import Link from 'next/link';
import { Users, Mail, Phone, ShoppingCart } from 'lucide-react';

export default async function AdminClientesPage() {
  const state = await Database.getState();
  const customers = state.customers;

  return (
    <div className="w-full flex flex-col gap-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-1 pb-4 border-b border-[#262A30]">
        <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase">
          <Link href="/admin" className="hover:text-white">Admin</Link>
          <span>/</span>
          <span className="text-[#16C784]">Clientes</span>
        </div>
        <h1 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-400" />
          <span>Gestão de Compradores</span>
        </h1>
      </div>

      <div className="w-full bg-[#181B1F] border border-[#262A30] rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-[#262A30] flex items-center justify-between">
          <span className="text-xs font-bold text-gray-400 uppercase">
            Total de Compradores Registrados: {customers.length}
          </span>
        </div>

        {customers.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">
            Nenhum comprador registrado ainda.
          </div>
        ) : (
          <div className="divide-y divide-[#262A30]">
            {customers.map((c) => {
              const customerOrders = state.orders.filter((o) => o.customerId === c.id);
              const totalSpent = customerOrders
                .filter((o) => o.status === 'paid')
                .reduce((acc, o) => acc + o.totalAmountInCents, 0);

              return (
                <div key={c.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#101214]/40 transition-colors">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white">{c.name}</span>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-gray-500" />
                        {formatPhone(c.phone)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-gray-500" />
                        {c.email}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex flex-col sm:items-end">
                      <span className="text-gray-400">Total Investido:</span>
                      <span className="font-bold text-[#16C784]">
                        {formatCentsToBRL(totalSpent)}
                      </span>
                    </div>

                    <div className="flex flex-col sm:items-end">
                      <span className="text-gray-400">Pedidos:</span>
                      <span className="font-bold text-white flex items-center gap-1">
                        <ShoppingCart className="w-3.5 h-3.5 text-gray-400" />
                        {customerOrders.length}
                      </span>
                    </div>
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
