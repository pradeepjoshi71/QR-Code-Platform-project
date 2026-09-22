import { NextResponse } from 'next/server';
import { generateQRCodeSVG, generateQRCodeDataURL } from '@/lib/qrcode';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get('text');
    const format = searchParams.get('format') || 'svg';

    if (!text) {
      return NextResponse.json({ error: 'Text query parameter is required.' }, { status: 400 });
    }

    // Optional styling params
    const fgColor = searchParams.get('fgColor') || undefined;
    const bgColor = searchParams.get('bgColor') || undefined;
    const logoUrl = searchParams.get('logoUrl') || undefined;
    const ecl = searchParams.get('ecl') as 'L' | 'M' | 'Q' | 'H' | undefined;

    const renderOptions = {
      color: {
        dark: fgColor || '#000000',
        light: bgColor || '#ffffff',
      },
      logoUrl,
      errorCorrectionLevel: ecl || 'M' as const,
    };

    if (format === 'png') {
      const dataUrl = await generateQRCodeDataURL(text, renderOptions);
      return NextResponse.json({ dataUrl });
    }

    const svg = await generateQRCodeSVG(text, renderOptions);
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('QR Render Error:', error);
    return NextResponse.json({ error: 'Failed to render QR Code.' }, { status: 500 });
  }
}
