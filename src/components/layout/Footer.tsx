import React from 'react';
import Link from 'next/link';
import { Container } from '../ui/Container';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800" aria-label="Site Footer">
      <Container>
        <div className="py-12 sm:py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 text-white font-bold text-lg tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg p-1"
              aria-label="QR Code Platform Home"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white">
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <path d="M7 7h.01M17 7h.01M7 17h.01M17 17h.01" />
                </svg>
              </div>
              <span>QR Platform</span>
            </Link>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Enterprise QR lifecycle, dynamic routing, and omnichannel physical-to-digital engagement platform. Designed for marketing teams, CPG brands, and forward-thinking enterprises.
            </p>
            <div className="pt-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
                Phase QR-P0.1 Public Website Preview
              </span>
            </div>
          </div>

          {/* Capabilities Col */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-4">
              Platform
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="#features" className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400 rounded">
                  Core Features
                </a>
              </li>
              <li>
                <a href="#dynamic-qr" className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400 rounded">
                  Dynamic QR Routing
                </a>
              </li>
              <li>
                <a href="#design" className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400 rounded">
                  Vector Customization
                </a>
              </li>
              <li>
                <a href="#analytics" className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400 rounded">
                  Scan Telemetry Concept
                </a>
              </li>
            </ul>
          </div>

          {/* Solutions Col */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-4">
              Solutions
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="#solutions" className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400 rounded">
                  CPG & Smart Packaging
                </a>
              </li>
              <li>
                <a href="#solutions" className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400 rounded">
                  Retail & Store Fronts
                </a>
              </li>
              <li>
                <a href="#solutions" className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400 rounded">
                  Events & Ticketing
                </a>
              </li>
              <li>
                <a href="#solutions" className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400 rounded">
                  Omnichannel Marketing
                </a>
              </li>
            </ul>
          </div>

          {/* Resources & Status Col */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-4">
              Resources
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="#resources" className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400 rounded">
                  Architecture Overview
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400 rounded">
                  Platform Pricing
                </a>
              </li>
              <li>
                <a href="#get-started" className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400 rounded">
                  Early Access Program
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400 rounded">
                  System Capabilities
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} QR Code Platform. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="text-slate-400">Strictly Zero Fake Auth / No Fabricated Telemetry</span>
            <a href="#top" className="hover:text-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400 rounded">
              Back to Top ↑
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
};
