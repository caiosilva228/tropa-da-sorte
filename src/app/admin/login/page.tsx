'use client';

import React, { useState } from 'react';
import { TropaLogo } from '@/components/tropa/TropaLogo';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Loader2, AlertCircle } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@tropadasorte.com.br');
  const [password, setPassword] = useState('admin123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Credenciais inválidas.');
      }

      router.push('/admin');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na autenticação';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#101214] text-white flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm flex flex-col items-center gap-6">
        <TropaLogo />

        <div className="w-full bg-[#181B1F] border border-[#262A30] rounded-3xl p-6 sm:p-8 flex flex-col gap-5 shadow-2xl">
          <div className="flex flex-col text-center gap-1">
            <h1 className="text-xl font-black text-white uppercase">Área Administrativa</h1>
            <p className="text-xs text-gray-400">
              Entre com suas credenciais seguras de operador ou gestor.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-3.5">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">
                E-mail do Administrador
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#101214] border border-[#262A30] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#16C784]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">
                Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#101214] border border-[#262A30] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#16C784]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-[#16C784] hover:bg-[#12A66D] active:scale-[0.98] text-[#101214] font-black text-sm tracking-wide shadow-lg shadow-[#16C784]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#101214]" />
                  <span>ENTRANDO...</span>
                </>
              ) : (
                <span>ACESSAR PAINEL</span>
              )}
            </button>
          </form>

          <div className="p-2.5 rounded-xl bg-[#101214] border border-[#262A30]/60 text-[11px] text-gray-400 text-center">
            Acesso padrão de teste:<br />
            <strong className="text-gray-200">admin@tropadasorte.com.br</strong> / <strong className="text-gray-200">admin123456</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
