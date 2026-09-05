import React from 'react';
import { Container } from '../ui/Container';
import { Section } from '../ui/Section';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

export const UseCasesSection: React.FC = () => {
  const useCases = [
    {
      title: 'CPG & Smart Consumer Packaging',
      description:
        'Print dynamic QRs directly on FMCG boxes and bottles. Connect buyers to dynamic recipes, supply-chain transparency, warranty registration, or loyalty rewards.',
      icon: (
        <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      highlight: 'Zero reprint risk',
    },
    {
      title: 'Retail Storefronts & Showrooms',
      description:
        'Bridge window shoppers to in-stock inventory, customer reviews, and contactless self-checkout on mobile without requiring a dedicated native app install.',
      icon: (
        <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      highlight: 'Frictionless checkout',
    },
    {
      title: 'Events, Badging & Conferences',
      description:
        'Manage live attendee badge verification, agenda distribution, speaker slides, and digital business card exchanges with instant schedule updates.',
      icon: (
        <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      ),
      highlight: 'Real-time agendas',
    },
    {
      title: 'OOH & Billboards Marketing',
      description:
        'Track physical conversion and scan attribution from massive outdoor billboards, subway posters, and transit media directly into your attribution stack.',
      icon: (
        <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      ),
      highlight: 'Full UTM attribution',
    },
    {
      title: 'Hospitality & Contactless Menus',
      description:
        'Deliver lightning-fast, multi-language digital menus that staff can update instantly based on daily specials, allergen notices, or inventory shortages.',
      icon: (
        <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      highlight: 'Dynamic menu updates',
    },
    {
      title: 'Direct-to-Consumer Warranty & Support',
      description:
        'Include serial-linked dynamic QR stickers inside product manuals. Customers get instantaneous access to onboarding videos and claim portals.',
      icon: (
        <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      highlight: 'Self-serve support',
    },
  ];

  return (
    <Section id="solutions" variant="default">
      <Container>
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-4">
          <Badge variant="brand">Industry Solutions</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Designed for Real-World Physical Scale
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            From industrial supply chains to localized restaurant experiences, dynamic QR management solves core operational bottlenecks across industries.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {useCases.map((uc) => (
            <Card key={uc.title} hoverable className="flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100/80 flex items-center justify-center">
                    {uc.icon}
                  </div>
                  <Badge variant="neutral" size="sm">
                    {uc.highlight}
                  </Badge>
                </div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  {uc.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {uc.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  );
};
