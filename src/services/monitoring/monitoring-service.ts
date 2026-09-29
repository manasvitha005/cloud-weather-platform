import { prisma } from '@/lib/prisma';
import { CloudSystemHealth } from '@/types/monitoring';
import { subHours } from 'date-fns';

export class MonitoringService {
  /**
   * Get full operational status of the cloud monitoring infrastructure
   */
  public static async getSystemHealth(): Promise<CloudSystemHealth> {
    const timestamp = new Date().toISOString();

    // 1. Check Database Health & Stats
    const dbStartTime = Date.now();
    let dbStatus: 'CONNECTED' | 'ERROR' = 'CONNECTED';
    let totalRecords = 0;
    let totalLocations = 0;
    let activeLocations = 0;

    try {
      [totalRecords, totalLocations, activeLocations] = await Promise.all([
        prisma.weatherRecord.count(),
        prisma.location.count(),
        prisma.location.count({ where: { isActive: true } }),
      ]);
    } catch (dbErr) {
      console.error('[MonitoringService] DB health check failed:', dbErr);
      dbStatus = 'ERROR';
    }
    const dbResponseTimeMs = Date.now() - dbStartTime;

    // 2. Check Open-Meteo Weather API Latency
    let apiStatus: 'OPERATIONAL' | 'DEGRADED' | 'UNREACHABLE' = 'OPERATIONAL';
    let apiLatencyMs = 0;
    try {
      const apiPingStart = Date.now();
      const pingRes = await fetch('https://api.open-meteo.com/v1/forecast?latitude=0&longitude=0&current=temperature_2m', {
        headers: { 'User-Agent': 'CloudWeatherPlatformHealthCheck/1.0' },
        cache: 'no-store',
      });
      apiLatencyMs = Date.now() - apiPingStart;
      if (!pingRes.ok) {
        apiStatus = 'DEGRADED';
      }
    } catch {
      apiStatus = 'UNREACHABLE';
      apiLatencyMs = 9999;
    }

    // 3. Collection Engine 24h stats
    const last24h = subHours(new Date(), 24);
    const recentRuns = await prisma.collectionRun.findMany({
      take: 20,
      orderBy: { startedAt: 'desc' },
    });

    const runs24h = await prisma.collectionRun.findMany({
      where: { startedAt: { gte: last24h } },
    });

    const successfulRuns24h = runs24h.filter((r) => r.status === 'SUCCESS').length;
    const successRate24h = runs24h.length > 0 ? Math.round((successfulRuns24h / runs24h.length) * 100) : 100;

    const lastRun = recentRuns[0];
    const lastSuccess = recentRuns.find((r) => r.status === 'SUCCESS');
    const lastFailed = recentRuns.find((r) => r.status === 'FAILED' || r.status === 'PARTIAL_FAILURE');

    let collectionEngineStatus: 'IDLE' | 'RUNNING' | 'STALLED' = 'IDLE';
    if (lastRun && lastRun.status === 'RUNNING') {
      const runAgeMs = Date.now() - new Date(lastRun.startedAt).getTime();
      collectionEngineStatus = runAgeMs > 120000 ? 'STALLED' : 'RUNNING';
    }

    // 4. Alert Engine Stats
    const totalActiveAlerts = await prisma.weatherAlert.count({
      where: { status: 'ACTIVE' },
    });
    const activeRulesCount = await prisma.alertRule.count({
      where: { isEnabled: true },
    });

    // Overall system status
    let overallStatus: 'HEALTHY' | 'DEGRADED' | 'DOWN' = 'HEALTHY';
    if (dbStatus === 'ERROR' || apiStatus === 'UNREACHABLE') {
      overallStatus = 'DOWN';
    } else if (apiStatus === 'DEGRADED' || (runs24h.length > 0 && successRate24h < 80)) {
      overallStatus = 'DEGRADED';
    }

    return {
      status: overallStatus,
      uptimeSeconds: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'production',
      timestamp,
      services: {
        database: {
          status: dbStatus,
          provider: process.env.DATABASE_URL?.startsWith('file:') ? 'SQLite (Development Engine)' : 'PostgreSQL (Cloud SQL)',
          totalRecords,
          totalLocations,
          activeLocations,
          responseTimeMs: dbResponseTimeMs,
        },
        weatherApi: {
          status: apiStatus,
          provider: 'Open-Meteo Global Forecasting Engine',
          endpoint: 'https://api.open-meteo.com/v1/forecast',
          lastLatencyMs: apiLatencyMs,
        },
        collectionEngine: {
          status: collectionEngineStatus,
          lastRunAt: lastRun ? lastRun.startedAt.toISOString() : null,
          lastSuccessAt: lastSuccess ? (lastSuccess.completedAt || lastSuccess.startedAt).toISOString() : null,
          lastFailedAt: lastFailed ? lastFailed.startedAt.toISOString() : null,
          totalRuns24h: runs24h.length,
          successRate24h,
        },
        alertEngine: {
          status: 'ACTIVE',
          totalActiveAlerts,
          activeRulesCount,
        },
      },
      recentRuns: recentRuns.map((r) => ({
        id: r.id,
        startedAt: r.startedAt.toISOString(),
        completedAt: r.completedAt ? r.completedAt.toISOString() : null,
        status: r.status as any,
        triggerType: r.triggerType as any,
        locationsProcessed: r.locationsProcessed,
        recordsCreated: r.recordsCreated,
        alertsTriggered: r.alertsTriggered,
        durationMs: r.durationMs,
        errorMessage: r.errorMessage,
        logs: r.logs,
      })),
    };
  }
}
