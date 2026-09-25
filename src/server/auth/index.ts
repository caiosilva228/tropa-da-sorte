import { Database } from '@/server/db';
import { AdminRole, AdminUser } from '@/types';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET_STRING = process.env.ADMIN_JWT_SECRET || 'tropa-da-sorte-dev-super-secure-jwt-secret-key-32-chars';
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);
const COOKIE_NAME = 'tropa_admin_token';

export interface AdminSession {
  userId: string;
  name: string;
  email: string;
  role: AdminRole;
}

export async function createAdminToken(session: AdminSession): Promise<string> {
  return await new SignJWT({ ...session })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
}

export async function verifyAdminToken(token: string): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      name: payload.name as string,
      email: payload.email as string,
      role: payload.role as AdminRole,
    };
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifyAdminToken(token);
}

export async function loginAdmin(email: string, passwordPlain: string): Promise<{ success: boolean; session?: AdminSession; token?: string; error?: string }> {
  const state = await Database.getState();
  const admin = state.admins.find((a) => a.email.toLowerCase() === email.toLowerCase());

  if (!admin || !admin.isActive) {
    return { success: false, error: 'Credenciais inválidas ou usuário inativo.' };
  }

  const isPasswordValid = await bcrypt.compare(passwordPlain, admin.passwordHash);
  if (!isPasswordValid) {
    return { success: false, error: 'Credenciais inválidas.' };
  }

  const session: AdminSession = {
    userId: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
  };

  const token = await createAdminToken(session);

  // Registrar login em audit log
  await Database.transaction(async (db) => {
    db.auditLogs.unshift({
      id: `log-${Date.now()}`,
      actorId: admin.id,
      actorRole: admin.role,
      action: 'admin_login',
      entityType: 'admin',
      entityId: admin.id,
      oldValue: null,
      newValue: { email: admin.email },
      reason: 'Login realizado com sucesso',
      ipAddress: '127.0.0.1',
      userAgent: 'NextJS Server',
      createdAt: new Date().toISOString(),
    });
  });

  return { success: true, session, token };
}

export async function requireAdminRole(allowedRoles: AdminRole[]): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    throw new Error('UNAUTHORIZED: Sessão administrativa necessária');
  }
  if (!allowedRoles.includes(session.role)) {
    throw new Error(`FORBIDDEN: O papel ${session.role} não tem permissão para esta ação`);
  }
  return session;
}
