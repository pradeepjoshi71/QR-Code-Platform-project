import React from 'react';
import { auth } from '@/lib/auth';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default async function DashboardPage() {
  const session = await auth();

  const user = session?.user;
  const orgName = user?.activeOrgName || 'Personal Workspace';
  const orgRole = user?.activeOrgRole || 'OWNER';

  return (
    <Container size="lg">
      <div className="space-y-8">
        {/* Workspace Hero Banner */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {orgName}
              </h1>
              <Badge variant="brand" size="sm">
                {orgRole}
              </Badge>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              Welcome back, <span className="font-semibold text-slate-800">{user?.name || user?.email}</span>. Manage your workspace members and dynamic routing infrastructure.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button href="/app/billing" variant="outline" size="md">
              Billing &amp; Plan
            </Button>
            <Button href="/app/qr-codes" variant="primary" size="md">
              Manage &amp; Create QR Codes
            </Button>
          </div>
        </div>

        {/* Workspace Quick Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Workspace
            </p>
            <p className="text-xl font-bold text-slate-900 mt-1 truncate">
              {orgName}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Multi-tenant isolated
            </p>
          </Card>

          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Your Role
            </p>
            <p className="text-xl font-bold text-indigo-600 mt-1">
              {orgRole}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {orgRole === 'OWNER' ? 'Full administrative rights' : 'Workspace member'}
            </p>
          </Card>

          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Dynamic Codes
            </p>
            <p className="text-xl font-bold text-slate-900 mt-1">
              0 / 25
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Phase P2.0 Engine ready
            </p>
          </Card>

          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Scans
            </p>
            <p className="text-xl font-bold text-slate-900 mt-1">
              0
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Phase P3.0 Telemetry ready
            </p>
          </Card>
        </div>

        {/* Database & Multi-Tenant Status Information */}
        <Card className="p-6 sm:p-8">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Phase QR-P1.0 Authentication &amp; Multi-Tenant Status
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Session verified through server-side NextAuth v5 &amp; Supabase PostgreSQL adapter.
              </p>
            </div>
            <Badge variant="success" size="sm">
              Live Verified
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5" />
                <div>
                  <p className="font-semibold text-slate-800">User Identity &amp; Hashing</p>
                  <p className="text-xs text-slate-500">
                    User record securely stored with bcrypt (cost factor 12) or linked via Google OAuth.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5" />
                <div>
                  <p className="font-semibold text-slate-800">Multi-Tenant Isolation</p>
                  <p className="text-xs text-slate-500">
                    Workspace memberships are scoped via unique <code className="text-xs bg-slate-100 px-1 py-0.5 rounded font-mono">Membership(userId, orgId, role)</code> constraints.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5" />
                <div>
                  <p className="font-semibold text-slate-800">Edge Middleware Protection</p>
                  <p className="text-xs text-slate-500">
                    All <code className="text-xs bg-slate-100 px-1 py-0.5 rounded font-mono">/app/*</code> routes are intercepted and validated before rendering.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5" />
                <div>
                  <p className="font-semibold text-slate-800">Ready for QR-P2.0 Engine</p>
                  <p className="text-xs text-slate-500">
                    Next milestone will introduce dynamic URL redirects, QR vector renderers, and Redis cache layer.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Container>
  );
}
