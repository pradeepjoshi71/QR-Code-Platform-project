import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

test('smoke: configuration and manifest checks', () => {
  const packageJsonPath = path.join(projectRoot, 'package.json');
  assert.ok(fs.existsSync(packageJsonPath), 'package.json must exist');

  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  assert.strictEqual(pkg.name, 'qr-code-platform', 'package name must match');
  assert.ok(pkg.scripts.dev, 'dev script must exist');
  assert.ok(pkg.scripts.build, 'build script must exist');
  assert.ok(pkg.scripts.lint, 'lint script must exist');
  assert.ok(pkg.scripts.typecheck, 'typecheck script must exist');
  assert.ok(pkg.dependencies.next, 'next dependency must exist');
  assert.ok(pkg.dependencies.react, 'react dependency must exist');
});

test('smoke: environment isolation check', () => {
  const envExamplePath = path.join(projectRoot, '.env.example');
  assert.ok(fs.existsSync(envExamplePath), '.env.example must exist');
  const envContent = fs.readFileSync(envExamplePath, 'utf8');

  // Must contain required vars for QR-P1.0
  assert.ok(envContent.includes('NEXT_PUBLIC_SITE_URL'), 'Must contain NEXT_PUBLIC_SITE_URL');
  assert.ok(envContent.includes('NEXTAUTH_URL'), 'Must contain NEXTAUTH_URL in QR-P1.0');
  assert.ok(envContent.includes('NEXTAUTH_SECRET'), 'Must contain NEXTAUTH_SECRET in QR-P1.0');
  assert.ok(envContent.includes('DATABASE_URL'), 'Must contain DATABASE_URL in QR-P1.0');
  assert.ok(envContent.includes('GOOGLE_CLIENT_ID'), 'Must contain GOOGLE_CLIENT_ID in QR-P1.0');

  // Must NOT contain future phases (P2-P4)
  assert.ok(!envContent.includes('REDIS_URL'), 'Must NOT contain REDIS_URL before QR-P2.0');
  assert.ok(!envContent.includes('CLICKHOUSE'), 'Must NOT contain CLICKHOUSE before QR-P3.0');
  assert.ok(!envContent.includes('STRIPE'), 'Must NOT contain STRIPE before QR-P4.0');
});

test('smoke: architecture documentation check', () => {
  const archDocPath = path.join(projectRoot, 'docs', 'architecture', 'overview.md');
  assert.ok(fs.existsSync(archDocPath), 'docs/architecture/overview.md must exist');
  const archContent = fs.readFileSync(archDocPath, 'utf8');
  assert.ok(archContent.includes('CURRENT STATE: Phase QR-P2.0'), 'Must state current phase QR-P2.0');
  assert.ok(archContent.includes('FUTURE STATE: Evolution Roadmap'), 'Must state future phases');
});

test('smoke: critical App Router pages and auth endpoints exist', () => {
  const requiredFiles = [
    'src/app/layout.tsx',
    'src/app/page.tsx',
    'src/app/not-found.tsx',
    'src/app/globals.css',
    'src/app/robots.ts',
    'src/app/sitemap.ts',
    'src/app/(auth)/layout.tsx',
    'src/app/(auth)/sign-in/page.tsx',
    'src/app/(auth)/sign-up/page.tsx',
    'src/app/app/layout.tsx',
    'src/app/app/page.tsx',
    'src/app/app/qr-codes/page.tsx',
    'src/app/api/auth/[...nextauth]/route.ts',
    'src/app/api/auth/register/route.ts',
    'src/app/api/workspaces/route.ts',
    'src/app/api/qr-codes/route.ts',
    'src/app/api/qr-codes/[id]/route.ts',
    'src/app/api/qr-codes/render/route.ts',
    'src/app/r/[shortCode]/route.ts',
    'src/middleware.ts',
    'src/lib/auth.ts',
    'src/lib/prisma.ts',
    'src/lib/qrcode.ts',
    'src/lib/shortcode.ts',
    'prisma/schema.prisma',
    'prisma/migrations/20260905000000_init/migration.sql',
    'prisma/migrations/20260905010000_add_qr_codes/migration.sql',
  ];

  for (const relPath of requiredFiles) {
    const fullPath = path.join(projectRoot, relPath);
    assert.ok(fs.existsSync(fullPath), `${relPath} must exist`);
  }
});

test('smoke: reusable UI, layout and section components exist', () => {
  const componentFiles = [
    'src/components/ui/Button.tsx',
    'src/components/ui/Container.tsx',
    'src/components/ui/Section.tsx',
    'src/components/ui/Card.tsx',
    'src/components/ui/Badge.tsx',
    'src/components/layout/Navbar.tsx',
    'src/components/layout/Footer.tsx',
    'src/components/layout/AppNavbar.tsx',
    'src/components/layout/WorkspaceSwitcher.tsx',
    'src/components/providers/SessionProvider.tsx',
    'src/components/qr/QrCodesManager.tsx',
    'src/components/qr/CreateQrModal.tsx',
    'src/components/qr/EditQrModal.tsx',
    'src/components/qr/QrPreviewModal.tsx',
    'src/components/sections/HeroSection.tsx',
    'src/components/sections/PlatformIntroSection.tsx',
    'src/components/sections/QRCapabilitiesSection.tsx',
    'src/components/sections/DynamicQRExplanationSection.tsx',
    'src/components/sections/QRDesignSection.tsx',
    'src/components/sections/AnalyticsConceptSection.tsx',
    'src/components/sections/UseCasesSection.tsx',
    'src/components/sections/CTASection.tsx',
  ];

  for (const relPath of componentFiles) {
    const fullPath = path.join(projectRoot, relPath);
    assert.ok(fs.existsSync(fullPath), `${relPath} must exist`);
  }
});
