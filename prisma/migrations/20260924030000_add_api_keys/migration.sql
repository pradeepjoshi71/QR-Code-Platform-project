-- Migration: QR-P8.1 — API Key Management
-- Adds: api_keys table for programmatic API access with SHA-256 hashed keys

CREATE TABLE "api_keys" (
    "id"              TEXT NOT NULL,
    "organizationId"  TEXT NOT NULL,
    "name"            TEXT NOT NULL,
    "keyHash"         TEXT NOT NULL,
    "keyPrefix"       TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "lastUsedAt"      TIMESTAMP(3),
    "revokedAt"       TIMESTAMP(3),
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- Unique index on keyHash
CREATE UNIQUE INDEX "api_keys_keyHash_key" ON "api_keys"("keyHash");

-- Indexes for lookup and organization scoping
CREATE INDEX "api_keys_organizationId_idx" ON "api_keys"("organizationId");
CREATE INDEX "api_keys_keyHash_idx" ON "api_keys"("keyHash");

-- Foreign key constraints
ALTER TABLE "api_keys"
    ADD CONSTRAINT "api_keys_organizationId_fkey"
    FOREIGN KEY ("organizationId")
    REFERENCES "organizations"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "api_keys"
    ADD CONSTRAINT "api_keys_createdByUserId_fkey"
    FOREIGN KEY ("createdByUserId")
    REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
