import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="glass-panel rounded-2xl p-8 text-center flex flex-col items-center justify-center max-w-lg mx-auto border-rose-500/20">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 mb-4 border border-rose-500/20">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-semibold text-white dark:text-white light:text-slate-900 mb-2">
        {title}
      </h3>
      <p className="text-sm text-slate-400 dark:text-slate-400 light:text-slate-600 mb-6 max-w-sm">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 transition-colors border border-slate-700"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Retry Operation</span>
        </button>
      )}
    </div>
  );
}
