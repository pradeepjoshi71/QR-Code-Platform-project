'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Container } from '@/components/ui/Container';

interface BillingData {
  organizationId: string;
  organizationName: string;
  subscriptionStatus: 'FREE' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED';
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  isOwner: boolean;
}

const STATUS_BADGE_CONFIG: Record<
  string,
  { label: string; variant: 'brand' | 'neutral' | 'success' | 'warning' }
> = {
  FREE: { label: 'Free Tier', variant: 'neutral' },
  ACTIVE: { label: 'Pro Active', variant: 'success' },
  PAST_DUE: { label: 'Past Due', variant: 'warning' },
  CANCELED: { label: 'Canceled', variant: 'neutral' },
};

function BillingContent() {
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get('success') === 'true';
  const isCanceled = searchParams.get('canceled') === 'true';

  const [billing, setBilling] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchBilling = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch('/api/billing');
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to fetch billing status');
      }
      const data = await res.json();
      setBilling(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load billing information';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBilling();
  }, []);

  const handleUpgrade = async () => {
    try {
      setActionLoading(true);
      setErrorMsg(null);
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Checkout initiation failed');
      }
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned by server.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start checkout process.';
      setErrorMsg(message);
      setActionLoading(false);
    }
  };

  const handleManage = async () => {
    try {
      setActionLoading(true);
      setErrorMsg(null);
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Portal initiation failed');
      }
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No portal URL returned by server.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to open customer portal.';
      setErrorMsg(message);
      setActionLoading(false);
    }
  };

  const status = billing?.subscriptionStatus || 'FREE';
  const isOwner = billing?.isOwner ?? false;
  const statusBadge = STATUS_BADGE_CONFIG[status] || STATUS_BADGE_CONFIG.FREE;

  return (
    <Container size="lg">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Billing &amp; Subscriptions
              </h1>
              <Badge variant="brand" size="sm">
                QR-P7.1
              </Badge>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              Manage your workspace subscription plan, payment details, and billing portal.
            </p>
          </div>
        </div>

        {/* Status alerts from Stripe redirect */}
        {isSuccess && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-emerald-900">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="font-semibold text-sm text-emerald-900">
                  Subscription successfully activated!
                </p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Your workspace is now on the Pro plan. Changes may take a few moments to sync with the Stripe webhook.
                </p>
              </div>
            </div>
          </div>
        )}

        {isCanceled && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-amber-900">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-amber-600 mt-0.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <p className="font-semibold text-sm text-amber-900">
                  Checkout was canceled
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  No charges were made. You can restart the checkout session at any time.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Global error state */}
        {errorMsg && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-4 text-rose-900">
            <p className="text-sm font-semibold">{errorMsg}</p>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading ? (
          <Card className="p-8 text-center text-slate-500 text-sm">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-slate-200 rounded w-1/3 mx-auto" />
              <div className="h-4 bg-slate-100 rounded w-1/2 mx-auto" />
            </div>
          </Card>
        ) : (
          <>
            {/* Current Plan Overview Card */}
            <Card className="p-6 sm:p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-6 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Current Plan
                    </span>
                    <Badge variant={statusBadge.variant} size="sm">
                      {statusBadge.label}
                    </Badge>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mt-2">
                    {status === 'ACTIVE' ? 'Pro Subscription' : 'Free Tier Workspace'}
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    Workspace:{' '}
                    <span className="font-semibold text-slate-800">
                      {billing?.organizationName}
                    </span>
                    {' • '}Your role:{' '}
                    <span className="font-semibold text-slate-800">
                      {billing?.role}
                    </span>
                  </p>
                </div>

                {/* Primary Action Button */}
                <div className="flex flex-col items-start md:items-end gap-2">
                  {status === 'ACTIVE' ? (
                    isOwner ? (
                      <Button
                        variant="primary"
                        onClick={handleManage}
                        disabled={actionLoading}
                        className="w-full sm:w-auto"
                      >
                        {actionLoading ? 'Opening Portal...' : 'Manage subscription'}
                      </Button>
                    ) : (
                      <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                        Subscription managed by workspace owner.
                      </div>
                    )
                  ) : (
                    isOwner ? (
                      <Button
                        variant="primary"
                        onClick={handleUpgrade}
                        disabled={actionLoading}
                        className="w-full sm:w-auto"
                      >
                        {actionLoading ? 'Redirecting to Stripe...' : 'Upgrade to Pro'}
                      </Button>
                    ) : (
                      <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                        Only workspace owners can upgrade to Pro.
                      </div>
                    )
                  )}
                  {status === 'ACTIVE' && (
                    <span className="text-xs text-slate-400">
                      Invoices &amp; card updates via Stripe Customer Portal
                    </span>
                  )}
                </div>
              </div>

              {/* Status details grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Subscription Status
                  </p>
                  <p className="text-sm font-semibold text-slate-800 mt-1">
                    {status}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Stripe Customer ID
                  </p>
                  <p className="text-xs font-mono text-slate-700 mt-1 truncate">
                    {billing?.stripeCustomerId || 'None (created on checkout)'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Stripe Subscription ID
                  </p>
                  <p className="text-xs font-mono text-slate-700 mt-1 truncate">
                    {billing?.stripeSubscriptionId || 'None'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Plans Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Free Plan Specs */}
              <Card className={`p-6 ${status !== 'ACTIVE' ? 'ring-2 ring-indigo-600/20' : ''}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">Free Plan</h3>
                  <span className="text-sm font-medium text-slate-500">$0 / mo</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Ideal for getting started with static and standard dynamic QR codes.
                </p>

                <ul className="mt-6 space-y-3 text-sm text-slate-600">
                  <li className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Standard Static &amp; Dynamic QR generation</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>SVG / PNG downloads with custom branding</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Team invites &amp; role-based access</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-slate-400">
                    <svg className="w-4 h-4 text-slate-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Device &amp; OS-specific smart redirects</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-slate-400">
                    <svg className="w-4 h-4 text-slate-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Geographic country-based routing</span>
                  </li>
                </ul>
              </Card>

              {/* Pro Plan Specs */}
              <Card className={`p-6 border-indigo-200 bg-gradient-to-br from-white to-indigo-50/20 ${status === 'ACTIVE' ? 'ring-2 ring-indigo-600' : ''}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-indigo-900">Pro Plan</h3>
                    <span className="text-xs text-indigo-600 font-semibold uppercase tracking-wider">
                      Everything in Free + Advanced Tools
                    </span>
                  </div>
                  <Badge variant="brand" size="sm">
                    Recommended
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Full control with dynamic routing rules, telemetry, and priority performance.
                </p>

                <ul className="mt-6 space-y-3 text-sm text-slate-700">
                  <li className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-indigo-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span><strong>Unlimited</strong> Dynamic QR Codes</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-indigo-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span><strong>Device Routing:</strong> iOS, Android &amp; Desktop targeting</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-indigo-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span><strong>Geo Routing:</strong> Granular country-level redirects</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-indigo-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Full 30-day analytics charts &amp; scanner breakdown</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-indigo-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Priority webhook updates &amp; customer portal</span>
                  </li>
                </ul>

                {status !== 'ACTIVE' && isOwner && (
                  <div className="mt-6 pt-4 border-t border-indigo-100">
                    <Button
                      variant="primary"
                      onClick={handleUpgrade}
                      disabled={actionLoading}
                      className="w-full"
                    >
                      {actionLoading ? 'Redirecting to Stripe...' : 'Subscribe to Pro'}
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          </>
        )}
      </div>
    </Container>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <Container size="lg">
          <Card className="p-8 text-center text-slate-500 text-sm">
            Loading billing dashboard...
          </Card>
        </Container>
      }
    >
      <BillingContent />
    </Suspense>
  );
}
