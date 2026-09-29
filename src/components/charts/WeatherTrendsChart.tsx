'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { NormalizedHourlyPoint } from '@/types/weather';
import { TrendingUp, Thermometer, Droplets, Wind, CloudRain } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WeatherTrendsChartProps {
  hourly: NormalizedHourlyPoint[];
}

type ActiveMetric = 'temperature' | 'precipitation' | 'humidity' | 'windSpeed';

export function WeatherTrendsChart({ hourly }: WeatherTrendsChartProps) {
  const [activeMetric, setActiveMetric] = useState<ActiveMetric>('temperature');

  if (!hourly || hourly.length === 0) return null;

  // Format time labels for x-axis (e.g., '14:00')
  const chartData = hourly.slice(0, 24).map((pt) => {
    const d = new Date(pt.time);
    const timeLabel = isNaN(d.getTime())
      ? pt.time.substring(11, 16) || pt.time
      : `${d.getHours().toString().padStart(2, '0')}:00`;

    return {
      time: timeLabel,
      temperature: pt.temperature,
      feelsLike: pt.feelsLike,
      humidity: pt.humidity,
      precipitation: pt.precipitation,
      windSpeed: pt.windSpeed,
      condition: pt.conditionText,
    };
  });

  const metricConfigs = {
    temperature: {
      label: 'Temperature',
      unit: '°C',
      color: '#38bdf8', // sky-400
      secondaryColor: '#818cf8', // indigo-400
      icon: Thermometer,
      dataKey: 'temperature',
    },
    precipitation: {
      label: 'Precipitation',
      unit: 'mm',
      color: '#0ea5e9',
      secondaryColor: '#38bdf8',
      icon: CloudRain,
      dataKey: 'precipitation',
    },
    humidity: {
      label: 'Humidity',
      unit: '%',
      color: '#06b6d4',
      secondaryColor: '#67e8f9',
      icon: Droplets,
      dataKey: 'humidity',
    },
    windSpeed: {
      label: 'Wind Speed',
      unit: 'km/h',
      color: '#10b981',
      secondaryColor: '#6ee7b7',
      icon: Wind,
      dataKey: 'windSpeed',
    },
  };

  const config = metricConfigs[activeMetric];

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-7 space-y-6">
      {/* Header & Metric Switcher Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white dark:text-white light:text-slate-900">
              24-Hour Meteorological Trend
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-500">
              Granular time-series progression
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center rounded-xl bg-slate-900/80 p-1 border border-slate-800 self-start sm:self-auto overflow-x-auto">
          {(Object.keys(metricConfigs) as ActiveMetric[]).map((key) => {
            const m = metricConfigs[key];
            const Icon = m.icon;
            const isSelected = activeMetric === key;
            return (
              <button
                key={key}
                onClick={() => setActiveMetric(key)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap',
                  isSelected
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart Area */}
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="metricGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={config.color} stopOpacity={0.4} />
                <stop offset="95%" stopColor={config.color} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              unit={` ${config.unit}`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const data = payload[0].payload;
                return (
                  <div className="rounded-xl border border-slate-700/80 bg-slate-950/90 p-3 shadow-xl backdrop-blur-md">
                    <p className="text-xs font-bold text-slate-300 font-mono mb-1">{label}</p>
                    <p className="text-sm font-extrabold text-white">
                      {data[config.dataKey]} {config.unit}
                    </p>
                    {activeMetric === 'temperature' && (
                      <p className="text-[11px] text-slate-400">Feels like: {data.feelsLike}°C</p>
                    )}
                    <p className="text-[11px] text-sky-400 mt-1 font-medium">{data.condition}</p>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey={config.dataKey}
              stroke={config.color}
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#metricGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
