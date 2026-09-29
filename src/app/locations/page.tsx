'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { LocationSearchModal } from '@/components/locations/LocationSearchModal';
import { GeocodingResult } from '@/types/weather';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/LoadingSkeleton';
import {
  MapPin,
  Plus,
  Trash2,
  Power,
  Database,
  Bell,
  Thermometer,
  Compass,
  Clock,
  Globe,
  Loader2,
} from 'lucide-react';
import { formatCelsius } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface LocationItem {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  elevation: number | null;
  isActive: boolean;
  totalRecords: number;
  activeAlertsCount: number;
  latestObservation: {
    temperature: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    precipitation: number;
    conditionText: string | null;
    recordedAt: string;
  } | null;
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadLocations = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/locations');
      if (res.ok) {
        const data = await res.json();
        setLocations(data.locations || []);
      }
    } catch (err) {
      console.error('Error fetching locations:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    setTogglingId(id);
    try {
      const res = await fetch(`/api/locations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (res.ok) {
        await loadLocations();
      }
    } catch (err) {
      console.error('Failed to toggle location:', err);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteLocation = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to stop monitoring ${name}? All associated historical records will be deleted.`)) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await fetch(`/api/locations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadLocations();
      }
    } catch (err) {
      console.error('Failed to delete location:', err);
    } finally {
      setDeletingId(null);
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
        await loadLocations();
      }
    } catch (err) {
      console.error('Failed to add location:', err);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-8">
      {/* Search Modal */}
      <LocationSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelectLocation={() => {}}
        onAddLocation={handleAddLocation}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full bg-sky-500/10 px-2.5 py-0.5 text-xs font-semibold text-sky-400 border border-sky-500/20">
              Multi-Region Fleet
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white dark:text-white light:text-slate-900 tracking-tight">
            Monitored Geographical Locations
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-400 light:text-slate-600 mt-1">
            Manage target cities and coordinates polled by the Cloud Scheduler ingestion worker
          </p>
        </div>

        <button
          onClick={() => setSearchModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-indigo-500 transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add Monitored Location</span>
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-3xl" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && locations.length === 0 && (
        <EmptyState
          icon={Globe}
          title="No Monitored Locations Configured"
          description="Add geographical targets to start ingesting weather records into Cloud SQL."
          actionLabel="Add First Location"
          onAction={() => setSearchModalOpen(true)}
        />
      )}

      {/* Locations Grid */}
      {!isLoading && locations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map((loc) => {
            const isDeleting = deletingId === loc.id;
            const isToggling = togglingId === loc.id;

            return (
              <div
                key={loc.id}
                className={cn(
                  'glass-panel relative flex flex-col justify-between rounded-3xl p-6 transition-all border',
                  loc.isActive
                    ? 'border-slate-800 hover:border-sky-500/40 shadow-xl'
                    : 'border-slate-800/40 opacity-60 bg-slate-950/40'
                )}
              >
                <div>
                  {/* Top Bar: Name & Status */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                        <MapPin className="h-3.5 w-3.5 text-sky-400" />
                        <span>{loc.country}</span>
                      </div>
                      <h3 className="text-xl font-black text-white dark:text-white light:text-slate-900">
                        {loc.name}
                      </h3>
                    </div>

                    <span
                      className={cn(
                        'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border',
                        loc.isActive
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                          : 'bg-slate-800 text-slate-500 border-slate-700'
                      )}
                    >
                      {loc.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Coordinates & Elevation Meta */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 bg-slate-900/60 rounded-xl p-3 border border-slate-800 mb-4">
                    <div>
                      <span className="text-slate-500 block text-[10px]">COORDINATES</span>
                      <span className="text-white font-bold">
                        {loc.latitude.toFixed(2)}°, {loc.longitude.toFixed(2)}°
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">TIMEZONE</span>
                      <span className="text-sky-300 font-bold">{loc.timezone}</span>
                    </div>
                  </div>

                  {/* Latest Ingestion Stats */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Thermometer className="h-3.5 w-3.5 text-amber-400" />
                        Current Temp:
                      </span>
                      <span className="font-bold text-white font-mono">
                        {loc.latestObservation
                          ? formatCelsius(loc.latestObservation.temperature)
                          : '--°C'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Database className="h-3.5 w-3.5 text-sky-400" />
                        Database Records:
                      </span>
                      <span className="font-bold text-sky-400 font-mono">
                        {loc.totalRecords}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Bell className="h-3.5 w-3.5 text-rose-400" />
                        Active Alerts:
                      </span>
                      <span className="font-bold text-rose-400 font-mono">
                        {loc.activeAlertsCount}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions Bar */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs">
                  <button
                    onClick={() => handleToggleActive(loc.id, loc.isActive)}
                    disabled={isToggling}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 font-semibold text-slate-300 hover:text-white transition-colors disabled:opacity-50"
                  >
                    {isToggling ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <Power className="h-3.5 w-3.5 text-sky-400" />
                        <span>{loc.isActive ? 'Pause' : 'Resume'}</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleDeleteLocation(loc.id, loc.name)}
                    disabled={isDeleting}
                    className="flex items-center gap-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 hover:text-white px-3 py-1.5 font-semibold text-rose-400 border border-rose-500/20 transition-all disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
