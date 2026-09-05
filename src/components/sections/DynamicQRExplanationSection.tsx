import React from 'react';
import { Container } from '../ui/Container';
import { Section } from '../ui/Section';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

export const DynamicQRExplanationSection: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Physical Print Stays Fixed',
      desc: 'The QR matrix encodes a clean, lightweight, platform-managed resolver endpoint (e.g. qr.platform.link/c18x). This never changes on your printed boxes, labels, or posters.',
    },
    {
      step: '02',
      title: 'Instant Edge Resolution',
      desc: 'When scanned, the smartphone reaches an ultra-fast edge gateway that evaluates current campaign rules, schedule windows, and device types in milliseconds.',
    },
    {
      step: '03',
      title: 'Dynamic Redirection',
      desc: 'The visitor is seamlessly redirected to your live marketing URL. Update where the QR points at 2 PM or 2 AM—the change is instant across all millions of active physical codes.',
    },
    {
      step: '04',
      title: 'Privacy-First Telemetry',
      desc: 'Scan velocity, geographical region, and referral attribution are asynchronously processed without delaying visitor redirection or collecting invasive personal data.',
    },
  ];

  return (
    <Section id="dynamic-qr" variant="muted">
      <Container>
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-4">
          <Badge variant="brand">How It Works</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            The Technology Behind Dynamic QR Codes
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            By separating the physical QR code matrix from the destination URL through an edge resolution layer, your printed assets gain limitless digital flexibility.
          </p>
        </div>

        {/* Step Flow Diagram */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((item, idx) => (
            <Card key={item.step} className="relative z-10 flex flex-col justify-between bg-white border-slate-200">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-extrabold text-indigo-600/90 font-mono">
                    {item.step}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Phase {idx + 1}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* Architectural Highlight Box */}
        <div className="mt-12 rounded-2xl bg-indigo-900 text-white p-6 sm:p-8 shadow-lg">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8 space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                Core Architectural Guarantee
              </span>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Eliminate 100% of Physical Reprint Costs
              </h3>
              <p className="text-sm text-indigo-100 leading-relaxed">
                Whether a packaging production run is 10,000 or 10,000,000 units, dynamic destination routing protects your investment against broken URLs, seasonal obsolescence, and branding updates.
              </p>
            </div>
            <div className="lg:col-span-4 flex lg:justify-end">
              <div className="px-5 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 text-center w-full sm:w-auto">
                <p className="text-xs text-indigo-200 font-medium">Redirect Latency</p>
                <p className="text-2xl font-black text-white font-mono">&lt; 20ms</p>
                <p className="text-[11px] text-indigo-300">Global Edge Target</p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
};
