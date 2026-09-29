'use client';

import React from 'react';
import { NormalizedDailyForecast } from '@/types/weather';
import { WeatherIcon } from '@/components/weather/WeatherIcon';
import { formatCelsius } from '@/lib/utils';
import { CalendarDays, Umbrella, Wind } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Forecast7DayProps {
  daily: NormalizedDailyForecast[];
}

export function Forecast7Day({ daily }: Forecast7DayProps) {
  if (!daily || daily.length === 0) return null;

  // Find min and max temp across the week for relative temperature bars
  const minWeekTemp = Math.min(...daily.map((d) => d.tempMin));
  const maxWeekTemp = Math.max(...daily.map((d) => d.tempMax));
  const tempSpan = Math.max(maxWeekTemp - minWeekTemp, 1);

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-7">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <CalendarDays className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white dark:text-white light:text-slate-900">
              7-Day Synoptic Forecast
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-500">
              High-resolution meteorological prediction model
            </p>
          </div>
        </div>
      </div>

      {/* Forecast Cards: Responsive Grid / Horizontal Scroll */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 overflow-x-auto pb-2">
        {daily.map((day, idx) => {
          const isToday = idx === 0;

          // Compute relative position for temperature range bar
          const leftPercent = ((day.tempMin - minWeekTemp) / tempSpan) * 100;
          const widthPercent = Math.max(((day.tempMax - day.tempMin) / tempSpan) * 100, 10);

          return (
            <div
              key={day.date}
              className={cn(
                'glass-card relative flex flex-col items-center justify-between p-4 rounded-2xl transition-all',
                isToday
                  ? 'border-sky-500/40 bg-sky-500/10 shadow-lg shadow-sky-500/5'
                  : 'hover:border-slate-600'
              )}
            >
              {/* Day Label */}
              <div className="text-center">
                <span
                  className={cn(
                    'text-xs font-bold uppercase tracking-wider',
                    isToday
                      ? 'text-sky-400 font-extrabold'
                      : 'text-slate-300 dark:text-slate-300 light:text-slate-700'
                  )}
                >
                  {isToday ? 'Today' : day.dayName}
                </span>
                <p className="text-[10px] text-slate-500 dark:text-slate-500 light:text-slate-400">
                  {day.date.substring(5)}
                </p>
              </div>

              {/* Weather Icon */}
              <div className="my-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800/60 dark:bg-slate-800/60 light:bg-slate-100 border border-slate-700/50">
                <WeatherIcon weatherCode={day.weatherCode} className="h-7 w-7" />
              </div>

              {/* Condition Text */}
              <p className="text-[11px] font-medium text-slate-300 dark:text-slate-300 light:text-slate-700 text-center line-clamp-1 h-4 mb-2">
                {day.conditionText}
              </p>

              {/* Temp Min & Max */}
              <div className="flex items-center justify-between w-full text-xs font-mono mb-2">
                <span className="font-bold text-white dark:text-white light:text-slate-900">
                  {formatCelsius(day.tempMax)}
                </span>
                <span className="text-slate-400 dark:text-slate-400 light:text-slate-500">
                  {formatCelsius(day.tempMin)}
                </span>
              </div>

              {/* Relative Range Bar */}
              <div className="w-full bg-slate-800 dark:bg-slate-800 light:bg-slate-200 h-1.5 rounded-full overflow-hidden mb-3 relative">
                <div
                  className="absolute h-full rounded-full bg-gradient-to-r from-sky-400 to-amber-400"
                  style={{
                    left: `${Math.min(Math.max(leftPercent, 0), 85)}%`,
                    width: `${Math.min(widthPercent, 100)}%`,
                  }}
                />
              </div>

              {/* Rain Probability / Wind Footer */}
              <div className="flex items-center justify-between w-full pt-2 border-t border-slate-700/50 text-[10px] text-slate-400">
                <div className="flex items-center gap-1">
                  <Umbrella className="h-3 w-3 text-sky-400" />
                  <span>{day.precipitationProbability}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <Wind className="h-3 w-3 text-slate-400" />
                  <span>{Math.round(day.windSpeedMax)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
