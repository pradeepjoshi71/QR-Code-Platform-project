'use client';

import React from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { Button } from '@/components/ui/Button';

export const AppNavbar: React.FC = () => {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Brand & Workspace Switcher */}
          <div className="flex items-center gap-4 sm:gap-6">
            <Link
              href="/app"
              className="flex items-center gap-2 text-slate-900 font-bold text-base sm:text-lg tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded-lg p-1"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xs">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                </svg>
              </div>
              <span className="hidden sm:inline-block">QR Platform</span>
            </Link>

            <div className="h-5 w-[1px] bg-slate-200 hidden sm:block" />

            <WorkspaceSwitcher />

            <nav className="hidden md:flex items-center gap-2">
              <Link
                href="/app"
                className="text-xs font-medium text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-md hover:bg-slate-50 transition-colors"
              >
                Overview
              </Link>
              <Link
                href="/app/qr-codes"
                className="text-xs font-medium text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-md hover:bg-slate-50 transition-colors"
              >
                QR Codes
              </Link>
            </nav>
          </div>

          {/* User Profile & Sign Out */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-900 leading-none">
                {session?.user?.name || 'User'}
              </p>
              <p className="text-[11px] text-slate-500 font-normal leading-tight mt-0.5 truncate max-w-[150px]">
                {session?.user?.email}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-slate-600 hover:text-slate-900 border-slate-200"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
