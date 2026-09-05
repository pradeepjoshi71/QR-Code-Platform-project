import React from 'react';
import { Container } from '../ui/Container';
import { Section } from '../ui/Section';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export const PricingSection: React.FC = () => {
  const tiers = [
    {
      name: 'Starter Tier',
      description: 'Ideal for independent creators, boutique packaging, and localized test campaigns.',
      status: 'Included in Early Access',
      features: [
        'Up to 25 active Dynamic QR Codes',
        'Unlimited destination URL edits',
        'Lossless SVG & PNG vector exports',
        'Standard scan velocity telemetry',
      ],
      highlighted: false,
    },
    {
      name: 'Professional Tier',
      description: 'Engineered for growing retail brands, regional distributors, and marketing agencies.',
      status: 'Most Popular',
      features: [
        'Up to 500 active Dynamic QR Codes',
        'Custom brand logos & palette presets',
        'Smart device & language routing rules',
        'Full campaign UTM tag management',
        'Priority high-resolution PDF/EPS exports',
      ],
      highlighted: true,
    },
    {
      name: 'Enterprise Tier',
      description: 'For global CPG manufacturers, nationwide retail chains, and high-throughput deployments.',
      status: 'Custom Scale',
      features: [
        'Unlimited Dynamic QR Codes & Scans',
        'Custom branded short-domain support',
        'Sub-millisecond global edge routing SLA',
        'Dedicated workspace team permissions',
        'Pre-press prepress packaging verification',
      ],
      highlighted: false,
    },
  ];

  return (
    <Section id="pricing" variant="muted">
      <Container>
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-4">
          <Badge variant="brand">Predictable Value</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Transparent Tier Architecture
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Scalable plans designed around dynamic QR lifecycle needs. Request early access today to lock in founding team benefits prior to General Availability.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              className={`flex flex-col justify-between ${
                tier.highlighted
                  ? 'bg-white border-indigo-600 ring-2 ring-indigo-600 shadow-xl shadow-indigo-100'
                  : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                    {tier.name}
                  </h3>
                  <Badge variant={tier.highlighted ? 'brand' : 'neutral'} size="sm">
                    {tier.status}
                  </Badge>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">
                  {tier.description}
                </p>

                <div className="pt-2 pb-2 border-b border-slate-100">
                  <span className="text-2xl font-black text-slate-900">Early Access</span>
                  <span className="text-xs text-slate-500 block mt-0.5">Founding member reservations open</span>
                </div>

                <ul className="space-y-2.5 pt-2 text-xs sm:text-sm text-slate-700">
                  {tier.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5">
                      <svg
                        className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6">
                <Button
                  href="#get-started"
                  variant={tier.highlighted ? 'primary' : 'outline'}
                  size="md"
                  className="w-full justify-center"
                >
                  Reserve {tier.name}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  );
};
