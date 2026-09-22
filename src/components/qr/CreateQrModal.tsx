'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface CreateQrModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateQrModal: React.FC<CreateQrModalProps> = ({ onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'STATIC' | 'DYNAMIC'>('DYNAMIC');
  const [destinationUrl, setDestinationUrl] = useState('');
  // Style fields
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [logoUrl, setLogoUrl] = useState('');
  const [scheduledStart, setScheduledStart] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  // Device routing rules — DYNAMIC only
  const [iosUrl, setIosUrl] = useState('');
  const [androidUrl, setAndroidUrl] = useState('');
  const [desktopUrl, setDesktopUrl] = useState('');
  // Geo rules — DYNAMIC only. Stored as array of rows for easy add/remove UI.
  type GeoRow = { countryCode: string; url: string };
  const [geoRows, setGeoRows] = useState<GeoRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const styleConfig = {
      fgColor,
      bgColor,
      ...(logoUrl.trim() ? { logoUrl: logoUrl.trim() } : {}),
    };

    try {
      const res = await fetch('/api/qr-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type,
          destinationUrl,
          styleConfig,
          ...(type === 'DYNAMIC' && scheduledStart ? { scheduledStart } : {}),
          ...(type === 'DYNAMIC' && expiresAt ? { expiresAt } : {}),
          // Include routingRules for DYNAMIC if any device URL is provided
          ...(type === 'DYNAMIC' && (iosUrl.trim() || androidUrl.trim() || desktopUrl.trim())
            ? {
                routingRules: {
                  ...(iosUrl.trim() ? { ios: iosUrl.trim() } : {}),
                  ...(androidUrl.trim() ? { android: androidUrl.trim() } : {}),
                  ...(desktopUrl.trim() ? { desktop: desktopUrl.trim() } : {}),
                },
              }
            : {}),
          // Include geoRules for DYNAMIC if any valid geo row is provided
          ...(type === 'DYNAMIC'
            ? (() => {
                const validRows = geoRows.filter(
                  (r) => r.countryCode.trim().length >= 2 && r.url.trim()
                );
                if (validRows.length === 0) return {};
                return {
                  geoRules: Object.fromEntries(
                    validRows.map((r) => [r.countryCode.trim().toUpperCase(), r.url.trim()])
                  ),
                };
              })()
            : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create QR code.');
        setLoading(false);
        return;
      }

      onSuccess();
    } catch {
      setError('An unexpected network error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in-50">
      <Card className="max-w-lg w-full p-6 sm:p-8 bg-white shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-lg font-bold text-slate-900">Create New QR Code</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              QR Code Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Summer Promo Packaging, Storefront Window"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              QR Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('DYNAMIC')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  type === 'DYNAMIC'
                    ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Dynamic QR</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                    Recommended
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Editable destination anytime without reprinting.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setType('STATIC')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  type === 'STATIC'
                    ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="text-xs font-bold text-slate-900">Static QR</span>
                <p className="text-[11px] text-slate-500 mt-1">
                  Fixed target hardcoded directly into pixels.
                </p>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Destination URL
            </label>
            <input
              type="url"
              required
              placeholder="https://example.com/campaign"
              value={destinationUrl}
              onChange={(e) => setDestinationUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          {/* Styling Section */}
          <div className="pt-1 border-t border-slate-100 space-y-3">
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Styling <span className="text-slate-400 font-normal normal-case">(optional)</span>
            </p>

            {/* Color pickers */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Foreground Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="h-9 w-10 rounded-md border border-slate-300 cursor-pointer p-0.5 bg-white"
                    title="Pick foreground (QR module) color"
                  />
                  <input
                    type="text"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    pattern="^#[0-9A-Fa-f]{6}$"
                    maxLength={7}
                    className="flex-1 px-2.5 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    placeholder="#000000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Background Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="h-9 w-10 rounded-md border border-slate-300 cursor-pointer p-0.5 bg-white"
                    title="Pick background color"
                  />
                  <input
                    type="text"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    pattern="^#[0-9A-Fa-f]{6}$"
                    maxLength={7}
                    className="flex-1 px-2.5 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    placeholder="#ffffff"
                  />
                </div>
              </div>
            </div>

            {/* Logo URL */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Logo URL{' '}
                <span className="text-slate-400 font-normal normal-case">
                  — hosted image (https://…). Forces error correction to H.
                </span>
              </label>
              <input
                type="url"
                placeholder="https://cdn.example.com/logo.png"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>
          </div>

          {/* Scheduling Section — Dynamic QR codes only */}
          {type === 'DYNAMIC' && (
            <div className="pt-1 border-t border-slate-100 space-y-3">
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Scheduling <span className="text-slate-400 font-normal normal-case">(optional)</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Starts on
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledStart}
                    onChange={(e) => setScheduledStart(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Leave blank to activate immediately.</p>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Expires on
                  </label>
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Leave blank to never expire.</p>
                </div>
              </div>
            </div>
          )}

          {/* Device Rules Section — Dynamic QR codes only */}
          {type === 'DYNAMIC' && (
            <div className="pt-1 border-t border-slate-100 space-y-3">
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Device Rules{' '}
                <span className="text-slate-400 font-normal normal-case">(optional — override destination per device)</span>
              </p>
              <div className="space-y-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    iOS URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://apps.apple.com/…"
                    value={iosUrl}
                    onChange={(e) => setIosUrl(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Android URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://play.google.com/…"
                    value={androidUrl}
                    onChange={(e) => setAndroidUrl(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Desktop URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/desktop-landing"
                    value={desktopUrl}
                    onChange={(e) => setDesktopUrl(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400">
                Leave all blank to use the default destination URL for all devices.
              </p>
            </div>
          )}

          {/* Geo Rules Section — Dynamic QR codes only */}
          {type === 'DYNAMIC' && (
            <div className="pt-1 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Geo Rules{' '}
                  <span className="text-slate-400 font-normal normal-case">(optional — redirect by country)</span>
                </p>
                <button
                  type="button"
                  onClick={() => setGeoRows((prev) => [...prev, { countryCode: '', url: '' }])}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                >
                  + Add Row
                </button>
              </div>
              {geoRows.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">No geo rules set — all visitors use the default destination.</p>
              ) : (
                <div className="space-y-2">
                  {geoRows.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="US"
                        maxLength={2}
                        value={row.countryCode}
                        onChange={(e) =>
                          setGeoRows((prev) =>
                            prev.map((r, i) =>
                              i === idx ? { ...r, countryCode: e.target.value.toUpperCase() } : r
                            )
                          )
                        }
                        className="w-14 px-2 py-2 rounded-lg border border-slate-300 text-xs font-mono text-center focus:outline-none focus:ring-2 focus:ring-indigo-600 uppercase"
                        title="ISO 3166-1 alpha-2 country code (e.g. US, IN, GB)"
                      />
                      <input
                        type="url"
                        placeholder="https://example.com/landing"
                        value={row.url}
                        onChange={(e) =>
                          setGeoRows((prev) =>
                            prev.map((r, i) => (i === idx ? { ...r, url: e.target.value } : r))
                          )
                        }
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                      <button
                        type="button"
                        onClick={() => setGeoRows((prev) => prev.filter((_, i) => i !== idx))}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                        title="Remove row"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-slate-400">
                Use 2-letter ISO country codes (e.g. US, IN, GB). Geo matching only works on Vercel — locally the header is absent and this rule is skipped.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={loading}>
              {loading ? 'Creating...' : 'Create QR Code'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
