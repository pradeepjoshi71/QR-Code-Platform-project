'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Container } from '../ui/Container';
import { Button } from '../ui/Button';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Solutions', href: '#solutions' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Resources', href: '#resources' },
  ];

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-200 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-xs border-b border-slate-200/80'
          : 'bg-white/80 backdrop-blur-sm border-b border-slate-100'
      }`}
    >
      <Container>
        <div className="flex h-16 sm:h-20 items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 text-slate-900 font-bold text-lg sm:text-xl tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 rounded-lg py-1 px-1.5"
            aria-label="QR Code Platform Home"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
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
            <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              QR Platform
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav
            aria-label="Main Navigation"
            className="hidden md:flex items-center gap-1 lg:gap-2"
          >
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-1"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop Action Buttons (Only links to real existing sections) */}
          <div className="hidden md:flex items-center gap-2.5">
            <Button
              href="#get-started"
              variant="ghost"
              size="sm"
              aria-label="Sign in to early access platform"
            >
              Sign In
            </Button>
            <Button
              href="#get-started"
              variant="primary"
              size="sm"
              aria-label="Get started with early access"
            >
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation-menu"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileMenuOpen ? (
              <svg
                className="w-6 h-6"
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
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div
            id="mobile-navigation-menu"
            className="md:hidden border-t border-slate-200/80 py-4 px-2 space-y-2 bg-white/95 backdrop-blur-md animate-in fade-in-50 duration-150"
          >
            <nav aria-label="Mobile Navigation" className="flex flex-col space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-lg text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Button
                href="#get-started"
                variant="outline"
                size="md"
                className="w-full justify-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Button>
              <Button
                href="#get-started"
                variant="primary"
                size="md"
                className="w-full justify-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Started
              </Button>
            </div>
          </div>
        )}
      </Container>
    </header>
  );
};
