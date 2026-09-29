'use client';

import React from 'react';
import { FullWeatherResponse } from '@/types/weather';
import { WeatherIcon } from '@/components/weather/WeatherIcon';
import { getWeatherThemeClass } from '@/services/weather/wmo-codes';
import { formatCelsius, formatWindSpeed, formatHumidity, formatPrecipitation } from '@/lib/utils';
import { MapPin, RefreshCw, Clock, Wind, Droplets, CloudRain } from 'lucide-react';
import { format } from 'date-fns';

interface WeatherHeroProps {
  weather: FullWeatherResponse;
  allLocations?: Array<{ id: string; name: string; country: string }>;
  onSelectLocation?: (id: string) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function WeatherHero({
  weather,
  allLocations = [],
  onSelectLocation,
  onRefresh,
  isRefreshing = false,
}: WeatherHeroProps) {
  const { location, current, daily } = weather;
  const todayForecast = daily[0];
  const atmosphericClass = getWeatherThemeClass(current.weatherCode, current.isDay);

  let formattedSyncTime = 'Just now';
  if (location.lastSyncedAt) {
    try {
      formattedSyncTime = format(new Date(location.lastSyncedAt), 'HH:mm (MMM d)');
    } catch {
      formattedSyncTime = 'Recently';
    }
  }

  return (
    <div
      className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 lg:p-10 transition-all duration-500 border border-white/10 shadow-2xl ${atmosphericClass}`}
    >
      {/* Subtle background glow effect */}
      <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-sky-400/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      {/* Top Bar: Location Title, Quick Switcher & Sync Meta */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-6 items-center gap-1.5 rounded-full bg-black/20 backdrop-blur-md px-3 text-xs font-semibold text-white/90 border border-white/10">
              <MapPin className="h-3.5 w-3.5 text-sky-400" />
              {location.country}
            </span>
            <span className="flex h-6 items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 text-[11px] font-medium text-emerald-300 border border-emerald-500/30">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Feed
            </span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              {location.name}
            </h1>

            {allLocations.length > 1 && onSelectLocation && (
              <select
                value={location.id}
                onChange={(e) => onSelectLocation(e.target.value)}
                className="rounded-lg bg-black/30 backdrop-blur-md border border-white/20 text-xs font-medium text-white px-2.5 py-1.5 outline-none hover:border-sky-400 cursor-pointer"
              >
                {allLocations.map((loc) => (
                  <option key={loc.id} value={loc.id} className="bg-slate-900 text-white">
                    {loc.name}, {loc.country}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Sync Status & Refresh Button */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="text-right hidden sm:block">
            <p className="text-[11px] text-white/60 font-mono flex items-center gap-1 justify-end">
              <Clock className="h-3 w-3 text-white/50" />
              Cloud DB Ingested: {formattedSyncTime}
            </p>
            <p className="text-[11px] text-sky-300 font-mono">
              TZ: {location.timezone}
            </p>
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              aria-label="Refresh weather"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/20 backdrop-blur-md text-white border border-white/10 hover:bg-black/40 hover:border-sky-400/50 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-sky-400' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Main Temperature & Weather Details Hero */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-6">
        {/* Left: Huge Temp & Condition */}
        <div className="lg:col-span-7 flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8">
          <div className="flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl">
            <WeatherIcon
              weatherCode={current.weatherCode}
              isDay={current.isDay}
              className="h-16 w-16 drop-shadow-md"
            />
          </div>

          <div>
            <div className="flex items-baseline gap-3">
              <span className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tighter text-white drop-shadow-sm">
                {Math.round(current.temperature)}°
              </span>
              <span className="text-2xl sm:text-3xl font-light text-white/60">C</span>
            </div>

            <p className="text-xl sm:text-2xl font-semibold text-white/95 mt-1">
              {current.conditionText}
            </p>

            <div className="flex items-center gap-4 text-sm text-white/80 mt-1">
              <span>Feels like {formatCelsius(current.feelsLike)}</span>
              {todayForecast && (
                <>
                  <span>•</span>
                  <span>
                    H: {formatCelsius(todayForecast.tempMax)} / L:{' '}
                    {formatCelsius(todayForecast.tempMin)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Quick Micro-Metrics Pill Group */}
        <div className="lg:col-span-5 grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-black/20 backdrop-blur-md p-3.5 border border-white/10 text-center">
            <div className="flex justify-center mb-1 text-sky-300">
              <Droplets className="h-5 w-5" />
            </div>
            <p className="text-[11px] text-white/70 font-medium">Humidity</p>
            <p className="text-lg font-bold text-white mt-0.5">
              {formatHumidity(current.humidity)}
            </p>
          </div>

          <div className="rounded-2xl bg-black/20 backdrop-blur-md p-3.5 border border-white/10 text-center">
            <div className="flex justify-center mb-1 text-sky-300">
              <Wind className="h-5 w-5" />
            </div>
            <p className="text-[11px] text-white/70 font-medium">Wind Speed</p>
            <p className="text-lg font-bold text-white mt-0.5">
              {formatWindSpeed(current.windSpeed)}
            </p>
          </div>

          <div className="rounded-2xl bg-black/20 backdrop-blur-md p-3.5 border border-white/10 text-center">
            <div className="flex justify-center mb-1 text-sky-300">
              <CloudRain className="h-5 w-5" />
            </div>
            <p className="text-[11px] text-white/70 font-medium">Precipitation</p>
            <p className="text-lg font-bold text-white mt-0.5">
              {formatPrecipitation(current.precipitation)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
