-- Migration: QR-P4.1 add scheduledStart and expiresAt to qr_codes
-- These are nullable DateTime columns for link scheduling and expiration enforcement.

ALTER TABLE "qr_codes"
  ADD COLUMN "scheduledStart" TIMESTAMP(3),
  ADD COLUMN "expiresAt"      TIMESTAMP(3);
