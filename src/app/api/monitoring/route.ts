import { NextResponse } from 'next/server';
import { MonitoringService } from '@/services/monitoring/monitoring-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const health = await MonitoringService.getSystemHealth();
    return NextResponse.json(health);
  } catch (error: unknown) {
    console.error('[GET /api/monitoring] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Monitoring check failed' },
      { status: 500 }
    );
  }
}
