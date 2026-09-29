import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsService } from '@/services/analytics/analytics-service';
import { prisma } from '@/lib/prisma';
import { TimeRange } from '@/types/analytics';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let locationId = searchParams.get('locationId');
    const rangeParam = searchParams.get('range') || '24h';
    const range: TimeRange = ['24h', '7d', '30d'].includes(rangeParam)
      ? (rangeParam as TimeRange)
      : '24h';

    if (!locationId) {
      // Default to first active location
      const firstLoc = await prisma.location.findFirst({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });

      if (!firstLoc) {
        return NextResponse.json({ error: 'No monitored locations found' }, { status: 404 });
      }
      locationId = firstLoc.id;
    }

    const analytics = await AnalyticsService.getLocationAnalytics(locationId, range);

    if (!analytics) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    return NextResponse.json(analytics);
  } catch (error: unknown) {
    console.error('[GET /api/analytics] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analytics aggregation failed' },
      { status: 500 }
    );
  }
}
