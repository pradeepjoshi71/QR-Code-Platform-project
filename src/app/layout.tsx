import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'QR Platform — Enterprise Dynamic QR Management & Engagement',
    template: '%s | QR Platform',
  },
  description:
    'Enterprise-grade Dynamic QR Code management, real-time URL rerouting, precision vector packaging exports, and physical-to-digital customer engagement.',
  applicationName: 'QR Platform',
  keywords: [
    'dynamic qr code',
    'qr code platform',
    'enterprise qr management',
    'qr packaging pre-press',
    'dynamic url routing',
    'qr engagement platform',
  ],
  authors: [{ name: 'QR Code Platform Engineering Team' }],
  creator: 'QR Code Platform',
  publisher: 'QR Code Platform',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'QR Platform',
    title: 'QR Platform — Enterprise Dynamic QR Management & Engagement',
    description:
      'Transform physical touchpoints into intelligent digital channels. Edit destinations anytime, export vector prepress assets, and capture physical engagement.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QR Platform — Enterprise Dynamic QR Management & Engagement',
    description:
      'Transform physical touchpoints into intelligent digital channels with enterprise dynamic QR lifecycle management.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: '#4f46e5',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="flex min-h-screen flex-col bg-white text-slate-900 selection:bg-indigo-500 selection:text-white antialiased">
        {/* Accessible Skip Link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600"
        >
          Skip to main content
        </a>

        <Navbar />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
