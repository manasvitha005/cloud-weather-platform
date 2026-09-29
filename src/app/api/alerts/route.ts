import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status'); // ACTIVE, RESOLVED, ACKNOWLEDGED, ALL
    const locationId = searchParams.get('locationId');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    const whereClause: any = {};

    if (statusParam && statusParam !== 'ALL') {
      whereClause.status = statusParam;
    }

    if (locationId) {
      whereClause.locationId = locationId;
    }

    const [alerts, totalActive, criticalCount, warningCount, infoCount] = await Promise.all([
      prisma.weatherAlert.findMany({
        where: whereClause,
        orderBy: { triggeredAt: 'desc' },
        take: limit,
        include: {
          location: {
            select: {
              name: true,
              country: true,
            },
          },
        },
      }),
      prisma.weatherAlert.count({ where: { status: 'ACTIVE' } }),
      prisma.weatherAlert.count({ where: { status: 'ACTIVE', severity: 'CRITICAL' } }),
      prisma.weatherAlert.count({ where: { status: 'ACTIVE', severity: 'WARNING' } }),
      prisma.weatherAlert.count({ where: { status: 'ACTIVE', severity: 'INFO' } }),
    ]);

    const formattedAlerts = alerts.map((a) => ({
      id: a.id,
      locationId: a.locationId,
      locationName: a.location.name,
      locationCountry: a.location.country,
      type: a.type,
      severity: a.severity as any,
      title: a.title,
      message: a.message,
      threshold: a.threshold,
      actualValue: a.actualValue,
      triggeredAt: a.triggeredAt.toISOString(),
      resolvedAt: a.resolvedAt ? a.resolvedAt.toISOString() : null,
      status: a.status as any,
    }));

    return NextResponse.json({
      summary: {
        totalActive,
        criticalCount,
        warningCount,
        infoCount,
      },
      alerts: formattedAlerts,
    });
  } catch (error: unknown) {
    console.error('[GET /api/alerts] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}
