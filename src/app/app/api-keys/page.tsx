'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Container } from '@/components/ui/Container';

interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  createdByUser?: {
    name: string | null;
    email: string;
  };
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Create key modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // One-time copy modal state
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<{
    rawKey: string;
    name: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Revoke state
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch('/api/api-keys');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch API keys.');
      }
      setApiKeys(data.apiKeys || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load API keys.';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) {
      setCreateError('Please enter a name for your API key.');
      return;
    }

    try {
      setCreateLoading(true);
      setCreateError(null);
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: keyName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create API key.');
      }

      // Close create modal and open the one-time copy modal
      setShowCreateModal(false);
      setKeyName('');
      setNewlyCreatedKey({
        rawKey: data.rawKey,
        name: data.apiKey.name,
      });

      // Refresh list
      fetchApiKeys();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create API key.';
      setCreateError(message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCopyKey = () => {
    if (!newlyCreatedKey) return;
    navigator.clipboard.writeText(newlyCreatedKey.rawKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRevokeKey = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to revoke the API key "${name}"? Any systems using this key will immediately lose access.`)) {
      return;
    }

    try {
      setRevokingId(id);
      const res = await fetch(`/api/api-keys/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to revoke API key.');
      }
      fetchApiKeys();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to revoke API key.';
      alert(message);
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <Container size="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                API Keys
              </h1>
              <Badge variant="brand" size="sm">
                QR-P8.1
              </Badge>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              Manage programmatic API keys for automated QR code generation and telemetry integration.
            </p>
          </div>

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => {
              setCreateError(null);
              setKeyName('');
              setShowCreateModal(true);
            }}
            className="shadow-sm shadow-indigo-500/20"
          >
            + Create New API Key
          </Button>
        </div>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-4 text-rose-900">
            <p className="text-sm font-semibold">{errorMsg}</p>
          </div>
        )}

        {/* Keys List */}
        {loading ? (
          <Card className="p-8 text-center text-slate-500 text-sm">
            <div className="animate-pulse space-y-3">
              <div className="h-5 bg-slate-200 rounded w-1/4 mx-auto" />
              <div className="h-4 bg-slate-100 rounded w-1/3 mx-auto" />
            </div>
          </Card>
        ) : apiKeys.length === 0 ? (
          <Card className="p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">No API keys yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Create an API key to securely connect your backend systems, mobile apps, or automation pipelines with our QR engine.
              </p>
            </div>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                setCreateError(null);
                setKeyName('');
                setShowCreateModal(true);
              }}
            >
              Generate your first key
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {apiKeys.map((k) => {
              const isRevoked = !!k.revokedAt;
              return (
                <Card
                  key={k.id}
                  className={`p-5 transition-colors ${
                    isRevoked ? 'bg-slate-50/70 border-slate-200/70 opacity-75' : 'hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm truncate">
                          {k.name}
                        </span>
                        {isRevoked ? (
                          <Badge variant="neutral" size="sm">
                            Revoked
                          </Badge>
                        ) : (
                          <Badge variant="success" size="sm">
                            Active
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 font-mono flex-wrap">
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200/80 text-slate-700">
                          {k.keyPrefix}••••••••••••••••••••••••••••••••
                        </span>
                        <span className="font-sans text-slate-400">
                          Created {new Date(k.createdAt).toLocaleDateString()}
                          {k.createdByUser?.email && ` by ${k.createdByUser.email}`}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center gap-4">
                        <span>
                          Last used:{' '}
                          {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : 'Never'}
                        </span>
                        {isRevoked && (
                          <span className="text-rose-600 font-medium">
                            Revoked on {new Date(k.revokedAt!).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!isRevoked && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={revokingId === k.id}
                          onClick={() => handleRevokeKey(k.id, k.name)}
                          className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 text-xs"
                        >
                          {revokingId === k.id ? 'Revoking...' : 'Revoke'}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal 1: Create Key Input */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in-50">
          <Card className="max-w-md w-full p-6 sm:p-7 bg-white shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Create New API Key</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            {createError && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateKey} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Key Name / Description
                </label>
                <input
                  type="text"
                  required
                  maxLength={50}
                  placeholder="e.g. Production Backend, Zapier Sync"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                  autoFocus
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Give this key an identifiable name to remember what service is using it.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={createLoading || !keyName.trim()}
                >
                  {createLoading ? 'Generating...' : 'Create API Key'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal 2: One-time Raw Key Display */}
      {newlyCreatedKey && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in-50">
          <Card className="max-w-lg w-full p-6 sm:p-7 bg-white shadow-2xl space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">API Key Created</h3>
                <p className="text-xs text-slate-500">
                  Key: <span className="font-semibold text-slate-700">{newlyCreatedKey.name}</span>
                </p>
              </div>
            </div>

            {/* Warning banner */}
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 space-y-1">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-amber-800">
                <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Save this key now</span>
              </div>
              <p className="text-xs text-amber-800">
                This is the only time your raw API key will be shown. If you close this window without saving it, you will have to generate a new one.
              </p>
            </div>

            {/* Key copy box */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Raw Secret Key
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={newlyCreatedKey.rawKey}
                  className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-800 select-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleCopyKey}
                  className="shrink-0"
                >
                  {copied ? '✓ Copied' : 'Copy Key'}
                </Button>
              </div>
            </div>

            {/* Close button */}
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => {
                  setNewlyCreatedKey(null);
                  setCopied(false);
                }}
                className="w-full sm:w-auto"
              >
                I have saved this key
              </Button>
            </div>
          </Card>
        </div>
      )}
    </Container>
  );
}
