'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Container } from '@/components/ui/Container';
import { CreateQrModal } from '@/components/qr/CreateQrModal';
import { EditQrModal } from '@/components/qr/EditQrModal';
import { QrPreviewModal } from '@/components/qr/QrPreviewModal';

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

  const fetchQrCodes = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/qr-codes');
      if (res.ok) {
        const data = await res.json();
        setQrCodes(data.qrCodes || []);
      }
    } catch (err) {
      console.error('Failed to fetch QR codes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQrCodes();
  }, []);

  const handleToggleActive = async (qr: QrCodeItem) => {
    try {
      const res = await fetch(`/api/qr-codes/${qr.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !qr.isActive }),
      });

      if (res.ok) {
        fetchQrCodes();
      }
    } catch (err) {
      console.error('Failed to toggle active status:', err);
    }
  };

  const handleDelete = async (qr: QrCodeItem) => {
    if (!confirm(`Are you sure you want to delete "${qr.name}"?`)) return;

    try {
      const res = await fetch(`/api/qr-codes/${qr.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchQrCodes();
      }
    } catch (err) {
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
        {/* Header with Title and Create Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
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

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => setShowCreateModal(true)}
            className="shadow-sm shadow-indigo-500/20"
          >
            + Create New QR Code
          </Button>
        </div>

        {/* QR Codes List or Empty State */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            Loading QR codes...
          </div>
        ) : qrCodes.length === 0 ? (
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
              <h3 className="text-base font-bold text-slate-900">No QR codes created yet</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
                Generate your first static or dynamic QR code with vector export and instant redirection.
              </p>
            </div>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setShowCreateModal(true)}
            >
              Create QR Code
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {qrCodes.map((qr) => {
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
                          return (
                            <Badge variant={variant} size="sm">
                              {label}
                            </Badge>
                          );
                        })()}
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
      {showCreateModal && (
        <CreateQrModal
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
