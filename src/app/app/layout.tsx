import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AppNavbar } from '@/components/layout/AppNavbar';
import { Providers } from '@/components/providers/SessionProvider';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/sign-in');
  }

  return (
    <Providers>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <AppNavbar />
        <main className="flex-1 py-8 sm:py-10">
          {children}
        </main>
      </div>
    </Providers>
  );
}
