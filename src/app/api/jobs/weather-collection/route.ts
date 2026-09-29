import { NextRequest, NextResponse } from 'next/server';
import { WeatherCollector } from '@/services/collection/collector';
import { TriggerType } from '@/types/monitoring';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Max 60 seconds execution time on Vercel/Cloud Run

export async function POST(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const headerSecret = request.headers.get('x-cron-secret');
    const authHeader = request.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    // Check if manual trigger query param or body requested
    let triggerType: TriggerType = 'SCHEDULED';
    try {
      const body = await request.json().catch(() => ({}));
      if (body.triggerType === 'MANUAL') {
        triggerType = 'MANUAL';
      }
    } catch {
      // Body may be empty for raw GET/POST cron triggers
    }

    // Security Verification:
    // 1. If CRON_SECRET is set, require valid token OR allow manual dashboard trigger in development
    const isSecretValid =
      cronSecret && (headerSecret === cronSecret || bearerToken === cronSecret);
    const isDevManual =
      process.env.NODE_ENV === 'development' || triggerType === 'MANUAL';

    if (cronSecret && !isSecretValid && !isDevManual) {
      console.warn('[Collection Job] Unauthorized invocation attempt blocked.');
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or missing cron secret authorization.' },
        { status: 401 }
      );
    }

    console.log(`[Collection Job] Initiating weather ingestion (Trigger: ${triggerType})...`);
    const summary = await WeatherCollector.executeRun(triggerType);

    const httpStatus = summary.status === 'FAILED' ? 500 : 200;
    return NextResponse.json(
      {
        message: `Collection run finished with status: ${summary.status}`,
        summary,
      },
      { status: httpStatus }
    );
  } catch (error: unknown) {
    console.error('[POST /api/jobs/weather-collection] Fatal Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Job execution failed unexpectedly' },
      { status: 500 }
    );
  }
}

// Allow GET for simple ping or webhook triggers if configured
export async function GET(request: NextRequest) {
  return POST(request);
}
