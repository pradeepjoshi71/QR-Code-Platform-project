'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface StyleConfig {
  fgColor?: string;
  bgColor?: string;
  logoUrl?: string;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

interface RoutingRules {
  ios?: string;
  android?: string;
  desktop?: string;
}

interface EditQrModalProps {
  qrCode: {
    id: string;
    name: string;
    type: 'STATIC' | 'DYNAMIC';
    destinationUrl: string;
    isActive: boolean;
    styleConfig?: StyleConfig | null;
    scheduledStart?: string | null;
    expiresAt?: string | null;
    routingRules?: RoutingRules | null;
    geoRules?: Record<string, string> | null;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export const EditQrModal: React.FC<EditQrModalProps> = ({ qrCode, onClose, onSuccess }) => {
  const [name, setName] = useState(qrCode.name);
  const [destinationUrl, setDestinationUrl] = useState(qrCode.destinationUrl);
  const [isActive, setIsActive] = useState(qrCode.isActive);
  // Style fields — initialized from existing styleConfig
  const [fgColor, setFgColor] = useState(qrCode.styleConfig?.fgColor || '#000000');
  const [bgColor, setBgColor] = useState(qrCode.styleConfig?.bgColor || '#ffffff');
  const [logoUrl, setLogoUrl] = useState(qrCode.styleConfig?.logoUrl || '');
  // Scheduling — initialize from ISO string, convert to datetime-local format
  const toDatetimeLocal = (iso: string | null | undefined) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    // datetime-local expects "YYYY-MM-DDTHH:mm"
    return d.toISOString().slice(0, 16);
  };
  const [scheduledStart, setScheduledStart] = useState(toDatetimeLocal(qrCode.scheduledStart));
  const [expiresAt, setExpiresAt] = useState(toDatetimeLocal(qrCode.expiresAt));
  // Device routing rules — DYNAMIC only
  const [iosUrl, setIosUrl] = useState(qrCode.routingRules?.ios ?? '');
  const [androidUrl, setAndroidUrl] = useState(qrCode.routingRules?.android ?? '');
  const [desktopUrl, setDesktopUrl] = useState(qrCode.routingRules?.desktop ?? '');
  // Geo rules — DYNAMIC only. Stored as array of rows for easy add/remove UI.
  type GeoRow = { countryCode: string; url: string };
  const initGeoRows = (): GeoRow[] => {
    if (!qrCode.geoRules || typeof qrCode.geoRules !== 'object') return [];
    return Object.entries(qrCode.geoRules).map(([countryCode, url]) => ({ countryCode, url }));
  };
  const [geoRows, setGeoRows] = useState<GeoRow[]>(initGeoRows);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const styleConfig: StyleConfig = {
      fgColor,
      bgColor,
      ...(logoUrl.trim() ? { logoUrl: logoUrl.trim() } : {}),
    };

    try {
      const res = await fetch(`/api/qr-codes/${qrCode.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          isActive,
          ...(qrCode.type === 'DYNAMIC' ? { destinationUrl } : {}),
          styleConfig,
          // Always send scheduling fields for DYNAMIC (null clears them)
          ...(qrCode.type === 'DYNAMIC'
            ? {
                scheduledStart: scheduledStart || null,
                expiresAt: expiresAt || null,
              }
            : {}),
          // Send routingRules for DYNAMIC (null clears all rules)
          ...(qrCode.type === 'DYNAMIC'
            ? {
                routingRules:
                  iosUrl.trim() || androidUrl.trim() || desktopUrl.trim()
                    ? {
                        ...(iosUrl.trim() ? { ios: iosUrl.trim() } : {}),
                        ...(androidUrl.trim() ? { android: androidUrl.trim() } : {}),
                        ...(desktopUrl.trim() ? { desktop: desktopUrl.trim() } : {}),
                      }
                    : null,
              }
            : {}),
          // Send geoRules for DYNAMIC (null clears all rules)
          ...(qrCode.type === 'DYNAMIC'
            ? {
                geoRules: (() => {
                  const validRows = geoRows.filter(
                    (r) => r.countryCode.trim().length >= 2 && r.url.trim()
                  );
                  if (validRows.length === 0) return null;
                  return Object.fromEntries(
                    validRows.map((r) => [r.countryCode.trim().toUpperCase(), r.url.trim()])
                  );
                })(),
              }
            : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to update QR code.');
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
          <div>
            <h3 className="text-lg font-bold text-slate-900">Edit QR Code</h3>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
              {qrCode.type}
            </span>
          </div>
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          {qrCode.type === 'DYNAMIC' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Dynamic Destination URL
              </label>
              <input
                type="url"
                required
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
              <p className="text-[11px] text-emerald-600 font-medium mt-1">
                ✓ Dynamic routing: Changes take effect immediately without modifying the printed code.
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Static Destination URL (Immutable)
              </label>
              <input
                type="text"
                disabled
                value={qrCode.destinationUrl}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-100 text-sm text-slate-500 cursor-not-allowed"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Static QR codes encode target URLs permanently. To change destinations, create a Dynamic QR code.
              </p>
            </div>
          )}

          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <span className="text-sm font-semibold text-slate-800">
                Active status (allows dynamic redirect resolution)
              </span>
            </label>
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
          {qrCode.type === 'DYNAMIC' && (
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
          {qrCode.type === 'DYNAMIC' && (
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
          {qrCode.type === 'DYNAMIC' && (
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
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
