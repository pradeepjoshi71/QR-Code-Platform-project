import QRCode from 'qrcode';

export interface QRCodeGenerationOptions {
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  margin?: number;
  width?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

/**
 * Generate an SVG string for a given text/URL.
 */
export async function generateQRCodeSVG(
  text: string,
  options?: QRCodeGenerationOptions
): Promise<string> {
  const opts: QRCode.QRCodeToStringOptions = {
    type: 'svg',
    errorCorrectionLevel: options?.errorCorrectionLevel || 'M',
    margin: options?.margin ?? 2,
    width: options?.width ?? 300,
    color: {
      dark: options?.color?.dark || '#000000',
      light: options?.color?.light || '#ffffff',
    },
  };

  return QRCode.toString(text, opts);
}

/**
 * Generate a PNG Data URL (Base64) for a given text/URL.
 */
export async function generateQRCodeDataURL(
  text: string,
  options?: QRCodeGenerationOptions
): Promise<string> {
  const opts: QRCode.QRCodeToDataURLOptions = {
    errorCorrectionLevel: options?.errorCorrectionLevel || 'M',
    margin: options?.margin ?? 2,
    width: options?.width ?? 600,
    color: {
      dark: options?.color?.dark || '#000000',
      light: options?.color?.light || '#ffffff',
    },
  };

  return QRCode.toDataURL(text, opts);
}
