# QR Code Platform Architecture Overview

## Document Scope & Purpose

This architectural document defines the system boundaries, design principles, and component roadmaps for the **QR Code Platform**.

It strictly differentiates between:
1. **CURRENT STATE (Phase QR-P2.0: QR Generation Core & Dynamic Redirect Stage)** — What actually exists in this codebase today.
2. **FUTURE ROADMAP (Phases P3 through P4)** — What is planned for subsequent implementation stages.

> [!IMPORTANT]
> QR generation (SVG & PNG vector rendering), Static & Dynamic QR code persistence, multi-tenant workspace scoping, short-code resolution (`/r/[shortCode]`), and active/inactive redirect switches are live in QR-P2.0. Future phases (P3-P4) will introduce custom styling/logos, ClickHouse telemetry aggregation, and custom domains.

---

## 1. CURRENT STATE: Phase QR-P2.0 (QR Generation Core & Dynamic Redirect Stage)

The current repository represents the public marketing foundation, authentication & multi-tenant workspaces, and the complete QR Generation & Dynamic Redirection engine.

```
┌─────────────────────────────────────────────────────────────┐
│                   Phase QR-P2.0 Architecture                │
│                                                             │
│   Next.js 14 App Router (React 18 + Strict TypeScript)      │
│   Tailwind CSS Design System + Semantic UI Primitives       │
│                                                             │
│   ┌───────────────────────────┐ ┌─────────────────────────┐ │
│   │        Public App         │ │   Authenticated App     │ │
│   │                           │ │   (/app protected zone) │ │
│   │ • Landing & Brand Story   │ │ • Workspace Switcher    │ │
│   │ • Product Concept Pages   │ │ • QR Codes Management   │ │
│   │ • Sign-In & Sign-Up Forms │ │ • Dynamic Link Preview  │ │
│   │ • /r/[shortCode] Gateway  │ │ • SVG/PNG Export Engine │ │
│   └───────────────────────────┘ └─────────────────────────┘ │
│                 │                            │              │
│                 └──────────────┬─────────────┘              │
│                                ▼                            │
│   ┌─────────────────────────────────────────────────────┐   │
│   │       NextAuth v5 (Credentials + Google OAuth)      │   │
│   │       Edge Middleware Session Interceptor           │   │
│   │       QR Vector Renderer (qrcode + nanoid)          │   │
│   │       Prisma ORM Client Singleton                   │   │
│   └──────────────────────────┬──────────────────────────┘   │
│                              ▼                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │   PostgreSQL (Supabase) Database                    │   │
│   │   • users, organizations, memberships (RBAC)        │   │
│   │   • qr_codes (Static & Dynamic scoped to org)       │   │
│   │   • accounts, sessions, verification_tokens         │   │
│   └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Key Technical Characteristics

- **Zero Heavy Abstractions**: Pure semantic React components without heavyweight UI library bloat.
- **Server-First by Default**: Homepage and all static marketing sections are Server Components. Interactive client components are restricted strictly to stateful controls (e.g. mobile navigation toggle, sign-in/up forms, workspace switcher, QR manager).
- **Multi-Tenant Scoped QR Codes**: Every QR code is strictly scoped to the active workspace organization (`organizationId` FK) and user (`createdByUserId` FK).
- **Dynamic Redirection Engine**: Fast 302 redirection via `/r/[shortCode]` with nanoid collision-resistant short-links and active toggle enforcement.
- **Vector Rendering Pipeline**: High-resolution lossless SVG generation and PNG base64 export with customizable error correction levels.

---

## 2. FUTURE STATE: Evolution Roadmap

The following phases describe the upcoming architectural evolution of the platform:

### Phase P3: QR Customization, Logos & Design Presets
- **Target**: Visual branding, custom colors, logos, eye styling, and design templates.
- **Components to be added**:
  - Embedded center logo positioning with auto-error-correction boost (Level H / 30%).
  - Palette presets, gradient dots, and custom finder eye shapes.
  - Pre-press print validation helper.

### Phase P4: Telemetry, Analytics Ingestion & Reporting
- **Target**: Privacy-compliant, real-time scan telemetry and reporting dashboards.
- **Components to be added**:
  - Ingestion buffer: Asynchronous telemetry queue decoupled from redirect hot-path.
  - Analytical columnar store: ClickHouse for OLAP aggregations.
  - Metrics captured: Scan timestamps, coarse geolocation, device/OS classification, UTM parameters.

### Phase P5: Enterprise Scalability, Custom Domains & Billing
- **Target**: White-label custom domains, developer APIs, and commercial monetization.
- **Components to be added**:
  - Custom branded short domains (`qr.brand.com`) with automated SSL provisioning.
  - Developer REST API and Webhook notifications.
  - Stripe commercial billing integration and usage metering.

---

## 3. Boundary Comparison Matrix

| System Capability | Phase QR-P2.0 (Current) | Future Phases (P3 - P5) |
| :--- | :--- | :--- |
| **Public Website & Landing** | **Implemented** | Iterative enhancements |
| **Design System & UI Primitives** | **Implemented** | Shared design system package |
| **Authentication & Accounts** | **Implemented (NextAuth v5 + bcrypt + Google)** | Enterprise SSO (SAML / Okta) |
| **Multi-Tenant Workspaces (RBAC)** | **Implemented (User + Org + Membership)** | Custom granular permissions |
| **PostgreSQL / Relational Data** | **Implemented (Users, Orgs, QR Codes)** | Extended to Analytics models |
| **Static & Dynamic QR Generation** | **Implemented (SVG & PNG exports)** | Custom logos, colors & palettes (P3) |
| **Dynamic QR Redirection Engine**| **Implemented (/r/[shortCode] 302 routing)**| Smart OS / Geo device routing rules |
| **ClickHouse Scan Telemetry** | *Not Implemented* | Phase P4 |
| **Real-time Analytics Dashboard**| *Not Implemented* | Phase P4 |
| **Stripe Billing & Subscriptions**| *Not Implemented* | Phase P5 |
| **Custom Domains & SSL Engine** | *Not Implemented* | Phase P5 |
