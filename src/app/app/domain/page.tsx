'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Container } from '@/components/ui/Container';

interface CustomDomainData {
  id: string;
  organizationId: string;
  domain: string;
  verified: boolean;
  vercelConfigured: boolean;
  createdAt: string;
}

interface DnsInstructions {
  type: string;
  host: string;
  value: string;
}

export default function CustomDomainPage() {
  const [domainData, setDomainData] = useState<CustomDomainData | null>(null);
  const [dnsInstructions, setDnsInstructions] = useState<DnsInstructions | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [removing, setRemoving] = useState(false);

  // Form input
  const [domainInput, setDomainInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchDomain = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/organizations/domain');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load custom domain.');
      }
      setDomainData(data.customDomain || null);
      setDnsInstructions(data.dnsInstructions || null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to retrieve domain settings.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDomain();
  }, []);

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainInput.trim()) {
      setErrorMessage('Please enter a domain name.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/organizations/domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domainInput.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to attach custom domain.');
      }

      setDomainData(data.customDomain);
      setDnsInstructions(data.dnsInstructions);
      setDomainInput('');
      setSuccessMessage('Custom domain added successfully. Configure your DNS records below.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to attach custom domain.';
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveDomain = async () => {
    if (!domainData) return;

    const confirmed = window.confirm(
      `Are you sure you want to remove ${domainData.domain}? Any QR codes relying on this domain will stop redirecting.`
    );
    if (!confirmed) return;

    setRemoving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/organizations/domain', {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove custom domain.');
      }

      setDomainData(null);
      setDnsInstructions(null);
      setSuccessMessage('Custom domain removed successfully.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to remove custom domain.';
      setErrorMessage(message);
    } finally {
      setRemoving(false);
    }
  };

  const handleCopyTarget = () => {
    if (!dnsInstructions) return;
    navigator.clipboard.writeText(dnsInstructions.value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Container size="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Custom Domain
              </h1>
              <Badge variant="brand" size="sm">
                QR-P10.1
              </Badge>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              Attach your own branded domain or subdomain to generate white-labeled QR codes and custom short links.
            </p>
          </div>

          {domainData && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fetchDomain(true)}
                disabled={refreshing || loading}
              >
                {refreshing ? 'Checking…' : '↻ Refresh Status'}
              </Button>
            </div>
          )}
        </div>

        {/* Global Feedback Banners */}
        {errorMessage && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-4 text-rose-900 text-xs font-semibold">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-emerald-900 text-xs font-semibold">
            ✓ {successMessage}
          </div>
        )}

        {loading ? (
          <Card className="p-8 text-center text-slate-500 text-sm">
            <div className="animate-pulse space-y-3">
              <div className="h-5 bg-slate-200 rounded w-1/4 mx-auto" />
              <div className="h-4 bg-slate-100 rounded w-1/3 mx-auto" />
            </div>
          </Card>
        ) : domainData ? (
          /* Domain Attached State */
          <div className="space-y-6">
            <Card className="p-6 sm:p-7 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-lg font-bold text-slate-900 font-mono">
                      {domainData.domain}
                    </h2>
                    {domainData.verified ? (
                      <Badge variant="success" size="sm">
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="warning" size="sm">
                        Verification Pending
                      </Badge>
                    )}
                    {domainData.vercelConfigured ? (
                      <Badge variant="success" size="sm">
                        DNS Configured
                      </Badge>
                    ) : (
                      <Badge variant="warning" size="sm">
                        DNS Incomplete
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Attached on {new Date(domainData.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={removing}
                  onClick={handleRemoveDomain}
                  className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300"
                >
                  {removing ? 'Removing…' : 'Remove Domain'}
                </Button>
              </div>

              {/* DNS Instructions */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  DNS Configuration Instructions
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Log in to your DNS provider (e.g., Cloudflare, Namecheap, GoDaddy) and create the following record to point your custom domain to our routing network:
                </p>

                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="pb-2 font-semibold">Type</th>
                        <th className="pb-2 font-semibold">Name / Host</th>
                        <th className="pb-2 font-semibold">Value / Target</th>
                        <th className="pb-2 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/60">
                      <tr>
                        <td className="py-2.5 font-bold text-indigo-700">CNAME</td>
                        <td className="py-2.5 text-slate-800 font-medium">
                          {dnsInstructions?.host || domainData.domain}
                        </td>
                        <td className="py-2.5 text-slate-800 font-medium">
                          {dnsInstructions?.value || 'cname.vercel-dns.com'}
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            type="button"
                            onClick={handleCopyTarget}
                            className="text-xs font-sans text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                          >
                            {copied ? '✓ Copied' : 'Copy'}
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 space-y-1">
                  <p className="font-semibold">DNS Propagation</p>
                  <p className="text-[11px] leading-relaxed">
                    DNS records can take anywhere from a few minutes up to 24 hours to propagate globally. Once you have added the CNAME record, click &ldquo;Refresh Status&rdquo; to verify.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          /* No Domain State — Creation Form */
          <div className="space-y-6">
            <Card className="p-6 sm:p-7 space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Connect a Branded Subdomain
                </h2>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Enter the domain you would like to use for your QR code redirects. We recommend using a dedicated subdomain such as <span className="font-mono font-semibold text-slate-800">qr.yourbrand.com</span> or <span className="font-mono font-semibold text-slate-800">links.yourcompany.org</span>.
                </p>
              </div>

              <form onSubmit={handleAddDomain} className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Domain / Subdomain
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      type="text"
                      required
                      placeholder="e.g. qr.mycompany.com"
                      value={domainInput}
                      onChange={(e) => setDomainInput(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      disabled={submitting || !domainInput.trim()}
                      className="shrink-0"
                    >
                      {submitting ? 'Connecting…' : 'Add Domain'}
                    </Button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Do not include &ldquo;https://&rdquo; or trailing slashes. Only one custom domain per workspace is supported.
                  </p>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </Container>
  );
}
