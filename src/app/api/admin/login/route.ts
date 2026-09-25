import { loginAdmin } from '@/server/auth';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'E-mail e senha são obrigatórios.' }, { status: 400 });
    }

    const result = await loginAdmin(email, password);
    if (!result.success || !result.token) {
      return NextResponse.json({ error: result.error || 'Credenciais inválidas.' }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.set('tropa_admin_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 horas
    });

    return NextResponse.json({
      success: true,
      user: result.session,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao autenticar';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
