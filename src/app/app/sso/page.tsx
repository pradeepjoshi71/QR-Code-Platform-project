'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Container } from '@/components/ui/Container';

interface SsoStatus {
  ssoEnabled: boolean;
  workosOrganizationId: string | null;
}

export default function SsoPage() {
  const [ssoStatus, setSsoStatus] = useState<SsoStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupLoading, setSetupLoading] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      setForbidden(false);

      const res = await fetch('/api/organizations/sso/setup');
      if (res.status === 403) {
        setForbidden(true);
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch SSO configuration.');
      }

      setSsoStatus(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load SSO status.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSetupSso = async () => {
    try {
      setSetupLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const res = await fetch('/api/organizations/sso/setup', {
        method: 'POST',
      });

      if (res.status === 403) {
        setForbidden(true);
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to initiate SSO setup.');
      }

      setSuccessMessage('Admin Portal session generated. Redirecting to WorkOS…');
      setSsoStatus({
        ssoEnabled: data.ssoEnabled,
        workosOrganizationId: data.workosOrganizationId,
      });

      if (data.portalUrl) {
        window.open(data.portalUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate Admin Portal session.';
      setErrorMessage(message);
    } finally {
      setSetupLoading(false);
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
                Enterprise SSO
              </h1>
              <Badge variant="warning" size="sm">
                Owner Only
              </Badge>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              Configure SAML 2.0 or OpenID Connect (OIDC) Single Sign-On for your corporate workspace via WorkOS.
            </p>
          </div>
        </div>

        {/* 403 Forbidden State */}
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
                Enterprise Single Sign-On configuration is restricted to organization owners. Please contact your workspace administrator to configure SAML or OIDC.
              </p>
            </div>
          </Card>
        )}

        {/* Global Error Banner */}
        {errorMessage && !forbidden && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-4 text-rose-900 text-xs font-semibold">
            {errorMessage}
          </div>
        )}

        {/* Global Success Banner */}
        {successMessage && !forbidden && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-emerald-900 text-xs font-semibold">
            ✓ {successMessage}
          </div>
        )}

        {!forbidden && (
          <>
            {loading ? (
              <Card className="p-8 text-center text-slate-500 text-sm">
                <div className="animate-pulse space-y-3">
                  <div className="h-5 bg-slate-200 rounded w-1/4 mx-auto" />
                  <div className="h-4 bg-slate-100 rounded w-1/3 mx-auto" />
                </div>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Status Card */}
                <Card className="p-6 sm:p-7 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h2 className="text-base font-bold text-slate-900">
                          SSO Authentication Status
                        </h2>
                        {ssoStatus?.ssoEnabled ? (
                          <Badge variant="success" size="sm">
                            Enabled
                          </Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">
                            Not Configured
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {ssoStatus?.workosOrganizationId ? (
                          <span>
                            Connected WorkOS Org ID:{' '}
                            <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-700">
                              {ssoStatus.workosOrganizationId}
                            </code>
                          </span>
                        ) : (
                          'No Identity Provider connection has been initiated yet.'
                        )}
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      disabled={setupLoading}
                      onClick={handleSetupSso}
                    >
                      {setupLoading
                        ? 'Launching Portal…'
                        : ssoStatus?.ssoEnabled
                        ? 'Manage SSO Connections'
                        : 'Set up SSO'}
                    </Button>
                  </div>

                  {/* Information Box */}
                  <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                    <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                      How WorkOS Self-Service Admin Portal Works
                    </h3>
                    <p>
                      Clicking &ldquo;{ssoStatus?.ssoEnabled ? 'Manage SSO Connections' : 'Set up SSO'}&rdquo; opens the secure, hosted WorkOS Admin Portal. From there, your corporate IT administrators can directly configure SAML 2.0 or OIDC integration with any major Identity Provider:
                    </p>
                    <ul className="list-disc list-inside space-y-1 pl-1 text-slate-500">
                      <li>Okta, Microsoft Entra ID (Azure AD), Google Workspace SAML</li>
                      <li>OneLogin, PingIdentity, CyberArk, JumpCloud, and custom IdPs</li>
                      <li>Automated certificate management, SAML assertions, and XML metadata exchange</li>
                    </ul>
                  </div>
                </Card>

                {/* Team Login Instructions */}
                <Card className="p-6 bg-slate-50 border-slate-200/80 space-y-2">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Member Sign-In Experience
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Once your Identity Provider connection is active, team members can go to the login page, select <strong className="text-slate-800">&ldquo;Continue with SSO&rdquo;</strong>, and enter their corporate email address. They will authenticate directly with your organization&apos;s identity provider without needing a local password.
                  </p>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </Container>
  );
}
