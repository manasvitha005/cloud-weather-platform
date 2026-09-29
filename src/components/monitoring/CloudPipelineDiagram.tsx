'use client';

import React, { useState } from 'react';
import {
  Clock,
  Server,
  Cloud,
  CheckCircle2,
  Database,
  Bell,
  BarChart3,
  ArrowRight,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function CloudPipelineDiagram() {
  const [selectedNode, setSelectedNode] = useState<number>(0);

  const pipelineNodes = [
    {
      id: 0,
      title: '1. Cloud Scheduler',
      category: 'GCP Cron Service',
      icon: Clock,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/20',
      desc: 'Google Cloud Scheduler triggers automated execution every 15-30 minutes via secured HTTP POST with secret token authorization.',
      gcpService: 'Cloud Scheduler',
      concept: 'Serverless Cron & Event Triggering',
    },
    {
      id: 1,
      title: '2. Ingestion Service',
      category: 'Cloud Run Container',
      icon: Server,
      color: 'text-sky-400',
      bgColor: 'bg-sky-500/10 border-sky-500/20',
      desc: 'Next.js App Router background execution endpoint validates request headers, spins up lightweight workers, and queries active locations.',
      gcpService: 'Google Cloud Run',
      concept: 'Stateless Containerized Auto-scaling',
    },
    {
      id: 2,
      title: '3. Open-Meteo API',
      category: 'External Data Provider',
      icon: Cloud,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10 border-indigo-500/20',
      desc: 'Global meteorological data feed queried with high-precision coordinates for temperature, humidity, pressure, wind, and precipitation.',
      gcpService: 'External SaaS Integration',
      concept: 'Resilient Third-Party API Integration',
    },
    {
      id: 3,
      title: '4. Validation & Normalization',
      category: 'Zod Data Validation',
      icon: ShieldCheck,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
      desc: 'Schema validation checks ensure incoming payloads adhere strictly to typed schema and normalize WMO weather codes.',
      gcpService: 'Server-side Logic',
      concept: 'Data Cleansing & Fault Tolerance',
    },
    {
      id: 4,
      title: '5. Cloud SQL PostgreSQL',
      category: 'Managed Relational DB',
      icon: Database,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10 border-blue-500/20',
      desc: 'Idempotent ingestion prevents duplicate timestamp records using composite unique constraints on (locationId, recordedAt).',
      gcpService: 'Cloud SQL (PostgreSQL 16)',
      concept: 'Persistent Cloud Time-Series Storage',
    },
    {
      id: 5,
      title: '6. Alert & Analytics Engine',
      category: 'Event Processor',
      icon: Bell,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10 border-rose-500/20',
      desc: 'Evaluates newly written observations against user-configurable threshold rules and produces historical statistical aggregates.',
      gcpService: 'Cloud Run / PostgreSQL Aggregations',
      concept: 'Event-driven Rules & Real-time Analytics',
    },
  ];

  const active = pipelineNodes[selectedNode];

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white dark:text-white light:text-slate-900">
              Automated Cloud Data Pipeline Architecture
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-500">
              End-to-end meteorological ingestion, processing, and storage lifecycle
            </p>
          </div>
        </div>
      </div>

      {/* Visual Pipeline Nodes Flow */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
        {pipelineNodes.map((node, index) => {
          const Icon = node.icon;
          const isSelected = selectedNode === node.id;
          return (
            <button
              key={node.id}
              onClick={() => setSelectedNode(node.id)}
              className={cn(
                'group relative flex flex-col items-center justify-between p-4 rounded-2xl border text-center transition-all cursor-pointer',
                isSelected
                  ? 'border-sky-500 bg-sky-500/15 shadow-lg shadow-sky-500/10 scale-105'
                  : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-800/60'
              )}
            >
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-xl border mb-3 transition-transform group-hover:scale-110',
                  node.bgColor
                )}
              >
                <Icon className={cn('h-6 w-6', node.color)} />
              </div>

              <h4 className="text-xs font-bold text-white dark:text-white light:text-slate-900">
                {node.title}
              </h4>
              <p className="text-[10px] text-slate-400 mt-1 font-mono">{node.category}</p>

              {index < pipelineNodes.length - 1 && (
                <div className="hidden lg:block absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
                  <ArrowRight className="h-4 w-4 text-slate-600" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Node Details Box */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 mt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-sky-500/10 px-2.5 py-1 text-xs font-bold text-sky-400 border border-sky-500/20">
              {active.gcpService}
            </span>
            <h4 className="text-sm font-bold text-white">{active.title}</h4>
          </div>
          <span className="text-xs text-amber-400 font-mono">
            Concept: {active.concept}
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          {active.desc}
        </p>
      </div>
    </div>
  );
}
