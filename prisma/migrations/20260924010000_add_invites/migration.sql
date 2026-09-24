-- Migration: QR-P6.2 — Team Member Invites
-- Adds: invites table (token-based, role-scoped, 7-day expiry, SetNull-free cascade)

CREATE TABLE "invites" (
    "id"              TEXT NOT NULL,
    "organizationId"  TEXT NOT NULL,
    "email"           TEXT NOT NULL,
    "role"            "Role" NOT NULL DEFAULT 'MEMBER',
    "token"           TEXT NOT NULL,
    "invitedByUserId" TEXT NOT NULL,
    "expiresAt"       TIMESTAMP(3) NOT NULL,
    "acceptedAt"      TIMESTAMP(3),
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invites_pkey" PRIMARY KEY ("id")
);

-- Unique token for accept-link lookups
CREATE UNIQUE INDEX "invites_token_key" ON "invites"("token");

-- Indexes for org-scoped listing and token lookups
CREATE INDEX "invites_organizationId_idx" ON "invites"("organizationId");
CREATE INDEX "invites_token_idx"          ON "invites"("token");

-- FK to organizations (cascade delete — deleting an org removes its invites)
ALTER TABLE "invites"
    ADD CONSTRAINT "invites_organizationId_fkey"
    FOREIGN KEY ("organizationId")
    REFERENCES "organizations"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- FK to users (cascade delete — deleting the inviter removes their sent invites)
ALTER TABLE "invites"
    ADD CONSTRAINT "invites_invitedByUserId_fkey"
    FOREIGN KEY ("invitedByUserId")
    REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
