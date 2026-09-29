'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, MapPin, Plus, Loader2 } from 'lucide-react';
import { GeocodingResult } from '@/types/weather';

interface LocationSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (loc: GeocodingResult) => void;
  onAddLocation?: (loc: GeocodingResult) => Promise<void>;
}

export function LocationSearchModal({
  isOpen,
  onClose,
  onSelectLocation,
  onAddLocation,
}: LocationSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/geocoding?q=${encodeURIComponent(query.trim())}&limit=6`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
        }
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Search Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 px-4 py-3.5">
          <Search className="h-5 w-5 text-sky-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search city, region, or country (e.g. Tokyo, Paris, Dallas)..."
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-400 outline-none"
          />
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
          ) : query ? (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-2 py-1 text-xs text-slate-400 hover:text-white"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {results.length > 0 ? (
            results.map((loc) => (
              <div
                key={loc.id}
                className="group flex items-center justify-between rounded-xl p-3 hover:bg-slate-800/70 transition-colors"
              >
                <button
                  onClick={() => {
                    onSelectLocation(loc);
                    onClose();
                  }}
                  className="flex items-center gap-3 text-left flex-1"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-sky-400 border border-slate-700 group-hover:border-sky-500/40">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white group-hover:text-sky-400 transition-colors">
                      {loc.name}
                      {loc.admin1 ? `, ${loc.admin1}` : ''}
                    </p>
                    <p className="text-xs text-slate-400">
                      {loc.country} • {loc.latitude.toFixed(2)}°, {loc.longitude.toFixed(2)}°
                    </p>
                  </div>
                </button>

                {onAddLocation && (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      setIsAdding(loc.id);
                      await onAddLocation(loc);
                      setIsAdding(null);
                      onClose();
                    }}
                    disabled={isAdding === loc.id}
                    title="Add to Monitored Locations"
                    className="flex items-center gap-1 rounded-lg bg-sky-500/10 px-2.5 py-1.5 text-xs font-semibold text-sky-400 hover:bg-sky-500 hover:text-white border border-sky-500/20 transition-all disabled:opacity-50"
                  >
                    {isAdding === loc.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5" />
                        <span>Monitor</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            ))
          ) : query.trim().length >= 2 && !isLoading ? (
            <div className="py-8 text-center text-sm text-slate-400">
              No geographical matches found for &quot;{query}&quot;.
            </div>
          ) : (
            <div className="py-6 px-4 text-center text-xs text-slate-500">
              Type at least 2 characters to trigger Open-Meteo geocoding search across 200,000+ global cities.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
