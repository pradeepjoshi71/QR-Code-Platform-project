'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Container } from '@/components/ui/Container';

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  _count: { qrCodes: number };
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  // Create form state
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/campaigns');
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateLoading(true);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: createName, description: createDesc }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error || 'Failed to create campaign.');
      } else {
        setCreateName('');
        setCreateDesc('');
        setShowCreate(false);
        fetchCampaigns();
      }
    } catch {
      setCreateError('Network error.');
    } finally {
      setCreateLoading(false);
    }
  };

  const startEdit = (c: Campaign) => {
    setEditingId(c.id);
    setEditName(c.name);
    setEditDesc(c.description ?? '');
    setEditError(null);
  };

  const handleEdit = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    setEditError(null);
    setEditLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, description: editDesc }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error || 'Failed to update campaign.');
      } else {
        setEditingId(null);
        fetchCampaigns();
      }
    } catch {
      setEditError('Network error.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (c: Campaign) => {
    if (
      !confirm(
        `Delete campaign "${c.name}"?\n\nIts ${c._count.qrCodes} QR code(s) will NOT be deleted — they will just become unassigned.`
      )
    )
      return;

    try {
      const res = await fetch(`/api/campaigns/${c.id}`, { method: 'DELETE' });
      if (res.ok) fetchCampaigns();
    } catch (err) {
      console.error('Failed to delete campaign:', err);
    }
  };

  return (
    <Container size="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Campaigns
              </h1>
              <Badge variant="brand" size="sm">
                QR-P6.1
              </Badge>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              Group QR codes into named campaigns for easier tracking and organization.
            </p>
          </div>

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => {
              setShowCreate(true);
              setCreateError(null);
            }}
            className="shadow-sm shadow-indigo-500/20"
          >
            + New Campaign
          </Button>
        </div>

        {/* Inline create form */}
        {showCreate && (
          <Card className="p-6 border-indigo-200 bg-indigo-50/30">
            <h3 className="text-sm font-bold text-slate-900 mb-4">New Campaign</h3>
            {createError && (
              <div className="mb-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {createError}
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Summer 2026 Promo"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Description <span className="text-slate-400 font-normal normal-case">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Brief notes about this campaign"
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowCreate(false);
                    setCreateName('');
                    setCreateDesc('');
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={createLoading}>
                  {createLoading ? 'Creating…' : 'Create Campaign'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* List or empty state */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading campaigns…</div>
        ) : campaigns.length === 0 ? (
          <Card className="p-12 text-center space-y-4 border-dashed border-2 border-slate-200">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">No campaigns yet</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
                Create a campaign to group related QR codes together for easier management.
              </p>
            </div>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setShowCreate(true)}
            >
              Create Campaign
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {campaigns.map((c) => (
              <Card key={c.id} className="p-5 hover:border-slate-300 transition-all">
                {editingId === c.id ? (
                  /* Inline edit form */
                  <div>
                    {editError && (
                      <div className="mb-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                        {editError}
                      </div>
                    )}
                    <form onSubmit={(e) => handleEdit(e, c.id)} className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          autoFocus
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" variant="primary" size="sm" disabled={editLoading}>
                          {editLoading ? 'Saving…' : 'Save'}
                        </Button>
                      </div>
                    </form>
                  </div>
                ) : (
                  /* Read view */
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{c.name}</h3>
                        <Badge variant="neutral" size="sm">
                          {c._count.qrCodes} QR {c._count.qrCodes === 1 ? 'code' : 'codes'}
                        </Badge>
                      </div>
                      {c.description && (
                        <p className="text-sm text-slate-500">{c.description}</p>
                      )}
                      <p className="text-[11px] text-slate-400">
                        Created {new Date(c.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(c)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(c)}
                        className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
