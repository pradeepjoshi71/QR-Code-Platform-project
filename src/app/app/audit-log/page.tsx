'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Container } from '@/components/ui/Container';

interface ActorUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface AuditLogEntry {
  id: string;
  organizationId: string;
  actorUserId: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actorUser: ActorUser;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function getActionBadge(action: string) {
  switch (action) {
    case 'member.invited':
      return { variant: 'brand' as const, label: 'Member Invited' };
    case 'member.role_changed':
      return { variant: 'brand' as const, label: 'Role Changed' };
    case 'member.removed':
      return { variant: 'warning' as const, label: 'Member Removed' };
    case 'qrcode.deleted':
      return { variant: 'warning' as const, label: 'QR Code Deleted' };
    case 'apikey.created':
      return { variant: 'success' as const, label: 'API Key Created' };
    case 'apikey.revoked':
      return { variant: 'warning' as const, label: 'API Key Revoked' };
    case 'billing.upgraded':
      return { variant: 'success' as const, label: 'Billing Upgraded' };
    case 'domain.added':
      return { variant: 'success' as const, label: 'Domain Added' };
    case 'domain.removed':
      return { variant: 'warning' as const, label: 'Domain Removed' };
    case 'sso.enabled':
      return { variant: 'success' as const, label: 'SSO Enabled' };
    default:
      return { variant: 'neutral' as const, label: action };
  }
}

function formatMetadataSummary(log: AuditLogEntry): string | null {
  if (!log.metadata) return null;
  const m = log.metadata;

  if (log.action === 'sso.enabled') {
    return 'Enabled Enterprise Single Sign-On (WorkOS)';
  }

  if (log.action === 'domain.added' && typeof m.domain === 'string') {
    return `Attached custom domain ${m.domain}`;
  }

  if (log.action === 'domain.removed' && typeof m.domain === 'string') {
    return `Removed custom domain ${m.domain}`;
  }

  if (log.action === 'member.invited' && typeof m.email === 'string') {
    const role = typeof m.role === 'string' ? ` as ${m.role}` : '';
    return `Invited ${m.email}${role}`;
  }

  if (log.action === 'member.role_changed' && typeof m.oldRole === 'string' && typeof m.newRole === 'string') {
    return `Role changed from ${m.oldRole} to ${m.newRole}`;
  }

  if (log.action === 'member.removed' && typeof m.role === 'string') {
    return `Removed ${m.role} member from workspace`;
  }

  if (log.action === 'qrcode.deleted' && typeof m.name === 'string') {
    const sc = typeof m.shortCode === 'string' ? ` (${m.shortCode})` : '';
    return `Deleted "${m.name}"${sc}`;
  }

  if (log.action === 'apikey.created' && typeof m.name === 'string') {
    const prefix = typeof m.keyPrefix === 'string' ? ` (${m.keyPrefix}...)` : '';
    return `Created key "${m.name}"${prefix}`;
  }

  if (log.action === 'apikey.revoked' && typeof m.name === 'string') {
    const prefix = typeof m.keyPrefix === 'string' ? ` (${m.keyPrefix}...)` : '';
    return `Revoked key "${m.name}"${prefix}`;
  }

  if (log.action === 'billing.upgraded') {
    return 'Upgraded workspace plan to Pro';
  }

  return null;
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

  const fetchLogs = useCallback(async (pageToLoad: number) => {
    try {
      setLoading(true);
      setErrorMsg(null);
      setForbidden(false);

      const res = await fetch(`/api/audit-logs?page=${pageToLoad}&limit=20`);

      if (res.status === 403) {
        setForbidden(true);
        setLogs([]);
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch audit logs.');
      }

      setLogs(data.logs || []);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load audit logs.';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const handlePrevPage = () => {
    if (pagination.page > 1) {
      fetchLogs(pagination.page - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.totalPages) {
      fetchLogs(pagination.page + 1);
    }
  };

  const startEntry = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const endEntry = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <Container size="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Audit Log
              </h1>
              <Badge variant="warning" size="sm">
                Owner Only
              </Badge>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              Immutable record of sensitive organizational actions for compliance and security oversight.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fetchLogs(pagination.page)}
              disabled={loading || forbidden}
            >
              ↻ Refresh
            </Button>
          </div>
        </div>

        {/* 403 Forbidden State for Non-Owners */}
        {forbidden && (
          <Card className="p-10 text-center space-y-4 border-amber-200 bg-amber-50/50">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <div className="max-w-md mx-auto">
              <h2 className="text-base font-bold text-slate-900">Workspace Owner Access Required</h2>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                The audit log contains sensitive organizational operations including team invitations, API key revocations, and billing transactions. Access is strictly reserved for workspace owners.
              </p>
            </div>
          </Card>
        )}

        {/* Generic Error Banner */}
        {errorMsg && !forbidden && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-4 text-rose-900">
            <p className="text-sm font-semibold">{errorMsg}</p>
          </div>
        )}

        {/* Audit Log Content */}
        {!forbidden && (
          <>
            {loading ? (
              <Card className="p-8 text-center text-slate-500 text-sm">
                <div className="animate-pulse space-y-3">
                  <div className="h-5 bg-slate-200 rounded w-1/4 mx-auto" />
                  <div className="h-4 bg-slate-100 rounded w-1/3 mx-auto" />
                </div>
              </Card>
            ) : logs.length === 0 ? (
              <Card className="p-12 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">No audit events recorded yet</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    Sensitive events like member invites, QR code deletions, API key changes, and billing modifications will appear here automatically.
                  </p>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  {logs.map((log) => {
                    const badgeInfo = getActionBadge(log.action);
                    const summary = formatMetadataSummary(log);
                    const actorInitial = (
                      log.actorUser?.name ||
                      log.actorUser?.email ||
                      'U'
                    ).charAt(0).toUpperCase();

                    return (
                      <Card
                        key={log.id}
                        className="p-5 transition-colors hover:border-slate-300"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-3.5 min-w-0">
                            {/* Actor Avatar */}
                            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                              {actorInitial}
                            </div>

                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <Badge variant={badgeInfo.variant} size="sm">
                                  {badgeInfo.label}
                                </Badge>
                                {log.targetType && (
                                  <span className="text-xs font-medium text-slate-500">
                                    Target: <span className="font-semibold text-slate-700">{log.targetType}</span>
                                    {log.targetId && (
                                      <span className="font-mono text-[11px] text-slate-400 ml-1">
                                        ({log.targetId.slice(0, 10)}...)
                                      </span>
                                    )}
                                  </span>
                                )}
                              </div>

                              {summary && (
                                <p className="text-sm font-medium text-slate-800">
                                  {summary}
                                </p>
                              )}

                              <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                                <span>
                                  Actor:{' '}
                                  <strong className="text-slate-700 font-medium">
                                    {log.actorUser?.name || log.actorUser?.email}
                                  </strong>{' '}
                                  ({log.actorUser?.email})
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Timestamp */}
                          <div className="text-left sm:text-right shrink-0">
                            <time
                              dateTime={log.createdAt}
                              className="text-xs font-medium text-slate-600 block"
                            >
                              {new Date(log.createdAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </time>
                            <span className="text-[11px] text-slate-400 font-mono block">
                              {new Date(log.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {/* Pagination Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-200">
                  <div className="text-xs text-slate-500">
                    Showing <span className="font-semibold text-slate-700">{startEntry}</span> to{' '}
                    <span className="font-semibold text-slate-700">{endEntry}</span> of{' '}
                    <span className="font-semibold text-slate-700">{pagination.total}</span> events
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handlePrevPage}
                      disabled={pagination.page <= 1 || loading}
                      className="text-xs"
                    >
                      ← Previous
                    </Button>
                    <span className="text-xs font-medium text-slate-600 px-2">
                      Page {pagination.page} of {Math.max(1, pagination.totalPages)}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={pagination.page >= pagination.totalPages || loading}
                      className="text-xs"
                    >
                      Next →
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Container>
  );
}
