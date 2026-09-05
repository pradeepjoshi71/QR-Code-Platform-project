import React from 'react';
import { Container } from '../ui/Container';
import { Section } from '../ui/Section';
import { Badge } from '../ui/Badge';

export const CTASection: React.FC = () => {
  return (
    <Section id="get-started" variant="dark" className="relative">
      {/* Background Subtle Gradient Glow */}
      <div
        className="absolute inset-0 bg-gradient-to-tr from-indigo-950/40 via-transparent to-violet-950/30 pointer-events-none"
        aria-hidden="true"
      />

      <Container className="relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <Badge variant="brand" size="md">
              Early Access Program
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Ready to Modernize Your Physical-to-Digital Touchpoints?
            </h2>
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              We are onboarding founding brands, packaging innovators, and enterprise marketing teams into our Phase QR-P0.1 preview. Join the early access cohort today.
            </p>
          </div>

          {/* Accessible Early Access Form (No fake auth, strictly real front-end early access registration) */}
          <div className="max-w-md mx-auto bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert('Thank you for requesting early access! Our founding engineering team will contact you shortly.');
              }}
              className="space-y-4 text-left"
              aria-label="Early Access Waitlist Form"
            >
              <div>
                <label htmlFor="work-email" className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
                  Work Email Address
                </label>
                <input
                  type="email"
                  id="work-email"
                  name="email"
                  required
                  placeholder="name@company.com"
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label htmlFor="organization-type" className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
                  Primary Use Case
                </label>
                <select
                  id="organization-type"
                  name="useCase"
                  defaultValue="cpg"
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  <option value="cpg">Consumer Packaging &amp; FMCG</option>
                  <option value="retail">Retail &amp; Storefront Displays</option>
                  <option value="events">Events &amp; Dynamic Badging</option>
                  <option value="marketing">Omnichannel &amp; OOH Marketing</option>
                  <option value="hospitality">Hospitality &amp; Menus</option>
                  <option value="other">Other Enterprise Deployment</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all duration-150 shadow-md shadow-indigo-600/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 active:scale-[0.98]"
              >
                Request Platform Invitation
              </button>

              <p className="text-[11px] text-slate-400 text-center pt-2">
                🔒 No credit card required. Account creation opens with Phase P1 General Availability.
              </p>
            </form>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-6 text-xs text-slate-400 pt-4">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Direct Access to Founding Engineers
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Custom Pre-Press Preflight Review
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Priority Onboarding Assistance
            </span>
          </div>
        </div>
      </Container>
    </Section>
  );
};
