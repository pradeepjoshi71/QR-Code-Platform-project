-- Migration: QR-P11.1 — Enterprise SSO Login (WorkOS)
-- Adds: workosOrganizationId and ssoEnabled to organizations table

ALTER TABLE "organizations"
    ADD COLUMN "workosOrganizationId" TEXT,
    ADD COLUMN "ssoEnabled" BOOLEAN NOT NULL DEFAULT false;
