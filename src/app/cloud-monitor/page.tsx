'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CloudSystemHealth, CollectionRunItem } from '@/types/monitoring';
import { CloudPipelineDiagram } from '@/components/monitoring/CloudPipelineDiagram';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/LoadingSkeleton';
import {
  Activity,
  Database,
  Cloud,
  Server,
  Play,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Terminal,
  ShieldCheck,
  RefreshCw,
  Cpu,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';

export default function CloudMonitorPage() {
  const [health, setHealth] = useState<CloudSystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTriggering, setIsTriggering] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [triggerResult, setTriggerResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/monitoring');
      if (!res.ok) {
        throw new Error(`Monitoring check returned HTTP ${res.status}`);
      }
      const data: CloudSystemHealth = await res.json();
      setHealth(data);
      setError(null);
    } catch (err: unknown) {
      console.error('[CloudMonitor] Failed loading health:', err);
      setError('Failed to query cloud telemetry data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHealth();
    const interval = setInterval(loadHealth, 15000); // Poll health every 15s
    return () => clearInterval(interval);
  }, [loadHealth]);

  const handleTriggerManualRun = async () => {
    setIsTriggering(true);
    setTriggerResult(null);
    try {
      const res = await fetch('/api/jobs/weather-collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggerType: 'MANUAL' }),
      });
      const data = await res.json();
      setTriggerResult(data.summary || data);
      await loadHealth();
    } catch (err) {
      console.error('Trigger run failed:', err);
    } finally {
      setIsTriggering(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
      case 'HEALTHY':
      case 'OPERATIONAL':
      case 'CONNECTED':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
      case 'PARTIAL_FAILURE':
      case 'DEGRADED':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/20';
      case 'FAILED':
      case 'DOWN':
      case 'ERROR':
      case 'UNREACHABLE':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/20';
      default:
        return 'bg-slate-500/15 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              GCP Telemetry Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white dark:text-white light:text-slate-900 tracking-tight">
            Cloud Operations & Monitoring
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-400 light:text-slate-600 mt-1">
            Live infrastructure diagnostics, database metrics, API latencies, and scheduled collection history
          </p>
        </div>

        {/* Action: Trigger Ingestion Now */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={handleTriggerManualRun}
            disabled={isTriggering}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
          >
            <Play className={`h-3.5 w-3.5 fill-current ${isTriggering ? 'animate-spin' : ''}`} />
            <span>{isTriggering ? 'Executing Collection Pipeline...' : 'Trigger Pipeline Ingestion Now'}</span>
          </button>

          <button
            onClick={loadHealth}
            aria-label="Refresh telemetry"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-slate-300 hover:text-white border border-slate-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Trigger Run Result Modal / Notification */}
      {triggerResult && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-5 backdrop-blur-md animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="h-4 w-4" />
              <span>Pipeline Run Completed: {triggerResult.status}</span>
            </div>
            <button
              onClick={() => setTriggerResult(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Dismiss
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[10px]">LOCATIONS PROCESSED</span>
              <span className="text-white font-bold">{triggerResult.locationsProcessed} locations</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">RECORDS CREATED</span>
              <span className="text-sky-400 font-bold">{triggerResult.recordsCreated} records</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">ALERTS TRIGGERED</span>
              <span className="text-rose-400 font-bold">{triggerResult.alertsTriggered} alerts</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">EXECUTION DURATION</span>
              <span className="text-emerald-400 font-bold">{triggerResult.durationMs}ms</span>
            </div>
          </div>
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-3xl" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <ErrorState
          title="Telemetry Unavailable"
          message={error}
          onRetry={loadHealth}
        />
      )}

      {/* 1. Live Cloud Health Cards */}
      {health && !isLoading && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Overall System Health */}
            <div className="glass-card rounded-3xl p-5 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-emerald-400 border border-slate-700">
                    <Activity className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-400">Platform Status</span>
                </div>
                <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border', getStatusBadge(health.status))}>
                  {health.status}
                </span>
              </div>
              <p className="text-2xl font-black text-white">Google Cloud Run</p>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-800 font-mono">
                <span>Uptime: {Math.floor(health.uptimeSeconds / 60)} mins</span>
                <span className="text-emerald-400">Auto-scaling</span>
              </div>
            </div>

            {/* Cloud SQL Database Health */}
            <div className="glass-card rounded-3xl p-5 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-sky-400 border border-slate-700">
                    <Database className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-400">Cloud SQL (PostgreSQL)</span>
                </div>
                <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border', getStatusBadge(health.services.database.status))}>
                  {health.services.database.status}
                </span>
              </div>
              <p className="text-2xl font-black text-sky-400 font-mono">
                {health.services.database.totalRecords}{' '}
                <span className="text-xs font-sans text-slate-400">records</span>
              </p>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-800 font-mono">
                <span>Query Latency: {health.services.database.responseTimeMs}ms</span>
                <span>{health.services.database.activeLocations} active targets</span>
              </div>
            </div>

            {/* Weather API Feed Health */}
            <div className="glass-card rounded-3xl p-5 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-indigo-400 border border-slate-700">
                    <Cloud className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-400">Open-Meteo Ingest</span>
                </div>
                <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border', getStatusBadge(health.services.weatherApi.status))}>
                  {health.services.weatherApi.status}
                </span>
              </div>
              <p className="text-2xl font-black text-indigo-400 font-mono">
                {health.services.weatherApi.lastLatencyMs}{' '}
                <span className="text-xs font-sans text-slate-400">ms ping</span>
              </p>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-800 font-mono">
                <span>Endpoint: Global v1</span>
                <span className="text-emerald-400">Reliable</span>
              </div>
            </div>

            {/* Ingestion Engine 24h Stats */}
            <div className="glass-card rounded-3xl p-5 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-amber-400 border border-slate-700">
                    <Clock className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-400">Scheduler 24H Success</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border bg-emerald-500/15 text-emerald-400 border-emerald-500/20">
                  {health.services.collectionEngine.successRate24h}%
                </span>
              </div>
              <p className="text-2xl font-black text-amber-400 font-mono">
                {health.services.collectionEngine.totalRuns24h}{' '}
                <span className="text-xs font-sans text-slate-400">runs/day</span>
              </p>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-800 font-mono">
                <span>Cron: */30 * * * *</span>
                <span>Idempotent</span>
              </div>
            </div>
          </div>

          {/* 2. Interactive Cloud Pipeline Architecture Diagram */}
          <CloudPipelineDiagram />

          {/* 3. Collection Runs History Table with Expandable Logs */}
          <div className="glass-panel rounded-3xl p-6 sm:p-7 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  <Terminal className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white dark:text-white light:text-slate-900">
                    Cloud Scheduler Ingestion Run Logs
                  </h3>
                  <p className="text-xs text-slate-400">
                    Audit trail of periodic automated executions with millisecond execution durations
                  </p>
                </div>
              </div>
            </div>

            {health.recentRuns.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="border-b border-slate-800 bg-slate-900/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="py-3 px-4">Started At</th>
                      <th className="py-3 px-4">Trigger</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Locations</th>
                      <th className="py-3 px-4">Records Ingested</th>
                      <th className="py-3 px-4">Alerts</th>
                      <th className="py-3 px-4">Duration</th>
                      <th className="py-3 px-4 text-right">Logs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {health.recentRuns.map((run) => {
                      const isExpanded = expandedLogId === run.id;
                      let formattedStartTime = run.startedAt;
                      try {
                        formattedStartTime = format(new Date(run.startedAt), 'MMM dd, HH:mm:ss');
                      } catch {
                        // fallback
                      }

                      return (
                        <React.Fragment key={run.id}>
                          <tr className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-4 text-white font-sans">{formattedStartTime}</td>
                            <td className="py-3 px-4">
                              <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                                {run.triggerType}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={cn(
                                  'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase border',
                                  getStatusBadge(run.status)
                                )}
                              >
                                {run.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-300">{run.locationsProcessed} locs</td>
                            <td className="py-3 px-4 text-sky-400 font-bold">+{run.recordsCreated} records</td>
                            <td className="py-3 px-4 text-rose-400">{run.alertsTriggered}</td>
                            <td className="py-3 px-4 text-emerald-400">
                              {run.durationMs ? `${run.durationMs}ms` : '--'}
                            </td>
                            <td className="py-3 px-4 text-right font-sans">
                              {run.logs && (
                                <button
                                  onClick={() => setExpandedLogId(isExpanded ? null : run.id)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white border border-slate-700 transition-colors"
                                >
                                  <span>{isExpanded ? 'Hide Log' : 'View Log'}</span>
                                  {isExpanded ? (
                                    <ChevronUp className="h-3 w-3" />
                                  ) : (
                                    <ChevronDown className="h-3 w-3" />
                                  )}
                                </button>
                              )}
                            </td>
                          </tr>

                          {/* Expanded Run Log Detail */}
                          {isExpanded && run.logs && (
                            <tr>
                              <td colSpan={8} className="p-4 bg-slate-950 border-b border-slate-800">
                                <div className="rounded-xl bg-black/90 p-4 border border-slate-800 text-[11px] text-slate-300 font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
                                  {run.logs}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-slate-400">
                No collection runs recorded in the database yet. Click &quot;Trigger Pipeline Ingestion Now&quot; to execute your first ingestion.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
