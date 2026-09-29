'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FullWeatherResponse, GeocodingResult } from '@/types/weather';
import { WeatherAlertItem } from '@/types/alerts';
import { WeatherHero } from '@/components/dashboard/WeatherHero';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { Forecast7Day } from '@/components/dashboard/Forecast7Day';
import { WeatherTrendsChart } from '@/components/charts/WeatherTrendsChart';
import { LocationSearchModal } from '@/components/locations/LocationSearchModal';
import { AlertCard } from '@/components/alerts/AlertCard';
import {
  WeatherHeroSkeleton,
  MetricCardsSkeleton,
  ChartSkeleton,
  ForecastSkeleton,
} from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import {
  Thermometer,
  Droplets,
  Wind,
  Gauge,
  CloudRain,
  Sun,
  Eye,
  Bell,
  Compass,
  Database,
  ArrowUpRight,
} from 'lucide-react';
import {
  formatCelsius,
  formatHumidity,
  formatWindSpeed,
  formatPrecipitation,
  formatPressure,
  getWindDirectionCard,
  getUVLevel,
} from '@/lib/utils';
import Link from 'next/link';

export default function DashboardPage() {
  const [weather, setWeather] = useState<FullWeatherResponse | null>(null);
  const [allLocations, setAllLocations] = useState<Array<{ id: string; name: string; country: string }>>([]);
  const [activeAlerts, setActiveAlerts] = useState<WeatherAlertItem[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // Fetch initial location list
  const loadLocations = useCallback(async () => {
    try {
      const res = await fetch('/api/locations');
      if (res.ok) {
        const data = await res.json();
        setAllLocations(data.locations || []);
        if (!selectedLocationId && data.locations?.length > 0) {
          setSelectedLocationId(data.locations[0].id);
        }
      }
    } catch {
      // silent fallback
    }
  }, [selectedLocationId]);

  // Fetch full weather for selected location
  const loadWeather = useCallback(async (locId?: string | null) => {
    setIsRefreshing(true);
    try {
      const url = locId ? `/api/weather?locationId=${locId}` : '/api/weather';
      const [weatherRes, alertsRes] = await Promise.all([
        fetch(url),
        fetch('/api/alerts?status=ACTIVE'),
      ]);

      if (!weatherRes.ok) {
        throw new Error(`Weather fetch returned HTTP ${weatherRes.status}`);
      }

      const weatherData: FullWeatherResponse = await weatherRes.json();
      setWeather(weatherData);
      setError(null);

      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setActiveAlerts(alertsData.alerts || []);
      }
    } catch (err: unknown) {
      console.error('[Dashboard] Failed loading weather:', err);
      setError(err instanceof Error ? err.message : 'Failed to retrieve weather observations.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  useEffect(() => {
    loadWeather(selectedLocationId);
  }, [selectedLocationId, loadWeather]);

  const handleSelectLocation = (id: string) => {
    setSelectedLocationId(id);
  };

  const handleSelectSearchResult = async (result: GeocodingResult) => {
    // If location is already in monitored list, select it
    const existing = allLocations.find(
      (l) => l.name.toLowerCase() === result.name.toLowerCase()
    );
    if (existing) {
      setSelectedLocationId(existing.id);
    } else {
      // Fetch directly by lat/lon
      setIsLoading(true);
      try {
        const res = await fetch(`/api/weather?lat=${result.latitude}&lon=${result.longitude}`);
        if (res.ok) {
          const data: FullWeatherResponse = await res.json();
          setWeather(data);
          setSelectedLocationId(data.location.id);
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleAddLocation = async (result: GeocodingResult) => {
    try {
      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: result.name,
          country: result.country,
          latitude: result.latitude,
          longitude: result.longitude,
          timezone: result.timezone || 'UTC',
          elevation: result.elevation || null,
        }),
      });
      if (res.ok) {
        const newLoc = await res.json();
        await loadLocations();
        setSelectedLocationId(newLoc.id);
      }
    } catch (err) {
      console.error('Error adding location:', err);
    }
  };

  const handleResolveAlert = async (id: string) => {
    try {
      const res = await fetch(`/api/alerts/${id}/resolve`, { method: 'POST' });
      if (res.ok) {
        setActiveAlerts((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (err) {
      console.error('Error resolving alert:', err);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-8">
      {/* Search Modal */}
      <LocationSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelectLocation={handleSelectSearchResult}
        onAddLocation={handleAddLocation}
      />

      {/* Top Banner: Cloud Ingestion & Monitored Location Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-sky-950/60 to-indigo-950/60 border border-sky-800/40 p-4 px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <Database className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              Google Cloud Ingestion Active
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            </h2>
            <p className="text-[11px] text-slate-400">
              Automated Cloud SQL time-series database synchronization running every 30 minutes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <button
            onClick={() => setSearchModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-sky-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-sky-500/20 hover:bg-sky-400 transition-all"
          >
            <span>+ Monitor City</span>
          </button>
          <Link
            href="/cloud-monitor"
            className="flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white border border-slate-700 transition-colors"
          >
            <span>Pipeline Logs</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Active Alerts Banner if any exist */}
      {activeAlerts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-rose-400 animate-bounce" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Active Weather Alerts ({activeAlerts.length})
              </h3>
            </div>
            <Link href="/alerts" className="text-xs text-sky-400 hover:underline">
              View Alert Center →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeAlerts.slice(0, 2).map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onResolve={handleResolveAlert}
              />
            ))}
          </div>
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="space-y-8">
          <WeatherHeroSkeleton />
          <MetricCardsSkeleton />
          <ChartSkeleton />
          <ForecastSkeleton />
        </div>
      )}

      {/* Error View */}
      {error && !isLoading && (
        <ErrorState
          title="Weather Feed Unavailable"
          message={error}
          onRetry={() => loadWeather(selectedLocationId)}
        />
      )}

      {/* Main Dashboard Content */}
      {weather && !isLoading && !error && (
        <>
          {/* 1. Current Weather Hero */}
          <WeatherHero
            weather={weather}
            allLocations={allLocations}
            onSelectLocation={handleSelectLocation}
            onRefresh={() => loadWeather(selectedLocationId)}
            isRefreshing={isRefreshing}
          />

          {/* 2. Meteorological Metric Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <MetricCard
              icon={Thermometer}
              label="Temperature"
              value={Math.round(weather.current.temperature)}
              unit="°C"
              subtext={`Feels like ${formatCelsius(weather.current.feelsLike)}`}
              badge={{ text: 'Realtime', variant: 'sky' }}
              iconColor="text-amber-400"
            />

            <MetricCard
              icon={Droplets}
              label="Humidity"
              value={Math.round(weather.current.humidity)}
              unit="%"
              subtext="Relative atmospheric vapor"
              badge={{
                text: weather.current.humidity > 80 ? 'High' : 'Normal',
                variant: weather.current.humidity > 80 ? 'amber' : 'emerald',
              }}
              iconColor="text-cyan-400"
            />

            <MetricCard
              icon={Wind}
              label="Wind Speed"
              value={weather.current.windSpeed.toFixed(1)}
              unit="km/h"
              subtext={`Direction: ${getWindDirectionCard(weather.current.windDirection)}`}
              iconColor="text-emerald-400"
            />

            <MetricCard
              icon={CloudRain}
              label="Precipitation"
              value={weather.current.precipitation.toFixed(1)}
              unit="mm"
              subtext="Current hourly rate"
              iconColor="text-blue-400"
            />

            <MetricCard
              icon={Gauge}
              label="Atm. Pressure"
              value={weather.current.pressure ? Math.round(weather.current.pressure) : 1013}
              unit="hPa"
              subtext="Barometric surface"
              iconColor="text-indigo-400"
            />

            <MetricCard
              icon={Sun}
              label="UV Index"
              value={weather.current.uvIndex ?? 2.1}
              subtext={getUVLevel(weather.current.uvIndex ?? 2.1).label}
              badge={{
                text: getUVLevel(weather.current.uvIndex ?? 2.1).label,
                variant: 'sky',
              }}
              iconColor="text-orange-400"
            />
          </div>

          {/* 3. 24-Hour Trends Chart */}
          <WeatherTrendsChart hourly={weather.hourly} />

          {/* 4. 7-Day Synoptic Forecast */}
          <Forecast7Day daily={weather.daily} />
        </>
      )}
    </div>
  );
}
