import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserWithActiveOrg } from '@/lib/auth-helpers';

/**
 * GET /api/qr-codes/[id]/analytics
 *
 * Returns aggregated scan stats for a single QR code:
 * {
 *   totalScans: number,
 *   last30Days: Array<{ date: string (YYYY-MM-DD), count: number }>,
 *   deviceBreakdown: { ios: number, android: number, desktop: number, unknown: number },
 *   countryBreakdown: Array<{ country: string, count: number }>
 * }
 */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await getAuthenticatedUserWithActiveOrg();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { activeOrgId } = authResult;
    const { id } = params;

    // Verify QR code exists and belongs to active organization
    const qrCode = await prisma.qrCode.findUnique({
      where: { id },
      select: { id: true, organizationId: true, name: true },
    });

    if (!qrCode || qrCode.organizationId !== activeOrgId) {
      return NextResponse.json({ error: 'QR Code not found' }, { status: 404 });
    }

    // --- Total scans (all time) ---
    const totalScans = await prisma.scanEvent.count({
      where: { qrCodeId: id },
    });

    // --- Last 30 days: daily counts ---
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const recentScans = await prisma.scanEvent.findMany({
      where: {
        qrCodeId: id,
        scannedAt: { gte: thirtyDaysAgo },
      },
      select: { scannedAt: true },
      orderBy: { scannedAt: 'asc' },
    });

    // Aggregate by date string (YYYY-MM-DD)
    const dailyCounts = new Map<string, number>();
    // Pre-fill all 30 days with 0 so the chart always shows a full range
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      dailyCounts.set(key, 0);
    }
    for (const scan of recentScans) {
      const key = scan.scannedAt.toISOString().slice(0, 10);
      dailyCounts.set(key, (dailyCounts.get(key) ?? 0) + 1);
    }
    const last30Days = Array.from(dailyCounts.entries()).map(([date, count]) => ({
      date,
      count,
    }));

    // --- Device breakdown ---
    const deviceGroups = await prisma.scanEvent.groupBy({
      by: ['deviceType'],
      where: { qrCodeId: id },
      _count: { _all: true },
    });

    const deviceBreakdown = { ios: 0, android: 0, desktop: 0, unknown: 0 };
    for (const group of deviceGroups) {
      const key = group.deviceType as keyof typeof deviceBreakdown | null;
      if (key && key in deviceBreakdown) {
        deviceBreakdown[key] = group._count._all;
      } else {
        deviceBreakdown.unknown += group._count._all;
      }
    }

    // --- Country breakdown (top countries, sorted desc) ---
    const countryGroups = await prisma.scanEvent.groupBy({
      by: ['country'],
      where: {
        qrCodeId: id,
        country: { not: null },
      },
      _count: { _all: true },
      orderBy: { _count: { country: 'desc' } },
    });

    const countryBreakdown = countryGroups.map((g) => ({
      country: g.country ?? 'Unknown',
      count: g._count._all,
    }));

    return NextResponse.json({
      qrName: qrCode.name,
      totalScans,
      last30Days,
      deviceBreakdown,
      countryBreakdown,
    });
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics.' }, { status: 500 });
  }
}
