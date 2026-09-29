'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  badge?: {
    text: string;
    variant?: 'emerald' | 'amber' | 'rose' | 'sky' | 'slate';
  };
  iconColor?: string;
}

export function MetricCard({
  icon: Icon,
  label,
  value,
  unit,
  subtext,
  badge,
  iconColor = 'text-sky-400',
}: MetricCardProps) {
  const badgeColors = {
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
    sky: 'bg-sky-500/15 text-sky-400 border-sky-500/20',
    slate: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
  };

  return (
    <div className="glass-card group relative overflow-hidden rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800/80 border border-slate-700/50 group-hover:scale-110 transition-transform">
            <Icon className={cn('h-4 w-4', iconColor)} />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 light:text-slate-600">
            {label}
          </span>
        </div>

        {badge && (
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[10px] font-semibold border',
              badgeColors[badge.variant || 'sky']
            )}
          >
            {badge.text}
          </span>
        )}
      </div>

      {/* Main Metric Value */}
      <div className="my-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white dark:text-white light:text-slate-900 font-mono">
            {value}
          </span>
          {unit && (
            <span className="text-xs font-medium text-slate-400 dark:text-slate-400 light:text-slate-500">
              {unit}
            </span>
          )}
        </div>
      </div>

      {/* Supporting Subtext */}
      {subtext && (
        <p className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-600 mt-2 line-clamp-1">
          {subtext}
        </p>
      )}
    </div>
  );
}
