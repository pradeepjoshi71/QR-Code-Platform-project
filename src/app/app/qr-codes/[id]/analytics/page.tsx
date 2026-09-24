'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface AnalyticsData {
  qrName: string;
  totalScans: number;
  last30Days: Array<{ date: string; count: number }>;
  deviceBreakdown: { ios: number; android: number; desktop: number; unknown: number };
  countryBreakdown: Array<{ country: string; count: number }>;
}

export default function QrAnalyticsPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        const res = await fetch(`/api/qr-codes/${params.id}/analytics`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.error || `Failed to load analytics (${res.status})`);
          return;
        }
        const json = await res.json();
        setData(json);
      } catch {
        setError('Network error — could not load analytics.');
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [params.id]);

  // ---- Loading state ----
  if (loading) {
    return (
      <Container size="lg">
        <div className="p-12 text-center text-slate-500 text-sm">
          Loading analytics…
        </div>
      </Container>
    );
  }

  // ---- Error state ----
  if (error || !data) {
    return (
      <Container size="lg">
        <Card className="p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 mx-auto flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <circle cx="12" cy="12" r="10" strokeWidth="2" />
              <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" />
              <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" />
            </svg>
          </div>
          <p className="text-sm text-slate-700 font-medium">{error || 'Something went wrong.'}</p>
          <Button href="/app/qr-codes" variant="outline" size="sm">
            ← Back to QR Codes
          </Button>
        </Card>
      </Container>
    );
  }

  const { qrName, totalScans, last30Days, deviceBreakdown, countryBreakdown } = data;
  const maxDailyCount = Math.max(...last30Days.map((d) => d.count), 1);
  const totalDeviceScans =
    deviceBreakdown.ios + deviceBreakdown.android + deviceBreakdown.desktop + deviceBreakdown.unknown;

  // ---- Empty state ----
  if (totalScans === 0) {
    return (
      <Container size="lg">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <Link
                href="/app/qr-codes"
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium mb-2 inline-block"
              >
                ← Back to QR Codes
              </Link>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Analytics
                </h1>
                <Badge variant="brand" size="sm">
                  {qrName}
                </Badge>
              </div>
            </div>
          </div>

          <Card className="p-12 text-center space-y-4 border-dashed border-2 border-slate-200">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">No scans yet</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
                Once this QR code is scanned, analytics data will appear here automatically.
              </p>
            </div>
          </Card>
        </div>
      </Container>
    );
  }

  // ---- Data state ----
  return (
    <Container size="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <Link
              href="/app/qr-codes"
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium mb-2 inline-block"
            >
              ← Back to QR Codes
            </Link>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Analytics
              </h1>
              <Badge variant="brand" size="sm">
                {qrName}
              </Badge>
            </div>
          </div>
        </div>

        {/* Total scans highlight */}
        <Card className="p-6 sm:p-8">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Scans (All Time)</p>
          <p className="text-4xl font-extrabold text-slate-900">{totalScans.toLocaleString()}</p>
        </Card>

        {/* 30-day bar chart */}
        <Card className="p-6 sm:p-8 space-y-4">
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Last 30 Days
          </p>
          <div className="flex items-end gap-[3px] h-40">
            {last30Days.map((day) => {
              const heightPct = (day.count / maxDailyCount) * 100;
              return (
                <div
                  key={day.date}
                  className="flex-1 group relative"
                  style={{ height: '100%' }}
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-800 text-white text-[10px] font-medium px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none">
                    {day.date}: {day.count} scan{day.count !== 1 ? 's' : ''}
                  </div>
                  {/* Bar */}
                  <div
                    className="absolute bottom-0 left-0 right-0 rounded-t bg-indigo-500 hover:bg-indigo-600 transition-colors cursor-default"
                    style={{
                      height: day.count > 0 ? `${Math.max(heightPct, 2)}%` : '2px',
                      backgroundColor: day.count > 0 ? undefined : '#e2e8f0',
                    }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>{last30Days[0]?.date}</span>
            <span>{last30Days[last30Days.length - 1]?.date}</span>
          </div>
        </Card>

        {/* Breakdowns side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Device breakdown */}
          <Card className="p-6 sm:p-8 space-y-4">
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Device Breakdown
            </p>
            {totalDeviceScans === 0 ? (
              <p className="text-sm text-slate-500">No scans yet</p>
            ) : (
              <div className="space-y-3">
                {(
                  [
                    { key: 'ios' as const, label: 'iOS', color: 'bg-blue-500' },
                    { key: 'android' as const, label: 'Android', color: 'bg-emerald-500' },
                    { key: 'desktop' as const, label: 'Desktop', color: 'bg-violet-500' },
                    { key: 'unknown' as const, label: 'Unknown', color: 'bg-slate-400' },
                  ] as const
                ).map(({ key, label, color }) => {
                  const count = deviceBreakdown[key];
                  const pct = totalDeviceScans > 0 ? (count / totalDeviceScans) * 100 : 0;
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-slate-700">{label}</span>
                        <span className="text-slate-500 font-mono">
                          {count.toLocaleString()} ({pct.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${color} transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Country breakdown */}
          <Card className="p-6 sm:p-8 space-y-4">
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Top Countries
            </p>
            {countryBreakdown.length === 0 ? (
              <p className="text-sm text-slate-500">No country data available</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {countryBreakdown.slice(0, 15).map((entry) => (
                  <div
                    key={entry.country}
                    className="flex items-center justify-between py-2 first:pt-0 last:pb-0"
                  >
                    <span className="text-sm font-medium text-slate-700">
                      <span className="font-mono text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded mr-2">
                        {entry.country}
                      </span>
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {entry.count.toLocaleString()} scan{entry.count !== 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </Container>
  );
}
