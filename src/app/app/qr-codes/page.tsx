import React from 'react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { QrCodesManager } from '@/components/qr/QrCodesManager';

export default async function QrCodesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/sign-in?callbackUrl=/app/qr-codes');
  }

  return <QrCodesManager />;
}
