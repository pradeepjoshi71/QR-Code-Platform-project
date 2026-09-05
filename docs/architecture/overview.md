# QR Code Platform Architecture Overview

## Document Scope & Purpose

This architectural document defines the system boundaries, design principles, and component roadmaps for the **QR Code Platform**.

It strictly differentiates between:
1. **CURRENT STATE (Phase QR-P0.1: Public Website Stage)** — What actually exists in this codebase today.
2. **FUTURE ROADMAP (Phases P1 through P4)** — What is planned for subsequent implementation stages.

> [!IMPORTANT]
> To prevent scope creep and maintain architectural integrity, no backend databases, authentication servers, redirect caches, or analytics pipelines have been stubbed or faked. Only the public website foundation is implemented in QR-P0.1.

---

## 1. CURRENT STATE: Phase QR-P0.1 (Public Website Stage)

The current repository represents the public marketing, education, and brand foundation of the platform.

```
┌─────────────────────────────────────────────────────────────┐
│                   Phase QR-P0.1 Architecture                │
│                                                             │
│   Next.js 14 App Router (React 18 + Strict TypeScript)      │
│   Tailwind CSS Design System + Semantic HTML Foundation     │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                      Public App                     │   │
│   │                                                     │   │
│   │  • Global Responsive Header & Nav (Navbar)          │   │
│   │  • Homepage with 8 Core Product Story Sections      │   │
│   │  • Dynamic & Vector QR Educational Walkthroughs     │   │
│   │  • Analytics Concept & Use Case Breakdowns          │   │
│   │  • Standardized UI Tokens (Button, Card, Badge, etc)│   │
│   │  • Branded 404 Not Found Page                       │   │
│   │  • Robots.txt & Dynamic Sitemap Generator           │   │
│   │  • Global Accessible Focus Management & WCAG AA     │   │
│   └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Key Technical Characteristics

- **Zero Heavy Abstractions**: Pure semantic React components without heavyweight UI library bloat.
- **Server-First by Default**: Homepage and all static marketing sections are Server Components. Interactive client components are restricted strictly to stateful controls (e.g. mobile navigation toggle).
- **SEO & Social Metadata**: Canonical URLs, Open Graph schemas, and Twitter tags driven through Next.js `metadataBase`.
- **Environment Isolation**: Only requires `NEXT_PUBLIC_SITE_URL` for canonical tag resolution. No secrets or external infrastructure dependencies.

---

## 2. FUTURE STATE: Evolution Roadmap

The following phases describe the upcoming architectural evolution of the platform. None of these components exist in the current codebase:

### Phase P1: SaaS Application & Authentication Foundation
- **Target**: User account creation, workspace management, and session handling.
- **Components to be added**:
  - Secure authentication provider (OAuth2, magic links, session tokens).
  - Protected application routes (`/app`, `/settings`, `/workspaces`).
  - Role-based access control (RBAC): Owner, Admin, Editor, Viewer.
  - Multi-tenant data segregation.

### Phase P2: Core QR Engine & Dynamic Redirection Infrastructure
- **Target**: High-throughput QR generation and sub-millisecond dynamic URL resolution.
- **Components to be added**:
  - Primary relational persistence: PostgreSQL (QR codes, destinations, campaigns, audit logs).
  - High-performance redirection cache: Redis / Edge Key-Value store.
  - Low-latency edge redirect router: Resolves short-codes (e.g., `qr.domain.com/{slug}`) to dynamic destinations based on real-time rules.
  - Smart Routing rules: Device OS (iOS vs. Android), time-of-day, language, and geolocation triggers.
  - Asset rendering pipeline: Server-side SVG, vector PDF, EPS, and high-res PNG generation with customizable error correction levels (L, M, Q, H).

### Phase P3: Telemetry, Analytics Ingestion & Reporting
- **Target**: Privacy-compliant, real-time scan telemetry and reporting dashboards.
- **Components to be added**:
  - Ingestion buffer: Asynchronous telemetry queue (e.g., Kafka / Cloud PubSub) decoupled from the redirect hot-path to preserve redirect speed.
  - Analytical columnar store: ClickHouse for OLAP aggregations.
  - Metrics captured: Scan timestamps, coarse geolocation (country, region, city via IP without storing raw PII), user agent parser (device type, operating system, browser), and campaign UTM attribution.
  - Reporting interface: Interactive charts, scan velocity graphs, and CSV/PDF report exports.

### Phase P4: Enterprise Scalability, Custom Domains & Integrations
- **Target**: White-label custom domains, developer APIs, and commercial monetization.
- **Components to be added**:
  - Custom branded domains with automated SSL certificate provisioning via Let's Encrypt / Cloudflare for SaaS.
  - Developer REST API and Webhook notifications for scan events.
  - Commercial billing integration (Stripe customer portal, tiered subscriptions, usage meter).
  - Enterprise SSO (SAML 2.0 / Okta / Google Workspace).

---

## 3. Boundary Comparison Matrix

| System Capability | Phase QR-P0.1 (Current) | Future Phases (P1 - P4) |
| :--- | :--- | :--- |
| **Public Website & Landing** | **Implemented** | Iterative enhancements |
| **Design System & UI Primitives** | **Implemented** | Shared design system package |
| **SEO & OpenGraph Metadata** | **Implemented** | Extended to dynamic campaign pages |
| **Branded 404 Experience** | **Implemented** | Extended to invalid redirect shortcodes |
| **Authentication & Accounts** | *Not Implemented* | Phase P1 |
| **PostgreSQL / Relational Data** | *Not Implemented* | Phase P2 |
| **Redis Redirect Edge Cache** | *Not Implemented* | Phase P2 |
| **Dynamic QR Redirection Engine**| *Not Implemented* | Phase P2 |
| **Vector QR Generation Backend** | *Not Implemented* | Phase P2 |
| **ClickHouse Scan Telemetry** | *Not Implemented* | Phase P3 |
| **Real-time Analytics Dashboard**| *Not Implemented* | Phase P3 |
| **Stripe Billing & Subscriptions**| *Not Implemented* | Phase P4 |
| **Custom Domains & SSL Engine** | *Not Implemented* | Phase P4 |
