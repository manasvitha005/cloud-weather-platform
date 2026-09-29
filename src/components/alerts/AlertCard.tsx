'use client';

import React from 'react';
import { WeatherAlertItem } from '@/types/alerts';
import { AlertTriangle, AlertCircle, Info, CheckCircle2, MapPin, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface AlertCardProps {
  alert: WeatherAlertItem;
  onResolve?: (id: string) => Promise<void>;
  isResolving?: boolean;
}

export function AlertCard({ alert, onResolve, isResolving = false }: AlertCardProps) {
  const isCritical = alert.severity === 'CRITICAL';
  const isWarning = alert.severity === 'WARNING';
  const isResolved = alert.status === 'RESOLVED';

  let timeAgo = 'recently';
  try {
    timeAgo = formatDistanceToNow(new Date(alert.triggeredAt), { addSuffix: true });
  } catch {
    timeAgo = 'recently';
  }

  const severityConfig = {
    CRITICAL: {
      border: 'border-rose-500/40 bg-rose-500/10',
      badge: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      icon: AlertCircle,
      iconColor: 'text-rose-400',
    },
    WARNING: {
      border: 'border-amber-500/40 bg-amber-500/10',
      badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
    },
    INFO: {
      border: 'border-sky-500/30 bg-sky-500/10',
      badge: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
      icon: Info,
      iconColor: 'text-sky-400',
    },
  };

  const config = severityConfig[alert.severity] || severityConfig.INFO;
  const Icon = isResolved ? CheckCircle2 : config.icon;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl p-5 border transition-all',
        isResolved
          ? 'border-slate-800 bg-slate-900/40 opacity-75'
          : config.border
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Icon, Location, Title */}
        <div className="flex items-start gap-3.5">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border',
              isResolved ? 'bg-slate-800 text-emerald-400 border-emerald-500/30' : config.badge
            )}
          >
            <Icon className="h-5 w-5" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border',
                  isResolved
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                    : config.badge
                )}
              >
                {isResolved ? 'RESOLVED' : alert.severity}
              </span>

              {alert.locationName && (
                <span className="flex items-center gap-1 text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700">
                  <MapPin className="h-3 w-3 text-sky-400" />
                  {alert.locationName}
                  {alert.locationCountry ? `, ${alert.locationCountry}` : ''}
                </span>
              )}

              <span className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                <Clock className="h-3 w-3" />
                {timeAgo}
              </span>
            </div>

            <h4 className="text-sm font-bold text-white dark:text-white light:text-slate-900">
              {alert.title}
            </h4>
            <p className="text-xs text-slate-300 dark:text-slate-300 light:text-slate-600 mt-1 max-w-xl">
              {alert.message}
            </p>
          </div>
        </div>

        {/* Right: Threshold vs Value & Action Button */}
        <div className="flex items-center gap-4 self-end sm:self-center">
          <div className="text-right hidden sm:block">
            <p className="text-[11px] text-slate-400 font-mono">
              Threshold: <span className="text-white font-bold">{alert.threshold}</span>
            </p>
            <p className="text-[11px] text-slate-400 font-mono">
              Measured: <span className="text-sky-400 font-bold">{alert.actualValue.toFixed(1)}</span>
            </p>
          </div>

          {!isResolved && onResolve && (
            <button
              onClick={() => onResolve(alert.id)}
              disabled={isResolving}
              className="rounded-xl bg-slate-800/80 hover:bg-slate-700 px-3.5 py-1.5 text-xs font-semibold text-white border border-slate-700 hover:border-slate-500 transition-all disabled:opacity-50 whitespace-nowrap"
            >
              {isResolving ? 'Resolving...' : 'Acknowledge'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
