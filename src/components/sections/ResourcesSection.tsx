import React from 'react';
import { Container } from '../ui/Container';
import { Section } from '../ui/Section';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

export const ResourcesSection: React.FC = () => {
  const resources = [
    {
      title: 'Platform Architecture & Evolution Roadmap',
      desc: 'Read the comprehensive specification separating our current QR-P0.1 public website from upcoming SaaS, redirect router, and telemetry stages.',
      tag: 'Documentation',
      link: '#features',
    },
    {
      title: 'Packaging Pre-Press & Contrast Standards',
      desc: 'Guidelines for flexographic, digital, and gravure printing. How to maintain minimum 4:1 print contrast and quiet zone boundaries.',
      tag: 'Technical Guide',
      link: '#design',
    },
    {
      title: 'Reed-Solomon Error Correction Explained',
      desc: 'Why choosing between Level L (7%), M (15%), Q (25%), and H (30%) impacts logo embeds, physical damage tolerance, and data matrix density.',
      tag: 'Engineering Deep Dive',
      link: '#capabilities',
    },
  ];

  return (
    <Section id="resources" variant="default">
      <Container>
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-4">
          <Badge variant="brand">Knowledge &amp; Standards</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Developer &amp; Pre-Press Resources
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Essential technical specifications and standards for deploying QR codes at industrial packaging and enterprise scale.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {resources.map((item) => (
            <Card key={item.title} hoverable className="flex flex-col justify-between">
              <div className="space-y-3">
                <Badge variant="neutral" size="sm">
                  {item.tag}
                </Badge>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>
              <div className="pt-4 mt-2 border-t border-slate-100">
                <a
                  href={item.link}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded"
                >
                  Explore Section →
                </a>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  );
};
