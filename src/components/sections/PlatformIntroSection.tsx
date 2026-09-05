import React from 'react';
import { Container } from '../ui/Container';
import { Section } from '../ui/Section';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

export const PlatformIntroSection: React.FC = () => {
  const differentiators = [
    {
      badge: 'Obsolete Approach',
      badgeVariant: 'neutral' as const,
      title: 'Traditional Static Generators',
      description:
        'Basic generators bake URLs directly into fixed pixel matrices. Once printed, a single typo, expired promotion, or changed campaign destroys your collateral and breaks customer experience.',
      features: [
        'Permanent fixed destination URL',
        'No scan analytics or telemetry',
        'Reprint costs when campaigns evolve',
        'Zero security or governance controls',
      ],
      negative: true,
    },
    {
      badge: 'Platform Standard',
      badgeVariant: 'brand' as const,
      title: 'Our Enterprise QR Lifecycle Platform',
      description:
        'Dynamic QR codes route through an ultra-fast edge resolution layer. Update campaign destinations in real time, apply conditional smart rules, and maintain central governance across all brand packaging.',
      features: [
        'Instant live URL redirect changes anytime',
        'Enterprise campaign and workspace segregation',
        'Precision vector exports for packaging prepress',
        'Full physical-to-digital engagement tracking',
      ],
      negative: false,
    },
  ];

  return (
    <Section id="features" variant="muted">
      <Container>
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-4">
          <Badge variant="brand">Platform vs Generator</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Stop Treating QR Codes Like Disposable Static Images
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            In modern consumer packaging, retail operations, and global marketing, a QR code is not a graphic asset—it is a continuous digital channel connecting physical products with your customer.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {differentiators.map((diff) => (
            <Card
              key={diff.title}
              className={`flex flex-col justify-between ${
                diff.negative
                  ? 'bg-slate-50/70 border-slate-200'
                  : 'bg-white border-indigo-200 shadow-md shadow-indigo-100/50 ring-1 ring-indigo-500/20'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant={diff.badgeVariant} size="sm">
                    {diff.badge}
                  </Badge>
                  {diff.negative ? (
                    <span className="text-xs text-rose-500 font-medium flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      High Risk
                    </span>
                  ) : (
                    <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Enterprise Grade
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  {diff.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {diff.description}
                </p>

                <ul className="space-y-2.5 pt-3 border-t border-slate-100">
                  {diff.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                      {diff.negative ? (
                        <svg
                          className="w-4 h-4 text-rose-400 shrink-0 mt-0.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                          aria-hidden="true"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      ) : (
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
                      )}
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  );
};
