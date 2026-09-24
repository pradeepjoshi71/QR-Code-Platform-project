'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Container } from '@/components/ui/Container';
import { CreateQrModal } from '@/components/qr/CreateQrModal';
import { EditQrModal } from '@/components/qr/EditQrModal';
import { QrPreviewModal } from '@/components/qr/QrPreviewModal';

export interface CampaignSummary {
  id: string;
  name: string;
}

export interface QrCodeItem {
  id: string;
  organizationId: string;
  name: string;
  type: 'STATIC' | 'DYNAMIC';
  shortCode: string | null;
  destinationUrl: string;
  isActive: boolean;
  scheduledStart: string | null;
  expiresAt: string | null;
  createdAt: string;
  campaignId: string | null;
  campaign: CampaignSummary | null;
  styleConfig?: {
    fgColor?: string;
    bgColor?: string;
    logoUrl?: string;
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  } | null;
  routingRules?: {
    ios?: string;
    android?: string;
    desktop?: string;
  } | null;
  geoRules?: Record<string, string> | null;
}

export const QrCodesManager: React.FC = () => {
  // Compute a schedule-aware status for a QR code
  const getScheduleStatus = (qr: QrCodeItem): 'expired' | 'scheduled' | 'active' | 'inactive' => {
    if (!qr.isActive) return 'inactive';
    const now = new Date();
    if (qr.expiresAt && new Date(qr.expiresAt) < now) return 'expired';
    if (qr.scheduledStart && new Date(qr.scheduledStart) > now) return 'scheduled';
    return 'active';
  };

  const [qrCodes, setQrCodes] = useState<QrCodeItem[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('FREE');
  const [maxQrCodes, setMaxQrCodes] = useState<number | null>(5);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingQr, setEditingQr] = useState<QrCodeItem | null>(null);
  const [previewQr, setPreviewQr] = useState<{
    name: string;
    type: 'STATIC' | 'DYNAMIC';
    targetUrl: string;
    styleConfig?: QrCodeItem['styleConfig'];
  } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Campaign filter: 'all' | 'unassigned' | '<campaignId>'
  const [campaignFilter, setCampaignFilter] = useState<string>('all');

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/campaigns');
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (err: unknown) {
      console.error('Failed to fetch campaigns:', err);
    }
  };

  const fetchQrCodes = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/qr-codes');
      if (res.ok) {
        const data = await res.json();
        setQrCodes(data.qrCodes || []);
        if (data.subscriptionStatus) {
          setSubscriptionStatus(data.subscriptionStatus);
        }
        if (data.maxQrCodes !== undefined) {
          setMaxQrCodes(data.maxQrCodes);
        }
      }
    } catch (err: unknown) {
      console.error('Failed to fetch QR codes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    fetchQrCodes();
  }, []);

  // Filtered list based on selected campaign filter
  const filteredQrCodes = qrCodes.filter((qr) => {
    if (campaignFilter === 'all') return true;
    if (campaignFilter === 'unassigned') return qr.campaignId === null;
    return qr.campaignId === campaignFilter;
  });

  const isPro = subscriptionStatus === 'ACTIVE';
  const isAtLimit = maxQrCodes !== null && qrCodes.length >= maxQrCodes;

  const handleToggleActive = async (qr: QrCodeItem) => {
    try {
      const res = await fetch(`/api/qr-codes/${qr.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !qr.isActive }),
      });
      if (res.ok) fetchQrCodes();
    } catch (err: unknown) {
      console.error('Failed to toggle active status:', err);
    }
  };

  const handleDelete = async (qr: QrCodeItem) => {
    if (!confirm(`Are you sure you want to delete "${qr.name}"?`)) return;
    try {
      const res = await fetch(`/api/qr-codes/${qr.id}`, { method: 'DELETE' });
      if (res.ok) fetchQrCodes();
    } catch (err: unknown) {
      console.error('Failed to delete QR code:', err);
    }
  };

  const getTargetUrlForQr = (qr: QrCodeItem) => {
    if (qr.type === 'DYNAMIC' && qr.shortCode) {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      return `${origin}/r/${qr.shortCode}`;
    }
    return qr.destinationUrl;
  };

  const handleCopyShortLink = (qr: QrCodeItem) => {
    const targetUrl = getTargetUrlForQr(qr);
    navigator.clipboard.writeText(targetUrl);
    setCopiedId(qr.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Container size="lg">
      <div className="space-y-6">
        {/* Header with Title, Usage Indicator, and Create Action */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                QR Codes
              </h1>
              <Badge variant="brand" size="sm">
                QR-P2.0
              </Badge>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              Create and manage Static and Dynamic QR codes for your workspace.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Usage Indicator */}
            <div
              className={`inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border ${
                isPro
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 font-semibold'
                  : isAtLimit
                  ? 'bg-amber-50 text-amber-800 border-amber-300 font-semibold'
                  : 'bg-slate-100 text-slate-700 border-slate-200 font-medium'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isPro
                    ? 'bg-emerald-500'
                    : isAtLimit
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-slate-400'
                }`}
              />
              <span>
                {isPro
                  ? 'Unlimited QR codes (Pro)'
                  : `${qrCodes.length} / ${maxQrCodes ?? 5} QR codes used`}
              </span>
            </div>

            {/* Actions: Disabled Button + Inline Upgrade Link when at limit; otherwise normal Create Button */}
            {isAtLimit ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  disabled={true}
                  className="opacity-50 cursor-not-allowed bg-slate-200 text-slate-500 hover:bg-slate-200"
                  title="Free plan limited to 5 QR codes. Upgrade to Pro for unlimited."
                >
                  + Create New QR Code
                </Button>
                <Link
                  href="/app/billing"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
                >
                  <span>Upgrade to Pro</span>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>
              </div>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => setShowCreateModal(true)}
                className="shadow-sm shadow-indigo-500/20"
              >
                + Create New QR Code
              </Button>
            )}
          </div>
        </div>

        {/* Campaign filter dropdown */}
        {campaigns.length > 0 && (
          <div className="flex items-center gap-3">
            <label
              htmlFor="campaign-filter"
              className="text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap"
            >
              Filter by Campaign
            </label>
            <select
              id="campaign-filter"
              value={campaignFilter}
              onChange={(e) => setCampaignFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white"
            >
              <option value="all">All QR Codes</option>
              <option value="unassigned">Unassigned</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {campaignFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setCampaignFilter('all')}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {/* QR Codes List or Empty State */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            Loading QR codes...
          </div>
        ) : filteredQrCodes.length === 0 ? (
          <Card className="p-12 text-center space-y-4 border-dashed border-2 border-slate-200">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="2" />
                <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth="2" />
                <rect x="14" y="14" width="7" height="7" rx="1" strokeWidth="2" />
                <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth="2" />
              </svg>
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                {campaignFilter === 'all'
                  ? 'No QR codes created yet'
                  : campaignFilter === 'unassigned'
                  ? 'No unassigned QR codes'
                  : `No QR codes in this campaign`}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
                {campaignFilter === 'all'
                  ? 'Generate your first static or dynamic QR code with vector export and instant redirection.'
                  : 'Try changing the campaign filter above.'}
              </p>
            </div>
            {campaignFilter === 'all' && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setShowCreateModal(true)}
              >
                Create QR Code
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredQrCodes.map((qr) => {
              const targetUrl = getTargetUrlForQr(qr);
              return (
                <Card key={qr.id} className="p-5 hover:border-slate-300 transition-all">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left details */}
                    <div className="space-y-2 max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{qr.name}</h3>
                        <Badge variant={qr.type === 'DYNAMIC' ? 'brand' : 'neutral'} size="sm">
                          {qr.type}
                        </Badge>
                        {(() => {
                          const status = getScheduleStatus(qr);
                          const badgeMap = {
                            expired:   { variant: 'neutral'  as const, label: 'Expired' },
                            scheduled: { variant: 'warning'  as const, label: 'Scheduled' },
                            active:    { variant: 'success'  as const, label: 'Active' },
                            inactive:  { variant: 'neutral'  as const, label: 'Inactive' },
                          };
                          const { variant, label } = badgeMap[status];
                          return <Badge variant={variant} size="sm">{label}</Badge>;
                        })()}
                        {/* Campaign badge */}
                        {qr.campaign && (
                          <Badge variant="outline" size="sm">
                            📁 {qr.campaign.name}
                          </Badge>
                        )}
                      </div>

                      {/* Destination / Shortlink info */}
                      <div className="space-y-1 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-500 uppercase text-[10px]">
                            Destination:
                          </span>
                          <a
                            href={qr.destinationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-indigo-600 hover:underline truncate max-w-md"
                          >
                            {qr.destinationUrl}
                          </a>
                        </div>

                        {qr.type === 'DYNAMIC' && qr.shortCode && (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-500 uppercase text-[10px]">
                              Short Link:
                            </span>
                            <span className="font-mono text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                              /r/{qr.shortCode}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPreviewQr({
                            name: qr.name,
                            type: qr.type,
                            targetUrl,
                            styleConfig: qr.styleConfig,
                          })
                        }
                      >
                        Preview &amp; Export
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        href={`/app/qr-codes/${qr.id}/analytics`}
                      >
                        Analytics
                      </Button>

                      {qr.type === 'DYNAMIC' && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyShortLink(qr)}
                        >
                          {copiedId === qr.id ? 'Copied!' : 'Copy Link'}
                        </Button>
                      )}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(qr)}
                        title={qr.isActive ? 'Deactivate code' : 'Activate code'}
                      >
                        {qr.isActive ? 'Pause' : 'Activate'}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingQr(qr)}
                      >
                        Edit
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(qr)}
                        className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && !isAtLimit && (
        <CreateQrModal
          campaigns={campaigns}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchQrCodes();
          }}
        />
      )}

      {editingQr && (
        <EditQrModal
          qrCode={editingQr}
          campaigns={campaigns}
          onClose={() => setEditingQr(null)}
          onSuccess={() => {
            setEditingQr(null);
            fetchQrCodes();
          }}
        />
      )}

      {previewQr && (
        <QrPreviewModal
          name={previewQr.name}
          type={previewQr.type}
          targetUrl={previewQr.targetUrl}
          styleConfig={previewQr.styleConfig}
          onClose={() => setPreviewQr(null)}
        />
      )}
    </Container>
  );
};
