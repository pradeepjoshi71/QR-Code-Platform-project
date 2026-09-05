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

  // Must only contain genuinely needed vars for QR-P0.1
  assert.ok(envContent.includes('NEXT_PUBLIC_SITE_URL'), 'Must contain NEXT_PUBLIC_SITE_URL');
  assert.ok(!envContent.includes('DATABASE_URL'), 'Must NOT contain DATABASE_URL in QR-P0.1');
  assert.ok(!envContent.includes('REDIS_URL'), 'Must NOT contain REDIS_URL in QR-P0.1');
  assert.ok(!envContent.includes('CLICKHOUSE'), 'Must NOT contain CLICKHOUSE in QR-P0.1');
  assert.ok(!envContent.includes('STRIPE'), 'Must NOT contain STRIPE in QR-P0.1');
});

test('smoke: architecture documentation check', () => {
  const archDocPath = path.join(projectRoot, 'docs', 'architecture', 'overview.md');
  assert.ok(fs.existsSync(archDocPath), 'docs/architecture/overview.md must exist');
  const archContent = fs.readFileSync(archDocPath, 'utf8');
  assert.ok(archContent.includes('CURRENT STATE: Phase QR-P0.1'), 'Must state current phase');
  assert.ok(archContent.includes('FUTURE STATE: Evolution Roadmap'), 'Must state future phases');
});

test('smoke: critical App Router pages exist', () => {
  const requiredFiles = [
    'src/app/layout.tsx',
    'src/app/page.tsx',
    'src/app/not-found.tsx',
    'src/app/globals.css',
    'src/app/robots.ts',
    'src/app/sitemap.ts',
  ];

  for (const relPath of requiredFiles) {
    const fullPath = path.join(projectRoot, relPath);
    assert.ok(fs.existsSync(fullPath), `${relPath} must exist`);
  }
});

test('smoke: reusable UI and section components exist', () => {
  const componentFiles = [
    'src/components/ui/Button.tsx',
    'src/components/ui/Container.tsx',
    'src/components/ui/Section.tsx',
    'src/components/ui/Card.tsx',
    'src/components/ui/Badge.tsx',
    'src/components/layout/Navbar.tsx',
    'src/components/layout/Footer.tsx',
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
