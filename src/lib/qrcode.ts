import QRCode from 'qrcode';

export interface QRCodeGenerationOptions {
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  margin?: number;
  width?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  /**
   * Optional URL of a logo to embed as a centered overlay in the SVG output.
   * When set, errorCorrectionLevel is forced to 'H' for readability.
   * Logo overlay is only applied to SVG output; PNG output reflects colors only.
   */
  logoUrl?: string;
}

/**
 * Injects a centered <image> element into an SVG string as a logo overlay.
 * The logo occupies ~22% of the QR width, centered.
 */
function injectLogoIntoSVG(svgString: string, logoUrl: string): string {
  // Parse viewBox or width to determine size
  const viewBoxMatch = svgString.match(/viewBox="([^"]+)"/);
  const widthMatch = svgString.match(/<svg[^>]*\swidth="([^"]+)"/);

  let size = 300; // fallback
  if (viewBoxMatch) {
    const parts = viewBoxMatch[1].trim().split(/\s+/);
    if (parts.length === 4) size = parseFloat(parts[2]);
  } else if (widthMatch) {
    size = parseFloat(widthMatch[1]);
  }

  const logoSize = Math.round(size * 0.22);
  const logoX = Math.round((size - logoSize) / 2);
  const logoY = Math.round((size - logoSize) / 2);
  const cornerRadius = Math.round(logoSize * 0.12);

  // White background rect behind logo for contrast, with rounded corners
  const bgRect = `<rect x="${logoX - 2}" y="${logoY - 2}" width="${logoSize + 4}" height="${logoSize + 4}" rx="${cornerRadius}" ry="${cornerRadius}" fill="white" />`;
  const imageTag = `<image href="${logoUrl}" x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid meet" clip-path="inset(0% round ${cornerRadius}px)" />`;

  return svgString.replace('</svg>', `${bgRect}${imageTag}</svg>`);
}

/**
 * Generate an SVG string for a given text/URL.
 * If logoUrl is provided, errorCorrectionLevel is forced to 'H' and the logo
 * is injected as a centered <image> overlay in the SVG output.
 */
export async function generateQRCodeSVG(
  text: string,
  options?: QRCodeGenerationOptions
): Promise<string> {
  const hasLogo = Boolean(options?.logoUrl);
  const opts: QRCode.QRCodeToStringOptions = {
    type: 'svg',
    // Force H when logo is present — logo occludes ~20% of data area
    errorCorrectionLevel: hasLogo ? 'H' : (options?.errorCorrectionLevel || 'M'),
    margin: options?.margin ?? 2,
    width: options?.width ?? 300,
    color: {
      dark: options?.color?.dark || '#000000',
      light: options?.color?.light || '#ffffff',
    },
  };

  const svgString = await QRCode.toString(text, opts);

  if (hasLogo && options?.logoUrl) {
    return injectLogoIntoSVG(svgString, options.logoUrl);
  }

  return svgString;
}

/**
 * Generate a PNG Data URL (Base64) for a given text/URL.
 * Colors are applied. Logo overlay is not applied in PNG (requires canvas, an
 * intentionally excluded dependency). Use the SVG download for logo+colors.
 */
export async function generateQRCodeDataURL(
  text: string,
  options?: QRCodeGenerationOptions
): Promise<string> {
  const hasLogo = Boolean(options?.logoUrl);
  const opts: QRCode.QRCodeToDataURLOptions = {
    // Force H when logo is present so the QR remains scannable
    errorCorrectionLevel: hasLogo ? 'H' : (options?.errorCorrectionLevel || 'M'),
    margin: options?.margin ?? 2,
    width: options?.width ?? 600,
    color: {
      dark: options?.color?.dark || '#000000',
      light: options?.color?.light || '#ffffff',
    },
  };

  return QRCode.toDataURL(text, opts);
}
