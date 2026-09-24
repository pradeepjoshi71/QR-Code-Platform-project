'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Container } from '@/components/ui/Container';

interface Member {
  id: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  createdAt: string;
  user: { name: string | null; email: string; image: string | null };
}

interface PendingInvite {
  id: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  expiresAt: string;
  createdAt: string;
  invitedBy: { name: string | null; email: string };
}

const ROLE_VARIANT: Record<string, 'warning' | 'brand' | 'neutral'> = {
  OWNER: 'warning',
  ADMIN: 'brand',
  MEMBER: 'neutral',
};

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);

  // Current user's membership details
  const [myRole, setMyRole] = useState<'OWNER' | 'ADMIN' | 'MEMBER' | null>(null);
  const [myMembershipId, setMyMembershipId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Member management state
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'OWNER' | 'ADMIN' | 'MEMBER'>('MEMBER');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      // Fetch members via workspaces endpoint (includes role per member)
      const [membersRes, invitesRes] = await Promise.all([
        fetch('/api/organizations/members'),
        fetch('/api/organizations/invites'),
      ]);

      if (membersRes.ok) {
        const data = await membersRes.json();
        setMembers(data.members || []);
        setMyRole(data.myRole || null);
        setMyMembershipId(data.myMembershipId || null);
        setCurrentUserId(data.currentUserId || null);
      }

      if (invitesRes.ok) {
        const data = await invitesRes.json();
        setInvites(data.invites || []);
      }
    } catch (err: unknown) {
      console.error('Failed to fetch team data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleRoleChange = async (memberId: string, newRole: 'ADMIN' | 'MEMBER') => {
    setActionError(null);
    setActionSuccess(null);
    setUpdatingMemberId(memberId);

    try {
      const res = await fetch(`/api/organizations/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update member role.');
      }

      setActionSuccess(`Member role updated to ${newRole}.`);
      await fetchTeam();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update member role.';
      setActionError(message);
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    setActionError(null);
    setActionSuccess(null);

    const confirmed = window.confirm(
      `Are you sure you want to remove ${memberName} from this workspace? They will immediately lose access.`
    );
    if (!confirmed) return;

    setRemovingMemberId(memberId);
    try {
      const res = await fetch(`/api/organizations/members/${memberId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove member.');
      }

      setActionSuccess(`Removed ${memberName} from the workspace.`);
      await fetchTeam();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to remove member.';
      setActionError(message);
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    setInviteSuccess(null);
    setInviteLoading(true);

    try {
      const res = await fetch('/api/organizations/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInviteError(data.error || 'Failed to send invite.');
      } else {
        setInviteSuccess(
          data.warning
            ? `Invite created (email delivery failed — check RESEND_API_KEY).`
            : `Invite sent to ${inviteEmail}.`
        );
        setInviteEmail('');
        setInviteRole('MEMBER');
        fetchTeam();
      }
    } catch {
      setInviteError('Network error sending invite.');
    } finally {
      setInviteLoading(false);
    }
  };

  const canInvite = myRole === 'OWNER' || myRole === 'ADMIN';

  return (
    <Container size="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Team
              </h1>
              <Badge variant="brand" size="sm">
                QR-P9.2
              </Badge>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              Manage workspace members, assign roles, and handle pending invitations.
            </p>
          </div>
        </div>

        {/* Global Action Banners */}
        {actionError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-4 text-rose-900 flex items-center justify-between">
            <p className="text-xs font-semibold">{actionError}</p>
            <button
              type="button"
              onClick={() => setActionError(null)}
              className="text-rose-500 hover:text-rose-700 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {actionSuccess && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-emerald-900 flex items-center justify-between">
            <p className="text-xs font-semibold">✓ {actionSuccess}</p>
            <button
              type="button"
              onClick={() => setActionSuccess(null)}
              className="text-emerald-500 hover:text-emerald-700 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading team…</div>
        ) : (
          <>
            {/* Invite form — owners/admins only */}
            {canInvite && (
              <Card className="p-6 space-y-4">
                <h2 className="text-sm font-bold text-slate-900">Invite a Team Member</h2>

                {inviteError && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                    {inviteError}
                  </div>
                )}
                {inviteSuccess && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
                    ✓ {inviteSuccess}
                  </div>
                )}

                <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    required
                    placeholder="colleague@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as 'OWNER' | 'ADMIN' | 'MEMBER')}
                    className="px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white"
                  >
                    {myRole === 'OWNER' && <option value="OWNER">Owner</option>}
                    <option value="ADMIN">Admin</option>
                    <option value="MEMBER">Member</option>
                  </select>
                  <Button type="submit" variant="primary" size="md" disabled={inviteLoading}>
                    {inviteLoading ? 'Sending…' : 'Send Invite'}
                  </Button>
                </form>
                <p className="text-[11px] text-slate-400">
                  The invitee will receive an email with an accept link valid for 7 days.
                </p>
              </Card>
            )}

            {/* Current members */}
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Members ({members.length})
              </h2>
              {members.length === 0 ? (
                <Card className="p-6 text-center text-sm text-slate-500">No members found.</Card>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {members.map((m) => {
                    const isSelf =
                      (myMembershipId !== null && m.id === myMembershipId) ||
                      (currentUserId !== null && m.userId === currentUserId);

                    // Permission logic:
                    // - Caller cannot manage their own membership (prevents self-lockout)
                    // - MEMBER cannot manage anyone
                    // - ADMIN can only manage MEMBER-level memberships (hides OWNER-touching and other ADMIN controls)
                    // - OWNER can manage all non-self members
                    const canManage =
                      !isSelf &&
                      (myRole === 'OWNER' ||
                        (myRole === 'ADMIN' && m.role === 'MEMBER'));

                    const isUpdating = updatingMemberId === m.id;
                    const isRemoving = removingMemberId === m.id;

                    return (
                      <Card key={m.id} className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Avatar initials */}
                            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                              {(m.user.name || m.user.email).charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-slate-900 truncate">
                                  {m.user.name || m.user.email}
                                </p>
                                {isSelf && (
                                  <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded">
                                    You
                                  </span>
                                )}
                              </div>
                              {m.user.name && (
                                <p className="text-xs text-slate-400 truncate">{m.user.email}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0">
                            {canManage ? (
                              <div className="flex items-center gap-2">
                                <select
                                  value={m.role}
                                  disabled={isUpdating || isRemoving}
                                  onChange={(e) =>
                                    handleRoleChange(
                                      m.id,
                                      e.target.value as 'ADMIN' | 'MEMBER'
                                    )
                                  }
                                  aria-label={`Role for ${m.user.name || m.user.email}`}
                                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:opacity-50"
                                >
                                  {m.role === 'OWNER' && <option value="OWNER">Owner</option>}
                                  <option value="ADMIN">Admin</option>
                                  <option value="MEMBER">Member</option>
                                </select>

                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={isUpdating || isRemoving}
                                  onClick={() =>
                                    handleRemoveMember(m.id, m.user.name || m.user.email)
                                  }
                                  className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300"
                                >
                                  {isRemoving ? 'Removing…' : 'Remove'}
                                </Button>
                              </div>
                            ) : (
                              <Badge variant={ROLE_VARIANT[m.role] ?? 'neutral'} size="sm">
                                {m.role}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pending invites — owners/admins only */}
            {canInvite && (
              <div className="space-y-3">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Pending Invites ({invites.length})
                </h2>
                {invites.length === 0 ? (
                  <Card className="p-6 text-center text-sm text-slate-500 border-dashed border-2">
                    No pending invites.
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {invites.map((inv) => (
                      <Card key={inv.id} className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{inv.email}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Invited by {inv.invitedBy.name || inv.invitedBy.email} ·{' '}
                              expires {new Date(inv.expiresAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={ROLE_VARIANT[inv.role] ?? 'neutral'} size="sm">
                              {inv.role}
                            </Badge>
                            <span className="text-[11px] font-medium text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                              Pending
                            </span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Container>
  );
}
