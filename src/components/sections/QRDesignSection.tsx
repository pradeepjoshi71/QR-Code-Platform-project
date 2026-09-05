import React from 'react';
import { Container } from '../ui/Container';
import { Section } from '../ui/Section';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

export const QRDesignSection: React.FC = () => {
  const designFeatures = [
    {
      title: 'Precision Brand Palettes',
      desc: 'Apply your exact HEX and CMYK colorways to QR modules, backgrounds, and finder eyes without compromising scan contrast standards.',
    },
    {
      title: 'Lossless Center Logo Embeds',
      desc: 'Position brand marks squarely inside the code. Automatic safety margin calculations preserve critical Reed-Solomon data tracks.',
    },
    {
      title: 'Custom Eye & Dot Geometry',
      desc: 'Select from rounded, squircle, or classic sharp module geometries to harmonize with your product packaging design language.',
    },
    {
      title: 'Industrial Pre-Press Ready',
      desc: 'Download resolution-independent SVG, PDF, and EPS vector files engineered specifically for flexographic, offset, and digital commercial printing.',
    },
  ];

  return (
    <Section id="design" variant="default">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Visual Showcase: Brand Variation Samples */}
          <div className="lg:col-span-6 order-2 lg:order-1">
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Design Presets &amp; Brand Consistency</h3>
                  <p className="text-xs text-slate-500">Lossless vector rendering with Level H error correction</p>
                </div>
                <Badge variant="brand" size="sm">Vector Engine</Badge>
              </div>

              {/* Three Visual Samples */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4 text-center">
                {/* Sample 1: Modern Indigo */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-2">
                  <div className="aspect-square bg-indigo-50/60 rounded-lg flex items-center justify-center p-2">
                    <svg className="w-full h-full text-indigo-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2 2h7v7H2zm2 2v3h3V4zm5 0h2v2h-2zm3-2h7v7h-7zm2 2v3h3V4zm-5 5h2v2h-2zm0 3h2v2h-2zm-7 2h7v7H2zm2 2v3h3v-3zm7 0h2v2h-2zm3-4h2v2h-2zm3 0h2v2h-2zm-3 4h2v2h-2zm3 0h2v2h-2z" />
                    </svg>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700 block">Modern Indigo</span>
                </div>

                {/* Sample 2: Emerald Luxe */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-2">
                  <div className="aspect-square bg-emerald-50/60 rounded-lg flex items-center justify-center p-2">
                    <svg className="w-full h-full text-emerald-700" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2 2h7v7H2zm2 2v3h3V4zm5 0h2v2h-2zm3-2h7v7h-7zm2 2v3h3V4zm-5 5h2v2h-2zm0 3h2v2h-2zm-7 2h7v7H2zm2 2v3h3v-3zm7 0h2v2h-2zm3-4h2v2h-2zm3 0h2v2h-2zm-3 4h2v2h-2zm3 0h2v2h-2z" />
                    </svg>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700 block">Emerald Retail</span>
                </div>

                {/* Sample 3: Midnight Dark */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-2">
                  <div className="aspect-square bg-slate-900 rounded-lg flex items-center justify-center p-2">
                    <svg className="w-full h-full text-slate-100" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2 2h7v7H2zm2 2v3h3V4zm5 0h2v2h-2zm3-2h7v7h-7zm2 2v3h3V4zm-5 5h2v2h-2zm0 3h2v2h-2zm-7 2h7v7H2zm2 2v3h3v-3zm7 0h2v2h-2zm3-4h2v2h-2zm3 0h2v2h-2zm-3 4h2v2h-2zm3 0h2v2h-2z" />
                    </svg>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700 block">Monochrome</span>
                </div>
              </div>

              {/* Quality verification specs */}
              <div className="p-3 bg-white rounded-xl border border-slate-200/80 text-xs text-slate-600 flex items-center justify-between">
                <span className="font-medium text-slate-700">Contrast Ratio Verification:</span>
                <span className="font-semibold text-emerald-600">Passed (7.8:1 WCAG AAA Compliant)</span>
              </div>
            </div>
          </div>

          {/* Text Description Column */}
          <div className="lg:col-span-6 space-y-6 order-1 lg:order-2">
            <Badge variant="brand">Customization &amp; Aesthetics</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Brand-Aligned Aesthetics with Uncompromising Scannability
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Never choose between ugly generic black-and-white barcodes and codes that fail to scan. Our design controls uphold strict contrast and error-correction formulas so your codes always scan instantly.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {designFeatures.map((feat) => (
                <Card key={feat.title} className="p-4 sm:p-5 bg-white border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900 mb-1">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {feat.desc}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
};
