# QR Code Platform

An enterprise-grade Dynamic QR Code Management and Engagement Platform engineered for modern businesses, brand marketers, and physical-to-digital omnichannel experiences.

## Current Phase: QR-P2.0 (QR Generation Core & Dynamic Redirect)

This repository is currently in **Phase QR-P2.0 (QR Generation Core + Dynamic Redirect)**.

In this phase, we introduce the full QR engine supporting Static and Dynamic QR codes, database models (`QrCode` scoped to active multi-tenant workspace organizations), high-performance 302 redirection at `/r/[shortCode]`, vector SVG and PNG rendering pipelines, active toggle switches, and the authenticated dashboard management interface at `/app/qr-codes`.

Subsequent architectural layers (QR styling/logos/presets, scan analytics ingestion, and billing) are documented in [`docs/architecture/overview.md`](./docs/architecture/overview.md) and will be introduced in future platform milestones.

---

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server-First Architecture)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **UI & Styling**: [Tailwind CSS](https://tailwindcss.com/) with PostCSS & Autoprefixer
- **Runtime & Tooling**: Node.js, pnpm / npm

---

## Getting Started

### Prerequisites

- Node.js >= 18.17.0
- pnpm (recommended) or npm

### Installation

Clone the repository and install dependencies:

```bash
# Using pnpm
pnpm install

# Or using npm
npm install
```

### Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env.local
```

For this Public Website stage (`QR-P0.1`), only one variable is required:

- `NEXT_PUBLIC_SITE_URL`: Base URL used for Open Graph tags, canonical URLs, and sitemap generation (defaults to `http://localhost:3000`).

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `pnpm dev` or `npm run dev` | Starts the Next.js development server at `http://localhost:3000` |
| `pnpm build` or `npm run build` | Compiles the production build |
| `pnpm start` or `npm run start` | Runs the compiled production server |
| `pnpm lint` or `npm run lint` | Runs ESLint checks across codebase |
| `pnpm typecheck` or `npm run typecheck` | Validates TypeScript types across the project (`tsc --noEmit`) |
| `pnpm test` or `npm test` | Runs the automated test suite |

---

## Project Structure

```text
├── docs/
│   └── architecture/
│       └── overview.md        # Current vs. future architecture specification
├── public/                    # Static public assets
├── src/
│   ├── app/
│   │   ├── globals.css        # Tailwind directives & global typography
│   │   ├── layout.tsx         # Root layout with SEO metadata and global shell
│   │   ├── not-found.tsx      # Branded, accessible 404 error page
│   │   ├── page.tsx           # Homepage composition
│   │   ├── robots.ts          # Search engine crawl rules
│   │   └── sitemap.ts         # Automated sitemap generation
│   └── components/
│       ├── layout/
│       │   ├── Footer.tsx     # Semantic footer with site map & policies
│       │   └── Navbar.tsx     # Responsive navigation with accessible mobile drawer
│       ├── sections/
│       │   ├── AnalyticsConceptSection.tsx   # Honest analytics architecture preview
│       │   ├── CTASection.tsx                # Early access & waitlist conversion
│       │   ├── DynamicQRExplanationSection.tsx # How dynamic routing works
│       │   ├── HeroSection.tsx               # Primary hero & value proposition
│       │   ├── PlatformIntroSection.tsx      # Platform vs generator differentiator
│       │   ├── QRCapabilitiesSection.tsx     # Enterprise capabilities breakdown
│       │   ├── QRDesignSection.tsx           # Customization & brand controls
│       │   └── UseCasesSection.tsx           # Industry business scenarios
│       └── ui/
│           ├── Badge.tsx      # Status and feature tag component
│           ├── Button.tsx     # Accessible button with multiple variants
│           ├── Card.tsx       # Reusable surface container
│           ├── Container.tsx  # Responsive layout max-width constraint
│           └── Section.tsx    # Semantic section wrapper with accessible IDs
├── tests/
│   └── smoke.test.mjs         # Baseline smoke and component validation
├── .env.example               # Minimal environment template
├── .gitignore                 # Artifact and secret exclusions
├── next.config.mjs            # Next.js configuration
├── package.json               # Package dependencies and scripts
├── postcss.config.mjs         # PostCSS configuration
├── tailwind.config.ts         # Tailwind CSS styling tokens
└── tsconfig.json              # Strict TypeScript configuration
```

---

## Accessibility & SEO Highlights

- **Semantic Hierarchy**: Strict single `<h1>` tag with structured `<h2>` and `<h3>` tags.
- **Native Semantics**: Native `<button>`, `<a>`, `<nav>`, and `<main>` tags prioritized over generic ARIA div roles.
- **Visible Focus States**: Explicit `focus-visible` rings with offset indicators for keyboard users.
- **SEO & Social Sharing**: Dynamic Open Graph, Twitter Cards, robots.txt, and sitemap.xml configured via App Router metadata.

---

## Deployment

### 1. Required Production Environment Variables

Configure the following environment variable names in your production deployment settings (e.g. Vercel Project Settings → Environment Variables). **Never commit real values to git.**

| Variable Name | Purpose |
| :--- | :--- |
| `NEXT_PUBLIC_SITE_URL` | Canonical public URL (e.g. `https://your-domain.com`) |
| `NEXTAUTH_URL` | Base URL for NextAuth callbacks (e.g. `https://your-domain.com`) |
| `NEXTAUTH_SECRET` | 32+ byte cryptographic random secret (`openssl rand -base64 32`) |
| `DATABASE_URL` | Supabase Transaction Pooler URI (`6543`) with `?pgbouncer=true` |
| `DIRECT_URL` | Supabase Direct Session URI (`5432`) for schema migrations |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID for social sign-in |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `RESEND_API_KEY` | Resend API key for workspace invitation emails |
| `RESEND_FROM_EMAIL` | Verified sender email address in Resend |
| `APP_URL` | Application root URL for invitation links |
| `STRIPE_SECRET_KEY` | Stripe live secret key (`sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (`whsec_...`) |
| `STRIPE_PRICE_ID_PRO` | Stripe recurring Price ID for Pro plan |
| `VERCEL_API_TOKEN` | Vercel Personal Access Token for custom domain attachment |
| `VERCEL_PROJECT_ID` | Vercel Project ID |
| `VERCEL_TEAM_ID` | Vercel Team ID (if deploying under a Vercel Team) |
| `WORKOS_API_KEY` | WorkOS API key for Enterprise SSO |
| `WORKOS_CLIENT_ID` | WorkOS Client ID |
| `WORKOS_REDIRECT_URI` | WorkOS SSO Redirect URI (`https://your-domain.com/api/auth/sso/callback`) |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL for distributed rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST Token |

### 2. Vercel Deployment Steps

1. **Connect Repository**: In the [Vercel Dashboard](https://vercel.com/new), import this repository.
2. **Framework Preset**: Ensure **Next.js** is selected. Root directory should be `./`.
3. **Environment Variables**: Add each variable from the table above in **Project Settings → Environment Variables** (configured for `Production` and `Preview` environments).
4. **Deploy**: Trigger the initial deployment from the main branch or CLI:
   ```bash
   vercel --prod
   ```

### 3. Post-Deployment Database Migration

After the first production build completes and the live database is provisioned, apply the database schema migrations once from a secure machine with access to the real production `DIRECT_URL` and `DATABASE_URL`:

```bash
# Execute against live production Supabase instance
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres" \
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true" \
npx prisma migrate deploy
```

> **Warning**: Never run destructive commands such as `prisma migrate reset` or `prisma db push --force-reset` on production databases.
