'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { LocationAnalyticsResponse } from '@/types/analytics';

interface AnalyticsChartsProps {
  analytics: LocationAnalyticsResponse;
}

export function AnalyticsCharts({ analytics }: AnalyticsChartsProps) {
  const { series, timeRange } = analytics;

  if (!series || series.length === 0) return null;

  return (
    <div className="space-y-8">
      {/* 1. Historical Temperature & Feels-Like Multi-Area Chart */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white dark:text-white light:text-slate-900">
              Thermal Profile & Apparent Heat Index
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-500">
              Recorded temperature vs perceived temperature ({timeRange.toUpperCase()})
            </p>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="feelsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="formattedTime" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} unit="°C" />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  return (
                    <div className="rounded-xl border border-slate-700/80 bg-slate-950/90 p-3 shadow-xl backdrop-blur-md">
                      <p className="text-xs font-bold text-slate-300 font-mono mb-1">{label}</p>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-sky-400">
                          Temperature: {payload[0]?.value}°C
                        </p>
                        <p className="text-xs font-medium text-amber-400">
                          Feels Like: {payload[1]?.value}°C
                        </p>
                      </div>
                    </div>
                  );
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Area
                name="Temperature (°C)"
                type="monotone"
                dataKey="temperature"
                stroke="#38bdf8"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#tempGradient)"
              />
              <Area
                name="Feels Like (°C)"
                type="monotone"
                dataKey="feelsLike"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#feelsGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Humidity & Precipitation Ingestion Records */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Humidity Trend */}
        <div className="glass-panel rounded-3xl p-6 sm:p-7 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white dark:text-white light:text-slate-900">
              Relative Atmospheric Humidity
            </h3>
            <p className="text-xs text-slate-400">Vapor saturation trajectory (%)</p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="formattedTime" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} unit="%" />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    return (
                      <div className="rounded-xl border border-slate-700/80 bg-slate-950/90 p-2.5 shadow-xl">
                        <p className="text-xs font-mono text-slate-300">{label}</p>
                        <p className="text-xs font-bold text-cyan-400 mt-1">Humidity: {payload[0]?.value}%</p>
                      </div>
                    );
                  }}
                />
                <Line
                  name="Humidity (%)"
                  type="monotone"
                  dataKey="humidity"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Precipitation Bar Chart */}
        <div className="glass-panel rounded-3xl p-6 sm:p-7 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white dark:text-white light:text-slate-900">
              Precipitation Accumulation
            </h3>
            <p className="text-xs text-slate-400">Hourly rainfall records (mm)</p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="formattedTime" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} unit=" mm" />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    return (
                      <div className="rounded-xl border border-slate-700/80 bg-slate-950/90 p-2.5 shadow-xl">
                        <p className="text-xs font-mono text-slate-300">{label}</p>
                        <p className="text-xs font-bold text-sky-400 mt-1">Precipitation: {payload[0]?.value} mm</p>
                      </div>
                    );
                  }}
                />
                <Bar
                  name="Precipitation (mm)"
                  dataKey="precipitation"
                  fill="#0ea5e9"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. Wind Velocity Profile */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7 space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white dark:text-white light:text-slate-900">
            Wind Velocity Dynamics
          </h3>
          <p className="text-xs text-slate-400">Anemometer measurements (km/h)</p>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="windGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="formattedTime" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} unit=" km/h" />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  return (
                    <div className="rounded-xl border border-slate-700/80 bg-slate-950/90 p-2.5 shadow-xl">
                      <p className="text-xs font-mono text-slate-300">{label}</p>
                      <p className="text-xs font-bold text-emerald-400 mt-1">Wind Speed: {payload[0]?.value} km/h</p>
                    </div>
                  );
                }}
              />
              <Area
                name="Wind Speed (km/h)"
                type="monotone"
                dataKey="windSpeed"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#windGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
