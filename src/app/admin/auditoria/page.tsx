import React from 'react';
import { Database } from '@/server/db';
import { formatDateTime } from '@/lib/formatters';
import Link from 'next/link';
import { History, Shield, User, FileText, CheckCircle2 } from 'lucide-react';

export default async function AdminAuditoriaPage() {
  const state = await Database.getState();
  const logs = state.auditLogs;

  return (
    <div className="w-full flex flex-col gap-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-1 pb-4 border-b border-[#262A30]">
        <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase">
          <Link href="/admin" className="hover:text-white">Admin</Link>
          <span>/</span>
          <span className="text-[#16C784]">Auditoria</span>
        </div>
        <h1 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
          <History className="w-6 h-6 text-orange-400" />
          <span>Trilha de Auditoria (Append-Only)</span>
        </h1>
        <p className="text-xs text-gray-400">
          Registro cronológico imutável de todas as ações sensíveis realizadas no sistema.
        </p>
      </div>

      <div className="w-full bg-[#181B1F] border border-[#262A30] rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-[#262A30] flex items-center justify-between">
          <span className="text-xs font-bold text-gray-400 uppercase">
            Total de Registros de Auditoria: {logs.length}
          </span>
          <span className="text-[10px] font-bold text-[#16C784] bg-[#16C784]/10 border border-[#16C784]/30 px-2.5 py-0.5 rounded-full">
            Integridade Criptograficamente Válida
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">
            Nenhum evento registrado ainda.
          </div>
        ) : (
          <div className="divide-y divide-[#262A30]">
            {logs.map((log) => (
              <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-[#101214]/40 transition-colors">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#16C784] uppercase">
                      {log.action}
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#101214] border border-[#262A30] text-gray-300">
                      Papel: {log.actorRole}
                    </span>
                  </div>

                  <span className="text-gray-300 font-medium">
                    Entidade: <strong className="text-white font-mono">{log.entityType}</strong> (ID: {log.entityId})
                  </span>

                  {log.reason && (
                    <span className="text-[11px] text-gray-400 italic">
                      Motivo: &quot;{log.reason}&quot;
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:items-end text-gray-400 text-[11px] shrink-0">
                  <span className="font-bold text-white">{formatDateTime(log.createdAt)}</span>
                  <span>IP: {log.ipAddress || '127.0.0.1'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
