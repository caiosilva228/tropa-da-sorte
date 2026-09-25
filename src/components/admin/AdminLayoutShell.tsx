'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { TropaLogo } from '@/components/tropa/TropaLogo';
import Link from 'next/link';
import { LayoutDashboard, FolderKanban, Users, ShoppingCart, History, LogOut } from 'lucide-react';
import { AdminSession } from '@/server/auth';

interface AdminLayoutShellProps {
  session: AdminSession | null;
  children: React.ReactNode;
}

export function AdminLayoutShell({ session, children }: AdminLayoutShellProps) {
  const pathname = usePathname();

  // Na página de login, NUNCA renderizar a barra lateral
  if (pathname === '/admin/login') {
    return <div className="min-h-screen bg-[#101214] text-white">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-[#101214] text-white flex flex-col md:flex-row">
      {/* Sidebar Desktop */}
      <aside className="w-full md:w-64 bg-[#181B1F] border-b md:border-b-0 md:border-r border-[#262A30] flex flex-col shrink-0">
        <div className="p-4 border-b border-[#262A30] flex items-center justify-between">
          <TropaLogo compact />
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#16C784]/15 border border-[#16C784]/30 text-[#16C784]">
            {session?.role || 'ADMIN'}
          </span>
        </div>

        <nav className="p-3 flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible flex-1">
          <Link
            href="/admin"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors whitespace-nowrap ${
              pathname === '/admin' ? 'bg-[#101214] text-white border border-[#262A30]' : 'text-gray-400 hover:text-white hover:bg-[#101214]/60'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-[#16C784]" />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-[#101214]/60 transition-colors whitespace-nowrap"
          >
            <FolderKanban className="w-4 h-4 text-[#FFC928]" />
            <span>Pastas de Sorteios</span>
          </Link>

          <Link
            href="/admin/clientes"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors whitespace-nowrap ${
              pathname === '/admin/clientes' ? 'bg-[#101214] text-white border border-[#262A30]' : 'text-gray-400 hover:text-white hover:bg-[#101214]/60'
            }`}
          >
            <Users className="w-4 h-4 text-blue-400" />
            <span>Clientes</span>
          </Link>

          <Link
            href="/admin/pedidos"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors whitespace-nowrap ${
              pathname === '/admin/pedidos' ? 'bg-[#101214] text-white border border-[#262A30]' : 'text-gray-400 hover:text-white hover:bg-[#101214]/60'
            }`}
          >
            <ShoppingCart className="w-4 h-4 text-purple-400" />
            <span>Pedidos</span>
          </Link>

          <Link
            href="/admin/auditoria"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors whitespace-nowrap ${
              pathname === '/admin/auditoria' ? 'bg-[#101214] text-white border border-[#262A30]' : 'text-gray-400 hover:text-white hover:bg-[#101214]/60'
            }`}
          >
            <History className="w-4 h-4 text-orange-400" />
            <span>Auditoria</span>
          </Link>
        </nav>

        {/* Rodapé da Sidebar com Logout */}
        <div className="p-3 border-t border-[#262A30] hidden md:flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white truncate max-w-[140px]">
              {session?.name || 'Administrador'}
            </span>
            <span className="text-[10px] text-gray-400 truncate max-w-[140px]">
              {session?.email || 'admin@tropadasorte.com.br'}
            </span>
          </div>

          <form action="/api/admin/logout" method="POST">
            <button
              type="submit"
              title="Sair"
              className="p-2 rounded-xl text-gray-400 hover:text-[#EF4444] hover:bg-[#101214] transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </aside>

      {/* Conteúdo Principal do Painel */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
