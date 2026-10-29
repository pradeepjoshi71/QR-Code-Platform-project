import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health
 * Lightweight uptime and infrastructure monitoring endpoint.
 * Performs a fast `SELECT 1` database query via Prisma and returns { status: 'ok', db: boolean }.
 * Never throws, ensuring monitoring tools get an accurate 200 payload.
 */
export async function GET() {
  let db = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = true;
  } catch (err: unknown) {
    console.error('Health check database probe failed:', err);
    db = false;
  }

  return NextResponse.json({
    status: 'ok',
    db,
  });
}
