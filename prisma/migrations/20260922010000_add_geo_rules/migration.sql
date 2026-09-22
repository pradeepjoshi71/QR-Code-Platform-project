-- Migration: QR-P4.3 add geoRules to qr_codes
-- Nullable JSONB column for country-based redirect rules on DYNAMIC QR codes.
-- Shape: { [countryCode: string]: string } e.g. { "US": "https://..." }

ALTER TABLE "qr_codes"
  ADD COLUMN "geoRules" JSONB;
