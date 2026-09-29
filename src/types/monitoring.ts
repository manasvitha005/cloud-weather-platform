export type RunStatus = 'SUCCESS' | 'PARTIAL_FAILURE' | 'FAILED' | 'RUNNING';
export type TriggerType = 'SCHEDULED' | 'MANUAL' | 'SYSTEM';

export interface CollectionRunItem {
  id: string;
  startedAt: string;
  completedAt?: string | null;
  status: RunStatus;
  triggerType: TriggerType;
  locationsProcessed: number;
  recordsCreated: number;
  alertsTriggered: number;
  durationMs?: number | null;
  errorMessage?: string | null;
  logs?: string | null;
}

export interface CloudSystemHealth {
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  uptimeSeconds: number;
  environment: string;
  timestamp: string;
  services: {
    database: {
      status: 'CONNECTED' | 'ERROR';
      provider: string;
      totalRecords: number;
      totalLocations: number;
      activeLocations: number;
      responseTimeMs: number;
    };
    weatherApi: {
      status: 'OPERATIONAL' | 'DEGRADED' | 'UNREACHABLE';
      provider: string;
      endpoint: string;
      lastLatencyMs: number;
    };
    collectionEngine: {
      status: 'IDLE' | 'RUNNING' | 'STALLED';
      lastRunAt: string | null;
      lastSuccessAt: string | null;
      lastFailedAt: string | null;
      totalRuns24h: number;
      successRate24h: number;
    };
    alertEngine: {
      status: 'ACTIVE';
      totalActiveAlerts: number;
      activeRulesCount: number;
    };
  };
  recentRuns: CollectionRunItem[];
}
