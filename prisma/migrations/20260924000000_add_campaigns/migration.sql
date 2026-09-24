-- Migration: QR-P6.1 — Campaign model and QR grouping
-- Adds: campaigns table, campaignId FK on qr_codes (nullable, SetNull on cascade)

CREATE TABLE "campaigns" (
    "id"             TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name"           TEXT NOT NULL,
    "description"    TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- Index on organizationId for org-scoped list queries
CREATE INDEX "campaigns_organizationId_idx" ON "campaigns"("organizationId");

-- FK from campaigns to organizations (cascade delete — deleting an org deletes its campaigns)
ALTER TABLE "campaigns"
    ADD CONSTRAINT "campaigns_organizationId_fkey"
    FOREIGN KEY ("organizationId")
    REFERENCES "organizations"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Add nullable campaignId column to qr_codes
ALTER TABLE "qr_codes" ADD COLUMN "campaignId" TEXT;

-- Index on campaignId for campaign-scoped QR list queries
CREATE INDEX "qr_codes_campaignId_idx" ON "qr_codes"("campaignId");

-- FK from qr_codes to campaigns (SetNull — deleting a campaign NULLs campaignId, does not delete QR codes)
ALTER TABLE "qr_codes"
    ADD CONSTRAINT "qr_codes_campaignId_fkey"
    FOREIGN KEY ("campaignId")
    REFERENCES "campaigns"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
