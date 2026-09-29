'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { WeatherAlertItem, AlertRuleItem, AlertSeverity, AlertStatus } from '@/types/alerts';
import { AlertCard } from '@/components/alerts/AlertCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/LoadingSkeleton';
import {
  Bell,
  AlertCircle,
  AlertTriangle,
  Info,
  ShieldCheck,
  Settings2,
  CheckCircle2,
  Sliders,
  Save,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<WeatherAlertItem[]>([]);
  const [rules, setRules] = useState<AlertRuleItem[]>([]);
  const [summary, setSummary] = useState({
    totalActive: 0,
    criticalCount: 0,
    warningCount: 0,
    infoCount: 0,
  });
  const [filterStatus, setFilterStatus] = useState<string>('ACTIVE');
  const [isLoading, setIsLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editedThreshold, setEditedThreshold] = useState<number>(0);
  const [editedSeverity, setEditedSeverity] = useState<AlertSeverity>('WARNING');
  const [editedEnabled, setEditedEnabled] = useState<boolean>(true);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadAlertsAndRules = useCallback(async () => {
    setIsLoading(true);
    try {
      const [alertsRes, rulesRes] = await Promise.all([
        fetch(`/api/alerts?status=${filterStatus}`),
        fetch('/api/alerts/rules'),
      ]);

      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setAlerts(alertsData.alerts || []);
        if (alertsData.summary) {
          setSummary(alertsData.summary);
        }
      }

      if (rulesRes.ok) {
        const rulesData = await rulesRes.json();
        setRules(rulesData.rules || []);
      }
      setError(null);
    } catch (err: unknown) {
      console.error('[AlertsPage] Load error:', err);
      setError('Failed to retrieve active weather alerts.');
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    loadAlertsAndRules();
  }, [loadAlertsAndRules]);

  const handleResolveAlert = async (id: string) => {
    setResolvingId(id);
    try {
      const res = await fetch(`/api/alerts/${id}/resolve`, { method: 'POST' });
      if (res.ok) {
        await loadAlertsAndRules();
      }
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    } finally {
      setResolvingId(null);
    }
  };

  const startEditRule = (rule: AlertRuleItem) => {
    setEditingRuleId(rule.id);
    setEditedThreshold(rule.threshold);
    setEditedSeverity(rule.severity);
    setEditedEnabled(rule.isEnabled);
  };

  const handleSaveRule = async (id: string) => {
    try {
      const res = await fetch('/api/alerts/rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          threshold: editedThreshold,
          severity: editedSeverity,
          isEnabled: editedEnabled,
        }),
      });

      if (res.ok) {
        setSaveSuccess(id);
        setTimeout(() => setSaveSuccess(null), 3000);
        setEditingRuleId(null);
        await loadAlertsAndRules();
      }
    } catch (err) {
      console.error('Failed to save rule:', err);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-400 border border-rose-500/20">
              Cloud Event Processing
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white dark:text-white light:text-slate-900 tracking-tight">
            Weather Alert Intelligence Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-400 light:text-slate-600 mt-1">
            Configurable rule-based anomaly detection engine evaluating live observations
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center rounded-xl bg-slate-900 p-1 border border-slate-700 self-start md:self-auto">
          {['ACTIVE', 'RESOLVED', 'ALL'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={cn(
                'px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all',
                filterStatus === status
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              {status === 'ALL' ? 'All History' : status}
            </button>
          ))}
        </div>
      </div>

      {/* 1. Summary Severity Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-4 border border-rose-500/30 bg-rose-500/5">
          <div className="flex items-center justify-between text-xs text-rose-400 mb-1 font-semibold">
            <span>Critical Alerts</span>
            <AlertCircle className="h-4 w-4" />
          </div>
          <p className="text-3xl font-black text-white font-mono">{summary.criticalCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">Immediate danger</p>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center justify-between text-xs text-amber-400 mb-1 font-semibold">
            <span>Warnings</span>
            <AlertTriangle className="h-4 w-4" />
          </div>
          <p className="text-3xl font-black text-white font-mono">{summary.warningCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">Threshold breaches</p>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-sky-500/30 bg-sky-500/5">
          <div className="flex items-center justify-between text-xs text-sky-400 mb-1 font-semibold">
            <span>Advisories</span>
            <Info className="h-4 w-4" />
          </div>
          <p className="text-3xl font-black text-white font-mono">{summary.infoCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">Elevated conditions</p>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1 font-semibold">
            <span>Active Alerts</span>
            <Bell className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-white font-mono">{summary.totalActive}</p>
          <p className="text-[11px] text-slate-400 mt-1">Across all locations</p>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <ErrorState
          title="Could Not Load Alerts"
          message={error}
          onRetry={loadAlertsAndRules}
        />
      )}

      {/* Alerts Feed */}
      {!isLoading && !error && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Bell className="h-4 w-4 text-sky-400" />
              {filterStatus} Weather Alerts ({alerts.length})
            </h3>
          </div>

          {alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onResolve={handleResolveAlert}
                  isResolving={resolvingId === alert.id}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={ShieldCheck}
              title="No Weather Thresholds Breached"
              description={`There are currently no ${filterStatus.toLowerCase()} alerts. Monitored locations are within configured parameters.`}
            />
          )}
        </div>
      )}

      {/* 2. Configurable Alert Threshold Rules Manager */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Sliders className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white dark:text-white light:text-slate-900">
                Configurable Weather Alert Rules & Thresholds
              </h3>
              <p className="text-xs text-slate-400">
                Modify trigger parameters evaluated during each Cloud Scheduler collection run
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rules.map((rule) => {
            const isEditing = editingRuleId === rule.id;
            return (
              <div
                key={rule.id}
                className={cn(
                  'glass-card rounded-2xl p-5 border transition-all flex flex-col justify-between',
                  isEditing ? 'border-sky-500 bg-sky-500/10' : 'border-slate-800'
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase border',
                        rule.severity === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                          : rule.severity === 'WARNING'
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          : 'bg-sky-500/20 text-sky-400 border-sky-500/30'
                      )}
                    >
                      {rule.severity}
                    </span>

                    <span
                      className={cn(
                        'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                        rule.isEnabled
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-slate-800 text-slate-500'
                      )}
                    >
                      {rule.isEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white">{rule.title}</h4>
                  <p className="text-xs text-slate-400 mt-1">{rule.description}</p>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-slate-400">Threshold:</label>
                        <input
                          type="number"
                          step="0.5"
                          value={editedThreshold}
                          onChange={(e) => setEditedThreshold(parseFloat(e.target.value))}
                          className="w-24 rounded-lg bg-slate-900 px-2 py-1 text-xs font-bold text-white border border-slate-700 outline-none text-right font-mono"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-xs text-slate-400">Severity:</label>
                        <select
                          value={editedSeverity}
                          onChange={(e) => setEditedSeverity(e.target.value as AlertSeverity)}
                          className="rounded-lg bg-slate-900 px-2 py-1 text-xs font-semibold text-white border border-slate-700 outline-none"
                        >
                          <option value="INFO">INFO</option>
                          <option value="WARNING">WARNING</option>
                          <option value="CRITICAL">CRITICAL</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-xs text-slate-400">Rule Enabled:</label>
                        <input
                          type="checkbox"
                          checked={editedEnabled}
                          onChange={(e) => setEditedEnabled(e.target.checked)}
                          className="h-4 w-4 rounded accent-sky-500 cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <button
                          onClick={() => handleSaveRule(rule.id)}
                          className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-sky-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-400 transition-all shadow-md"
                        >
                          <Save className="h-3.5 w-3.5" />
                          <span>Save Changes</span>
                        </button>
                        <button
                          onClick={() => setEditingRuleId(null)}
                          className="rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-mono text-slate-300">
                        Threshold: <span className="font-bold text-sky-400">{rule.threshold}</span>
                      </div>
                      <button
                        onClick={() => startEditRule(rule)}
                        className="rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white border border-slate-700 transition-colors"
                      >
                        Edit Rule
                      </button>
                    </div>
                  )}

                  {saveSuccess === rule.id && (
                    <p className="text-[11px] text-emerald-400 mt-2 flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" /> Rule updated successfully
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
