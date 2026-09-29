import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/navigation/Navbar';

export const metadata: Metadata = {
  title: 'NimbusCloud | Weather Intelligence & Analytics SaaS',
  description:
    'Cloud-native meteorological monitoring, automated time-series ingestion, real-time alerts, and predictive analytics powered by Google Cloud Platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-50 antialiased selection:bg-sky-500 selection:text-white">
        <div className="relative flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1 pb-16">{children}</main>
          <footer className="border-t border-slate-800/80 bg-slate-950/60 py-8 text-center text-xs text-slate-500">
            <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p>
                © 2026 NimbusCloud Weather Platform. Built with Google Cloud Run, Cloud SQL (PostgreSQL), and Cloud Scheduler.
              </p>
              <div className="flex items-center gap-4 text-[11px] font-mono">
                <span className="text-emerald-400">● Cloud Services Operational</span>
                <span>Open-Meteo API v1</span>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
