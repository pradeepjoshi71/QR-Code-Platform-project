import React from 'react';
import { Container } from '../ui/Container';
import { Section } from '../ui/Section';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

export const QRCapabilitiesSection: React.FC = () => {
  const capabilities = [
    {
      title: 'Dynamic Redirect Lifecycles',
      description:
        'Swap destination URLs on the fly at any time. Reassign seasonal packaging to new product drops without reprinting physical collateral.',
      icon: (
        <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
    },
    {
      title: 'Pre-Press Vector Exports',
      description:
        'Generate CMYK-ready vector assets in SVG, PDF, and EPS formats alongside high-resolution raster PNGs for industrial packaging lines.',
      icon: (
        <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      title: 'Conditional Smart Routing Rules',
      description:
        'Route visitors to different web experiences based on scanning device (iOS vs. Android app store), time of day, or localization.',
      icon: (
        <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      title: 'Precision Error Correction (L to H)',
      description:
        'Fine-tune Reed-Solomon error correction from 7% (L) up to 30% (H) so embedded center logos or damaged packaging never disrupt scan reliability.',
      icon: (
        <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      title: 'Campaign & Brand Asset Isolation',
      description:
        'Organize codes into dedicated product lines and marketing campaigns. Maintain brand consistency with shared palette presets.',
      icon: (
        <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      title: 'Sub-Millisecond Edge Architecture',
      description:
        'Engineered for instant global scan resolution. Zero redirect lag ensures frictionless customer conversion from billboard to phone.',
      icon: (
        <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
  ];

  return (
    <Section id="capabilities" variant="default">
      <Container>
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-4">
          <Badge variant="brand">Enterprise Architecture</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Engineered for High-Stakes Physical Deployments
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            When you print 500,000 product boxes, failure is not an option. Our platform capabilities ensure rock-solid scannability, flexibility, and brand integrity.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {capabilities.map((cap) => (
            <Card key={cap.title} hoverable className="flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-4">
                  {cap.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  {cap.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {cap.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  );
};
