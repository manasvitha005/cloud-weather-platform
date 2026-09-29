'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { LocationAnalyticsResponse, TimeRange } from '@/types/analytics';
import { AnalyticsCharts } from '@/components/analytics/AnalyticsCharts';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/LoadingSkeleton';
import {
  BarChart3,
  Calendar,
  MapPin,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  Database,
  RefreshCw,
  Table as TableIcon,
} from 'lucide-react';
import { formatCelsius, formatHumidity, formatWindSpeed, formatPrecipitation } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function AnalyticsPage() {
  const [locations, setLocations] = useState<Array<{ id: string; name: string; country: string }>>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [analytics, setAnalytics] = useState<LocationAnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isIngesting, setIsIngesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch Location list
  useEffect(() => {
    const fetchLocs = async () => {
      try {
        const res = await fetch('/api/locations');
        if (res.ok) {
          const data = await res.json();
          setLocations(data.locations || []);
          if (data.locations?.length > 0 && !selectedLocationId) {
            setSelectedLocationId(data.locations[0].id);
          }
        }
      } catch {
        // silent fallback
      }
    };
    fetchLocs();
  }, [selectedLocationId]);

  // 2. Fetch Analytics
  const loadAnalytics = useCallback(async (locId: string, range: TimeRange) => {
    if (!locId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/analytics?locationId=${locId}&range=${range}`);
      if (!res.ok) {
        throw new Error(`Analytics fetch failed with HTTP ${res.status}`);
      }
      const data: LocationAnalyticsResponse = await res.json();
      setAnalytics(data);
      setError(null);
    } catch (err: unknown) {
      console.error('[Analytics] Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Could not aggregate analytics.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedLocationId) {
      loadAnalytics(selectedLocationId, timeRange);
    }
  }, [selectedLocationId, timeRange, loadAnalytics]);

  // Trigger manual collection
  const handleTriggerIngestion = async () => {
    setIsIngesting(true);
    try {
      const res = await fetch('/api/jobs/weather-collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggerType: 'MANUAL' }),
      });
      if (res.ok) {
        await loadAnalytics(selectedLocationId, timeRange);
      }
    } finally {
      setIsIngesting(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!analytics || !analytics.series.length) return;

    const headers = ['Timestamp', 'Time', 'Temperature (°C)', 'Feels Like (°C)', 'Humidity (%)', 'Wind Speed (km/h)', 'Precipitation (mm)', 'Pressure (hPa)'];
    const rows = analytics.series.map((pt) => [
      pt.timestamp,
      pt.formattedTime,
      pt.temperature,
      pt.feelsLike,
      pt.humidity,
      pt.windSpeed,
      pt.precipitation,
      pt.pressure || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${analytics.location.name}_analytics_${timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderTrendIcon = (trend: 'increasing' | 'decreasing' | 'stable') => {
    if (trend === 'increasing') return <TrendingUp className="h-3.5 w-3.5 text-rose-400" />;
    if (trend === 'decreasing') return <TrendingDown className="h-3.5 w-3.5 text-sky-400" />;
    return <Minus className="h-3.5 w-3.5 text-slate-400" />;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full bg-sky-500/10 px-2.5 py-0.5 text-xs font-semibold text-sky-400 border border-sky-500/20">
              Cloud SQL Analytics Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white dark:text-white light:text-slate-900 tracking-tight">
            Historical Weather Analytics & Trends
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-400 light:text-slate-600 mt-1">
            Real time-series statistical aggregations generated from persistent PostgreSQL observations
          </p>
        </div>

        {/* Action Controls: Location Selector & Time Filter */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Location Select */}
          {locations.length > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-1.5 border border-slate-700">
              <MapPin className="h-3.5 w-3.5 text-sky-400" />
              <select
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                className="bg-transparent text-xs font-semibold text-white outline-none cursor-pointer"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id} className="bg-slate-900 text-white">
                    {loc.name}, {loc.country}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Time Range Switcher */}
          <div className="flex items-center rounded-xl bg-slate-900 p-1 border border-slate-700">
            {(['24h', '7d', '30d'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  'px-3 py-1 text-xs font-bold rounded-lg transition-all uppercase',
                  timeRange === range
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Export CSV */}
          {analytics && analytics.series.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white border border-slate-700 transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-sky-400" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-80 rounded-3xl" />
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <ErrorState
          title="Failed to Load Historical Analytics"
          message={error}
          onRetry={() => loadAnalytics(selectedLocationId, timeRange)}
        />
      )}

      {/* Empty State when no records collected yet */}
      {analytics && !isLoading && !error && !analytics.hasSufficientData && (
        <EmptyState
          icon={Database}
          title="No Historical Observations Recorded Yet"
          description="Historical analytics will automatically compute as the Cloud Scheduler background worker ingests periodic weather data into Google Cloud SQL."
          actionLabel={isIngesting ? 'Ingesting Data...' : 'Trigger Immediate Data Ingestion'}
          onAction={handleTriggerIngestion}
        />
      )}

      {/* Main Analytics Content */}
      {analytics && !isLoading && !error && analytics.hasSufficientData && (
        <div className="space-y-8">
          {/* 1. Aggregated Statistical KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Temperature KPI */}
            <div className="glass-card rounded-2xl p-5 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-semibold uppercase tracking-wider">Average Temp</span>
                <div className="flex items-center gap-1 font-mono">
                  {renderTrendIcon(analytics.metrics.temperature.trend)}
                  <span>{analytics.metrics.temperature.changeRate}%</span>
                </div>
              </div>
              <p className="text-3xl font-extrabold text-white font-mono">
                {analytics.metrics.temperature.avg}°C
              </p>
              <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800 font-mono">
                <span>Min: {analytics.metrics.temperature.min}°C</span>
                <span>Max: {analytics.metrics.temperature.max}°C</span>
              </div>
            </div>

            {/* Humidity KPI */}
            <div className="glass-card rounded-2xl p-5 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-semibold uppercase tracking-wider">Average Humidity</span>
                <div className="flex items-center gap-1 font-mono">
                  {renderTrendIcon(analytics.metrics.humidity.trend)}
                  <span>{analytics.metrics.humidity.changeRate}%</span>
                </div>
              </div>
              <p className="text-3xl font-extrabold text-cyan-400 font-mono">
                {analytics.metrics.humidity.avg}%
              </p>
              <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800 font-mono">
                <span>Min: {analytics.metrics.humidity.min}%</span>
                <span>Max: {analytics.metrics.humidity.max}%</span>
              </div>
            </div>

            {/* Wind KPI */}
            <div className="glass-card rounded-2xl p-5 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-semibold uppercase tracking-wider">Average Wind</span>
                <span className="font-mono text-emerald-400">Peak: {analytics.metrics.windSpeed.max} km/h</span>
              </div>
              <p className="text-3xl font-extrabold text-emerald-400 font-mono">
                {analytics.metrics.windSpeed.avg} <span className="text-xs text-slate-400">km/h</span>
              </p>
              <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800 font-mono">
                <span>Current: {analytics.metrics.windSpeed.current} km/h</span>
                <span>Trend: {analytics.metrics.windSpeed.trend}</span>
              </div>
            </div>

            {/* Precipitation KPI */}
            <div className="glass-card rounded-2xl p-5 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-semibold uppercase tracking-wider">Total Rainfall</span>
                <span className="font-mono text-sky-400">{analytics.metrics.precipitation.rainyHours} rainy hrs</span>
              </div>
              <p className="text-3xl font-extrabold text-sky-400 font-mono">
                {analytics.metrics.precipitation.total} <span className="text-xs text-slate-400">mm</span>
              </p>
              <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800 font-mono">
                <span>Max 1h: {analytics.metrics.precipitation.maxHourly} mm</span>
                <span>Obs: {analytics.totalObservations}</span>
              </div>
            </div>
          </div>

          {/* 2. Interactive Charts */}
          <AnalyticsCharts analytics={analytics} />

          {/* 3. Raw Observations Log Table */}
          <div className="glass-panel rounded-3xl p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  <TableIcon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white dark:text-white light:text-slate-900">
                    Cloud Database Observation Records
                  </h3>
                  <p className="text-xs text-slate-400">
                    Latest {analytics.series.length} observations recorded for {analytics.location.name}
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="border-b border-slate-800 bg-slate-900/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="py-3 px-4">Observation Time</th>
                    <th className="py-3 px-4">Temperature</th>
                    <th className="py-3 px-4">Feels Like</th>
                    <th className="py-3 px-4">Humidity</th>
                    <th className="py-3 px-4">Wind Speed</th>
                    <th className="py-3 px-4">Precipitation</th>
                    <th className="py-3 px-4">Pressure</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {analytics.series.slice(-10).reverse().map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 text-white font-sans">{r.formattedTime}</td>
                      <td className="py-3 px-4 font-bold text-sky-400">{r.temperature}°C</td>
                      <td className="py-3 px-4 text-slate-400">{r.feelsLike}°C</td>
                      <td className="py-3 px-4 text-cyan-400">{r.humidity}%</td>
                      <td className="py-3 px-4 text-emerald-400">{r.windSpeed} km/h</td>
                      <td className="py-3 px-4 text-blue-400">{r.precipitation} mm</td>
                      <td className="py-3 px-4 text-slate-400">{r.pressure ? `${r.pressure} hPa` : '--'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
