import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete('tropa_admin_token');

  // Redireciona para /admin/login tanto para navegações de formulário quanto para chamadas diretas
  const acceptHeader = request.headers.get('accept') || '';
  if (acceptHeader.includes('text/html')) {
    const url = new URL('/admin/login', request.url);
    return NextResponse.redirect(url, { status: 303 });
  }

  return NextResponse.json({ success: true, redirectUrl: '/admin/login' });
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete('tropa_admin_token');
  const url = new URL('/admin/login', request.url);
  return NextResponse.redirect(url, { status: 303 });
}
