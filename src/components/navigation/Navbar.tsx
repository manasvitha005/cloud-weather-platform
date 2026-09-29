'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CloudRain,
  LayoutDashboard,
  BarChart3,
  Bell,
  MapPin,
  Activity,
  Sun,
  Moon,
  Menu,
  X,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavbarProps {
  onOpenSearch?: () => void;
}

export function Navbar({ onOpenSearch }: NavbarProps) {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeAlertsCount, setActiveAlertsCount] = useState<number>(0);
  const [systemHealthy, setSystemHealthy] = useState<boolean>(true);

  useEffect(() => {
    // Check initial dark mode class
    if (typeof window !== 'undefined') {
      const isLight = document.documentElement.classList.contains('light');
      setIsDark(!isLight);
    }

    // Fetch alert count & health status
    const fetchStatus = async () => {
      try {
        const [alertsRes, healthRes] = await Promise.all([
          fetch('/api/alerts?status=ACTIVE'),
          fetch('/api/monitoring'),
        ]);

        if (alertsRes.ok) {
          const data = await alertsRes.json();
          setActiveAlertsCount(data.summary?.totalActive || 0);
        }

        if (healthRes.ok) {
          const data = await healthRes.json();
          setSystemHealthy(data.status === 'HEALTHY');
        }
      } catch {
        // silent fallback
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // 30s poll
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.add('light');
      setIsDark(false);
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.remove('light');
      setIsDark(true);
      localStorage.setItem('theme', 'dark');
    }
  };

  const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    {
      href: '/alerts',
      label: 'Alerts',
      icon: Bell,
      badge: activeAlertsCount > 0 ? activeAlertsCount : undefined,
    },
    { href: '/locations', label: 'Locations', icon: MapPin },
    {
      href: '/cloud-monitor',
      label: 'Cloud Monitor',
      icon: Activity,
      dot: true,
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/80 light:bg-white/80 light:border-slate-200">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="group flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 shadow-md shadow-sky-500/20 transition-transform group-hover:scale-105">
              <CloudRain className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-white dark:text-white light:text-slate-900">
                  Nimbus<span className="text-sky-400">Cloud</span>
                </span>
                <span className="rounded-md bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-sky-400 border border-sky-500/20">
                  GCP v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-500 font-mono">
                Weather Intelligence & Ingestion
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 ml-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors',
                    isActive
                      ? 'bg-sky-500/15 text-sky-400 dark:text-sky-400 light:text-sky-600 font-semibold'
                      : 'text-slate-300 dark:text-slate-300 light:text-slate-600 hover:bg-slate-800/60 dark:hover:bg-slate-800/60 light:hover:bg-slate-100 hover:text-white light:hover:text-slate-900'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white shadow-sm shadow-rose-500/30">
                      {item.badge}
                    </span>
                  )}
                  {item.dot && (
                    <span className="relative flex h-2 w-2">
                      {systemHealthy && (
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                      )}
                      <span
                        className={cn(
                          'relative inline-flex h-2 w-2 rounded-full',
                          systemHealthy ? 'bg-emerald-500' : 'bg-rose-500'
                        )}
                      ></span>
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-3">
          {/* Quick Search Button */}
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-300 hover:border-sky-500/40 hover:text-white dark:border-slate-700/60 dark:bg-slate-900/60 light:bg-slate-100 light:border-slate-300 light:text-slate-600 transition-colors"
            >
              <Search className="h-3.5 w-3.5 text-sky-400" />
              <span className="hidden sm:inline">Search Location...</span>
              <kbd className="hidden sm:inline rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 border border-slate-700">
                /
              </kbd>
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700/60 bg-slate-900/60 text-slate-300 hover:text-white dark:border-slate-700/60 dark:bg-slate-900/60 light:bg-slate-100 light:border-slate-300 light:text-slate-700 transition-colors"
          >
            {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-600" />}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700/60 bg-slate-900/60 text-slate-300 hover:text-white dark:border-slate-700/60 dark:bg-slate-900/60 light:bg-slate-100 light:border-slate-300 light:text-slate-700"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800/80 bg-slate-950/95 px-4 pt-3 pb-5 space-y-1 backdrop-blur-xl dark:bg-slate-950/95 light:bg-white/95 light:border-slate-200">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
                  isActive
                    ? 'bg-sky-500/15 text-sky-400 dark:text-sky-400 light:text-sky-600 font-semibold'
                    : 'text-slate-300 dark:text-slate-300 light:text-slate-700 hover:bg-slate-800/60 dark:hover:bg-slate-800/60 light:hover:bg-slate-100'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
