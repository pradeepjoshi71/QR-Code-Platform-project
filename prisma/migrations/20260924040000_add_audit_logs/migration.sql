-- Migration: QR-P9.1 — Audit Log for Sensitive Org Actions
-- Adds: audit_logs table for tracking sensitive workspace activities

CREATE TABLE "audit_logs" (
    "id"              TEXT NOT NULL,
    "organizationId"  TEXT NOT NULL,
    "actorUserId"     TEXT NOT NULL,
    "action"          TEXT NOT NULL,
    "targetType"      TEXT,
    "targetId"        TEXT,
    "metadata"        JSONB,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- Index on [organizationId, createdAt]
CREATE INDEX "audit_logs_organizationId_createdAt_idx" ON "audit_logs"("organizationId", "createdAt");

-- Foreign key constraints
ALTER TABLE "audit_logs"
    ADD CONSTRAINT "audit_logs_organizationId_fkey"
    FOREIGN KEY ("organizationId")
    REFERENCES "organizations"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "audit_logs"
    ADD CONSTRAINT "audit_logs_actorUserId_fkey"
    FOREIGN KEY ("actorUserId")
    REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
