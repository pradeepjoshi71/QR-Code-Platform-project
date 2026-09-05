import React from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-20 bg-slate-50/50">
      <Container size="sm">
        <div className="text-center space-y-6 bg-white border border-slate-200/90 rounded-2xl p-8 sm:p-12 shadow-sm">
          <div className="flex justify-center">
            <Badge variant="warning" size="md">
              404 • Destination Not Found
            </Badge>
          </div>

          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600">
            <svg
              className="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l4-4m0 4l-4-4" />
            </svg>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Page or QR Route Not Found
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto leading-relaxed">
              The page you are trying to reach does not exist or the dynamic redirect short-code has not been registered.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button href="/" variant="primary" size="md">
              Return to Platform Home
            </Button>
            <Button href="/#get-started" variant="outline" size="md">
              Contact Platform Support
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
}
