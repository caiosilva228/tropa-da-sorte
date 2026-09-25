import React from 'react';
import { getAdminSession } from '@/server/auth';
import { AdminLayoutShell } from '@/components/admin/AdminLayoutShell';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  return <AdminLayoutShell session={session}>{children}</AdminLayoutShell>;
}

