'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Badge } from '@/components/ui/Badge';

interface InviteDetails {
  email: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  orgName: string;
  invitedBy: string;
  expiresAt: string;
}

// ─── Inner component that uses useSearchParams (must be inside <Suspense>) ───
function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const { data: session, status: sessionStatus } = useSession();

  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ orgName: string; orgId: string; role: string } | null>(null);

  // Load invite details
  useEffect(() => {
    if (!token) {
      setLoadError('No invite token found in the URL.');
      return;
    }

    fetch(`/api/invites/accept?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setLoadError(data.error || 'Could not load invite.');
        } else {
          setInvite(data);
        }
      })
      .catch(() => setLoadError('Network error loading invite.'));
  }, [token]);

  // If not signed in, redirect to sign-in with callbackUrl preserving the token
  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (sessionStatus === 'unauthenticated' && token) {
      const callbackUrl = encodeURIComponent(`/invites/accept?token=${token}`);
      router.push(`/sign-in?callbackUrl=${callbackUrl}`);
    }
  }, [sessionStatus, token, router]);

  const handleAccept = async () => {
    setAcceptError(null);
    setAccepting(true);
    try {
      const res = await fetch('/api/invites/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAcceptError(data.error || 'Failed to accept invitation.');
      } else {
        setSuccess({ orgName: data.orgName, orgId: data.orgId, role: data.role });
      }
    } catch {
      setAcceptError('Network error. Please try again.');
    } finally {
      setAccepting(false);
    }
  };

  // ── Loading session ──
  if (sessionStatus === 'loading' || (sessionStatus === 'unauthenticated' && token)) {
    return (
      <div className="p-12 text-center text-slate-500 text-sm">Redirecting to sign-in…</div>
    );
  }

  // ── No token ──
  if (!token) {
    return (
      <Card className="p-10 text-center space-y-4">
        <p className="text-sm font-medium text-rose-600">No invite token found in the URL.</p>
        <Button href="/" variant="outline" size="sm">← Go home</Button>
      </Card>
    );
  }

  // ── Invite load error ──
  if (loadError) {
    return (
      <Card className="p-10 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 mx-auto flex items-center justify-center">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-slate-800">{loadError}</p>
        <Button href="/" variant="outline" size="sm">← Go home</Button>
      </Card>
    );
  }

  // ── Still loading invite ──
  if (!invite) {
    return <div className="p-12 text-center text-slate-500 text-sm">Loading invite…</div>;
  }

  // ── Success state ──
  if (success) {
    return (
      <Card className="p-10 text-center space-y-5">
        <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-900">Welcome to {success.orgName}!</h2>
          <p className="text-sm text-slate-500">
            You&apos;ve joined as{' '}
            <span className="font-semibold capitalize">{success.role.toLowerCase()}</span>.
          </p>
        </div>
        <Button href="/app" variant="primary" size="md">
          Go to Dashboard →
        </Button>
      </Card>
    );
  }

  // ── Main accept UI ──
  const roleVariantMap: Record<string, 'brand' | 'neutral' | 'warning'> = {
    OWNER: 'warning',
    ADMIN: 'brand',
    MEMBER: 'neutral',
  };

  return (
    <Card className="p-8 sm:p-10 space-y-6">
      {/* Org icon + name */}
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white mx-auto flex items-center justify-center text-xl font-extrabold">
          {invite.orgName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Join {invite.orgName}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {invite.invitedBy} invited you to collaborate
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="bg-slate-50 rounded-xl p-4 space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium">Invited email</span>
          <span className="font-mono text-slate-800 text-xs">{invite.email}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium">Role</span>
          <Badge variant={roleVariantMap[invite.role] ?? 'neutral'} size="sm">
            {invite.role}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium">Expires</span>
          <span className="text-slate-700 text-xs">
            {new Date(invite.expiresAt).toLocaleDateString(undefined, {
              month: 'short', day: 'numeric', year: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* Signed-in as mismatch warning */}
      {session?.user?.email &&
        session.user.email.toLowerCase() !== invite.email.toLowerCase() && (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
            ⚠ You&apos;re signed in as <strong>{session.user.email}</strong>, but this invite
            is for <strong>{invite.email}</strong>. Sign in with the correct account to accept.
          </div>
        )}

      {acceptError && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          {acceptError}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={handleAccept}
          disabled={accepting}
          className="w-full"
        >
          {accepting ? 'Accepting…' : `Accept & Join ${invite.orgName}`}
        </Button>
        <Button href="/" variant="ghost" size="sm" className="w-full text-slate-500">
          Decline
        </Button>
      </div>
    </Card>
  );
}

// ─── Outer page — wraps inner in Suspense (required for useSearchParams) ──────
export default function AcceptInvitePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-12 px-4">
      <Container size="sm">
        <div className="space-y-6">
          {/* Logo header */}
          <div className="text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-indigo-600 font-bold text-lg"
            >
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
              </svg>
              QR Platform
            </Link>
          </div>

          <Suspense
            fallback={
              <Card className="p-10 flex items-center justify-center min-h-[200px]">
                <div className="text-slate-500 text-sm font-medium">Loading invite…</div>
              </Card>
            }
          >
            <AcceptInviteContent />
          </Suspense>
        </div>
      </Container>
    </div>
  );
}
