import React from 'react';
import { LucideIcon, CloudMoon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon = CloudMoon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="glass-panel rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 mb-4 border border-sky-500/20">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-semibold text-white dark:text-white light:text-slate-900 mb-2">
        {title}
      </h3>
      <p className="text-sm text-slate-400 dark:text-slate-400 light:text-slate-600 mb-6 max-w-sm">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-indigo-500 transition-all"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
