-- Migration: QR-P10.1 — Custom Domain Attachment
-- Adds: custom_domains table for single custom domain per organization

CREATE TABLE "custom_domains" (
    "id"               TEXT NOT NULL,
    "organizationId"   TEXT NOT NULL,
    "domain"           TEXT NOT NULL,
    "verified"         BOOLEAN NOT NULL DEFAULT false,
    "vercelConfigured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_domains_pkey" PRIMARY KEY ("id")
);

-- Unique constraints
CREATE UNIQUE INDEX "custom_domains_organizationId_key" ON "custom_domains"("organizationId");
CREATE UNIQUE INDEX "custom_domains_domain_key" ON "custom_domains"("domain");

-- Foreign key constraints
ALTER TABLE "custom_domains"
    ADD CONSTRAINT "custom_domains_organizationId_fkey"
    FOREIGN KEY ("organizationId")
    REFERENCES "organizations"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
