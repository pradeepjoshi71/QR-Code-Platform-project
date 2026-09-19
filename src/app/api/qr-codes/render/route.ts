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

    if (format === 'png') {
      const dataUrl = await generateQRCodeDataURL(text);
      return NextResponse.json({ dataUrl });
    }

    const svg = await generateQRCodeSVG(text);
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
