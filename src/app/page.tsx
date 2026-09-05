import React from 'react';
import { HeroSection } from '@/components/sections/HeroSection';
import { PlatformIntroSection } from '@/components/sections/PlatformIntroSection';
import { QRCapabilitiesSection } from '@/components/sections/QRCapabilitiesSection';
import { DynamicQRExplanationSection } from '@/components/sections/DynamicQRExplanationSection';
import { QRDesignSection } from '@/components/sections/QRDesignSection';
import { AnalyticsConceptSection } from '@/components/sections/AnalyticsConceptSection';
import { UseCasesSection } from '@/components/sections/UseCasesSection';
import { PricingSection } from '@/components/sections/PricingSection';
import { ResourcesSection } from '@/components/sections/ResourcesSection';
import { CTASection } from '@/components/sections/CTASection';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <PlatformIntroSection />
      <QRCapabilitiesSection />
      <DynamicQRExplanationSection />
      <QRDesignSection />
      <AnalyticsConceptSection />
      <UseCasesSection />
      <PricingSection />
      <ResourcesSection />
      <CTASection />
    </>
  );
}
