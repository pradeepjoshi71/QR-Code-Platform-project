import React from 'react';
import { Container } from '../ui/Container';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 lg:pt-24 lg:pb-32 overflow-hidden bg-gradient-to-b from-slate-50 via-white to-white">
      {/* Background Decorative Grid */}
      <div
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40"
        aria-hidden="true"
      />

      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Hero Left Column: Headline & Value Proposition */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2">
              <Badge variant="brand" size="md">
                Next-Gen QR Infrastructure
              </Badge>
              <span className="hidden sm:inline-block text-xs font-medium text-slate-500">
                Beyond static image generation
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
              Enterprise QR Lifecycle &amp;{' '}
              <span className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-600 bg-clip-text text-transparent">
                Dynamic Engagement
              </span>{' '}
              Platform
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Transform physical touchpoints into intelligent digital experiences. Manage, reroute, and analyze dynamic QR codes at global enterprise scale—without ever reprinting packaging or collateral.
            </p>

            {/* CTAs strictly link to real page sections */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
              <Button href="#get-started" size="lg" variant="primary" className="w-full sm:w-auto">
                Request Early Access
              </Button>
              <Button href="#features" size="lg" variant="outline" className="w-full sm:w-auto">
                Explore Platform Capabilities
              </Button>
            </div>

            {/* Trust Indicators / Differentiator Badges */}
            <div className="pt-6 border-t border-slate-200/80 flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-6 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Dynamic URL Rerouting
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Vector Print Exports (SVG/PDF/EPS)
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Privacy-Preserving Telemetry
              </span>
            </div>
          </div>

          {/* Hero Right Column: Interactive Product Concept Card */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-900/5 border border-slate-200/90 p-6 sm:p-7 relative">
              {/* Card Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    Live Dynamic Route
                  </span>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  ID: qr_prod_982x
                </span>
              </div>

              {/* Dynamic Mockup Content */}
              <div className="py-5 space-y-4">
                {/* QR Visual */}
                <div className="flex justify-center py-2">
                  <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/80 shadow-inner flex flex-col items-center">
                    <svg
                      className="w-36 h-36 text-indigo-900"
                      viewBox="0 0 100 100"
                      fill="currentColor"
                      aria-label="Dynamic QR Code Preview Vector"
                      role="img"
                    >
                      {/* Top-Left Finder */}
                      <rect x="10" y="10" width="28" height="28" rx="4" fill="#4338ca" />
                      <rect x="16" y="16" width="16" height="16" rx="2" fill="#ffffff" />
                      <rect x="20" y="20" width="8" height="8" rx="1" fill="#4338ca" />

                      {/* Top-Right Finder */}
                      <rect x="62" y="10" width="28" height="28" rx="4" fill="#4338ca" />
                      <rect x="68" y="16" width="16" height="16" rx="2" fill="#ffffff" />
                      <rect x="72" y="20" width="8" height="8" rx="1" fill="#4338ca" />

                      {/* Bottom-Left Finder */}
                      <rect x="10" y="62" width="28" height="28" rx="4" fill="#4338ca" />
                      <rect x="16" y="68" width="16" height="16" rx="2" fill="#ffffff" />
                      <rect x="20" y="72" width="8" height="8" rx="1" fill="#4338ca" />

                      {/* Data Matrix Dots */}
                      <rect x="44" y="12" width="5" height="5" rx="1" fill="#6366f1" />
                      <rect x="52" y="12" width="5" height="5" rx="1" fill="#6366f1" />
                      <rect x="44" y="24" width="5" height="5" rx="1" fill="#4f46e5" />
                      <rect x="52" y="32" width="5" height="5" rx="1" fill="#4f46e5" />
                      <rect x="12" y="44" width="5" height="5" rx="1" fill="#6366f1" />
                      <rect x="24" y="48" width="5" height="5" rx="1" fill="#6366f1" />
                      <rect x="44" y="44" width="12" height="12" rx="3" fill="#4338ca" />
                      <rect x="62" y="44" width="5" height="5" rx="1" fill="#6366f1" />
                      <rect x="74" y="48" width="5" height="5" rx="1" fill="#6366f1" />
                      <rect x="82" y="44" width="5" height="5" rx="1" fill="#4338ca" />
                      <rect x="44" y="64" width="5" height="5" rx="1" fill="#6366f1" />
                      <rect x="52" y="72" width="5" height="5" rx="1" fill="#4f46e5" />
                      <rect x="64" y="64" width="5" height="5" rx="1" fill="#4338ca" />
                      <rect x="74" y="72" width="5" height="5" rx="1" fill="#6366f1" />
                      <rect x="82" y="80" width="5" height="5" rx="1" fill="#4338ca" />
                    </svg>
                    <span className="mt-2 text-[11px] font-medium text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-full">
                      Vector Resolution: Lossless SVG
                    </span>
                  </div>
                </div>

                {/* Destination Routing Visual */}
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>Target Destination:</span>
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active (Editable Anytime)
                    </span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200 text-xs font-mono text-slate-800 break-all">
                    https://brand.com/campaign/fall-launch
                  </div>
                </div>

                {/* Scan Resolution Stats */}
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <p className="text-[11px] font-medium text-slate-500">Scan Resolution</p>
                    <p className="text-sm font-bold text-slate-800">&lt; 15ms Edge</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <p className="text-[11px] font-medium text-slate-500">Error Correction</p>
                    <p className="text-sm font-bold text-slate-800">Level H (30%)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};
