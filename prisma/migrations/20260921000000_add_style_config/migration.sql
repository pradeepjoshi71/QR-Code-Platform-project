-- Migration: QR-P3.1 - Add styleConfig column to qr_codes table
-- Stores JSON styling options: fgColor, bgColor, logoUrl, errorCorrectionLevel

ALTER TABLE "qr_codes" ADD COLUMN "styleConfig" JSONB;
