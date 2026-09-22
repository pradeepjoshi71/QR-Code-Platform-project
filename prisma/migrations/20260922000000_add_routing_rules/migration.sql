-- Migration: QR-P4.2 add routingRules to qr_codes
-- Nullable JSONB column for device/OS-based redirect rules on DYNAMIC QR codes.
-- Shape: { ios?: string, android?: string, desktop?: string }

ALTER TABLE "qr_codes"
  ADD COLUMN "routingRules" JSONB;
