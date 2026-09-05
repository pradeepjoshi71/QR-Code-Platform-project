import React from 'react';
import { Container } from '../ui/Container';
import { Section } from '../ui/Section';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

export const AnalyticsConceptSection: React.FC = () => {
  const telemetryMetrics = [
    {
      title: 'Scan Velocity & Time Trends',
      description:
        'Quantify peak engagement hours, days of the week, and campaign surge velocity following physical product drops or television broadcasts.',
      category: 'Temporal Analytics',
    },
    {
      title: 'Operating System & Hardware',
      description:
        'Understand your audience distribution between iOS and Android. Route users to platform-specific app stores or adaptive web experiences automatically.',
      category: 'Device Intelligence',
    },
    {
      title: 'Coarse Geolocation Mapping',
      description:
        'Identify regional scan clusters across states and metro areas without violating consumer privacy regulations (GDPR & CCPA compliant).',
      category: 'Geographic Insights',
    },
    {
      title: 'Campaign & UTM Source Attribution',
      description:
        'Append dynamic UTM tags and channel identifiers to measure physical ROI across in-store displays, print flyers, and product packaging.',
      category: 'Attribution Tracking',
    },
  ];

  return (
    <Section id="analytics" variant="muted">
      <Container>
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-4">
          <Badge variant="brand">Telemetry Architecture</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Physical-to-Digital Engagement Intelligence
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Close the loop between real-world touchpoints and digital analytics. Discover how, when, and where physical customers interact with your products.
          </p>
        </div>

        {/* Conceptual Dashboard Diagram */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Telemetry Model Framework (Phase P3 Architecture)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Decoupled asynchronous telemetry pipeline ensuring sub-20ms edge redirects
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200/60">
                Architectural Preview • Zero Fake Metrics
              </span>
            </div>
          </div>

          {/* Conceptual Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-xs font-medium text-slate-500">Scan Pipeline Latency</span>
              <p className="text-xl font-extrabold text-slate-900 font-mono">&lt; 15 ms</p>
              <span className="text-[11px] text-indigo-600 font-medium">Asynchronous buffer</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-xs font-medium text-slate-500">Device Classification</span>
              <p className="text-xl font-extrabold text-slate-900 font-mono">iOS &amp; Android</p>
              <span className="text-[11px] text-emerald-600 font-medium">Auto-smart routing</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-xs font-medium text-slate-500">Geo Resolution</span>
              <p className="text-xl font-extrabold text-slate-900 font-mono">City / Region</p>
              <span className="text-[11px] text-slate-500 font-medium">Privacy-safe aggregate</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-xs font-medium text-slate-500">Campaign Attribution</span>
              <p className="text-xl font-extrabold text-slate-900 font-mono">Full UTM Flow</p>
              <span className="text-[11px] text-indigo-600 font-medium">Downstream analytics</span>
            </div>
          </div>
        </div>

        {/* Breakdown of Analytics Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {telemetryMetrics.map((metric) => (
            <Card key={metric.title} className="bg-white border-slate-200">
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                  {metric.category}
                </span>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  {metric.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {metric.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  );
};
