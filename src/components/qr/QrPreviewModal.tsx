'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface StyleConfig {
  fgColor?: string;
  bgColor?: string;
  logoUrl?: string;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

interface QrPreviewModalProps {
  name: string;
  type: 'STATIC' | 'DYNAMIC';
  targetUrl: string;
  styleConfig?: StyleConfig | null;
  onClose: () => void;
}

export const QrPreviewModal: React.FC<QrPreviewModalProps> = ({
  name,
  type,
  targetUrl,
  styleConfig,
  onClose,
}) => {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [pngDataUrl, setPngDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadQR = async () => {
      setLoading(true);
      try {
        // Build style query params
        const styleParams = new URLSearchParams();
        if (styleConfig?.fgColor) styleParams.set('fgColor', styleConfig.fgColor);
        if (styleConfig?.bgColor) styleParams.set('bgColor', styleConfig.bgColor);
        if (styleConfig?.logoUrl) styleParams.set('logoUrl', styleConfig.logoUrl);
        if (styleConfig?.errorCorrectionLevel) styleParams.set('ecl', styleConfig.errorCorrectionLevel);
        const styleQuery = styleParams.toString() ? `&${styleParams.toString()}` : '';

        // Fetch SVG
        const svgRes = await fetch(
          `/api/qr-codes/render?text=${encodeURIComponent(targetUrl)}&format=svg${styleQuery}`
        );
        if (svgRes.ok && isMounted) {
          const svgText = await svgRes.text();
          setSvgContent(svgText);
        }

        // Fetch PNG Data URL
        const pngRes = await fetch(
          `/api/qr-codes/render?text=${encodeURIComponent(targetUrl)}&format=png${styleQuery}`
        );
        if (pngRes.ok && isMounted) {
          const data = await pngRes.json();
          setPngDataUrl(data.dataUrl);
        }
      } catch (err) {
        console.error('Failed to render QR Code Preview:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadQR();
    return () => {
      isMounted = false;
    };
  }, [targetUrl, styleConfig]);

  const handleDownloadSVG = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-qr.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPNG = () => {
    if (!pngDataUrl) return;
    const link = document.createElement('a');
    link.href = pngDataUrl;
    link.download = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-qr.png`;
    link.click();
  };

  // Derive color preview swatches from styleConfig
  const fgColor = styleConfig?.fgColor || '#000000';
  const bgColor = styleConfig?.bgColor || '#ffffff';
  const hasCustomStyle =
    fgColor !== '#000000' || bgColor !== '#ffffff' || Boolean(styleConfig?.logoUrl);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in-50">
      <Card className="max-w-md w-full p-6 sm:p-8 bg-white shadow-2xl relative space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{name}</h3>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 uppercase">
              {type} QR
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* QR Visual */}
        <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-100 min-h-[220px]">
          {loading ? (
            <div className="text-sm font-medium text-slate-500 animate-pulse">Rendering high-res vector...</div>
          ) : svgContent ? (
            <div
              className="w-48 h-48 [&>svg]:w-full [&>svg]:h-full"
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          ) : (
            <div className="text-sm text-rose-500">Failed to render QR Code</div>
          )}
        </div>

        {/* Style summary */}
        {hasCustomStyle && (
          <div className="flex flex-wrap items-center gap-2 px-1">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Style:</span>
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-700"
            >
              <span
                className="inline-block w-3.5 h-3.5 rounded-sm border border-slate-300"
                style={{ backgroundColor: fgColor }}
                title={`Foreground: ${fgColor}`}
              />
              <span
                className="inline-block w-3.5 h-3.5 rounded-sm border border-slate-300"
                style={{ backgroundColor: bgColor }}
                title={`Background: ${bgColor}`}
              />
              {styleConfig?.logoUrl && (
                <span className="text-indigo-600 font-semibold">+ Logo</span>
              )}
            </span>
          </div>
        )}

        {/* Destination Target Info */}
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 text-xs">
          <p className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Encoded Target</p>
          <p className="font-mono text-slate-800 break-all mt-0.5">{targetUrl}</p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownloadSVG}
            disabled={!svgContent}
            className="justify-center"
          >
            Download SVG
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleDownloadPNG}
            disabled={!pngDataUrl}
            className="justify-center"
          >
            Download PNG
          </Button>
        </div>
      </Card>
    </div>
  );
};
