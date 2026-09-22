-- Migration: QR-P5.1 add scan_events table
-- Captures one row per successful QR redirect: country, device type, referrer.

CREATE TABLE "scan_events" (
    "id"         TEXT NOT NULL,
    "qrCodeId"   TEXT NOT NULL,
    "scannedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "country"    TEXT,
    "deviceType" TEXT,
    "referrer"   TEXT,

    CONSTRAINT "scan_events_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "scan_events"
    ADD CONSTRAINT "scan_events_qrCodeId_fkey"
    FOREIGN KEY ("qrCodeId")
    REFERENCES "qr_codes"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "scan_events_qrCodeId_idx" ON "scan_events"("qrCodeId");
