import React, { useEffect, useState } from 'react';
import { PenTool, Activity, ShieldCheck, Database, Layers, Radio } from 'lucide-react';
import { checkBackendHealth } from '../services/api';

/**
 * Header Component
 * Displays team branding, project code, and live backend connection telemetry.
 * Team: CRY NOVA
 * Project: HNX26EPS04 — Extreme Bad-Handwriting Digitizing Stack
 */
export default function Header() {
  const [backendStatus, setBackendStatus] = useState({ checked: false, online: false });

  useEffect(() => {
    let isMounted = true;
    checkBackendHealth().then((res) => {
      if (isMounted) {
        setBackendStatus({ checked: true, online: res.online });
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Project Identifiers */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <PenTool className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wider text-indigo-400 uppercase font-mono">
                CRY NOVA
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                HNX26EPS04
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-semibold text-slate-100 tracking-tight">
              Extreme Bad-Handwriting Digitizing Stack
            </h1>
          </div>
        </div>

        {/* Workflow breadcrumb on medium+ displays */}
        <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800">
          <span className="text-indigo-400 font-semibold">Upload</span>
          <span className="text-slate-600">→</span>
          <span>Analyze</span>
          <span className="text-slate-600">→</span>
          <span>Edit</span>
          <span className="text-slate-600">→</span>
          <span>Export</span>
        </div>

        {/* Architecture & Live Telemetry Badge */}
        <div className="flex items-center gap-2">
          {backendStatus.online ? (
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 shadow-sm"
              title="FastAPI backend running on http://localhost:8000"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Backend:</span>
              <span className="font-semibold text-emerald-200">Online (:8000)</span>
            </div>
          ) : (
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono bg-slate-900 border border-slate-800 text-slate-300"
              title="FastAPI backend offline; using isolated mock data pipeline"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Engine:</span>
              <span className="text-amber-300 font-medium">Mock Mode (Isolated)</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
