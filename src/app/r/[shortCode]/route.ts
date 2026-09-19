import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: Request,
  { params }: { params: { shortCode: string } }
) {
  try {
    const { shortCode } = params;

    if (!shortCode) {
      return new NextResponse('Shortcode is required', { status: 400 });
    }

    const qrCode = await prisma.qrCode.findUnique({
      where: { shortCode },
      select: {
        destinationUrl: true,
        isActive: true,
      },
    });

    if (!qrCode || !qrCode.isActive) {
      return new NextResponse('QR code not found or inactive', { status: 404 });
    }

    return NextResponse.redirect(qrCode.destinationUrl, { status: 302 });
  } catch (error) {
    console.error('Redirect error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
