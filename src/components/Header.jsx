import React, { useEffect, useState } from 'react';
import { PenTool, Activity, ShieldCheck, Database, Layers, Radio, Sparkles } from 'lucide-react';
import { checkBackendHealth } from '../services/api';

/**
 * Header Component for CRY NOVA
 * Displays Red + Black branding, 4-step processing pipeline,
 * and real-time 3-state Engine telemetry badge (ONLINE, WAKING, OFFLINE).
 */
export default function Header() {
  // 'checking' | 'online' | 'waking' | 'offline'
  const [engineState, setEngineState] = useState('checking');
  const [hostLabel, setHostLabel] = useState('Local (:8000)');

  const refreshHealth = async (isFirst = false) => {
    if (isFirst) setEngineState('waking');
    try {
      const res = await checkBackendHealth();
      if (res.online) {
        setEngineState('online');
        setHostLabel(res.hostLabel || 'Render Cloud');
      } else if (res.error && res.error.includes('timed out')) {
        setEngineState('waking');
      } else {
        setEngineState('offline');
      }
    } catch {
      setEngineState('offline');
    }
  };

  useEffect(() => {
    refreshHealth(true);
    const interval = setInterval(() => refreshHealth(false), 12000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="border-b border-red-950/70 bg-[#050508]/95 backdrop-blur-md sticky top-0 z-30 shadow-lg shadow-black/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Project Identifiers */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 via-rose-600 to-red-800 flex items-center justify-center text-white shadow-md shadow-red-900/50 border border-red-500/40">
            <PenTool className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-widest text-red-500 uppercase font-mono">
                CRY NOVA
              </span>
              <span className="text-red-900">•</span>
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-red-950/70 text-red-300 border border-red-900/50 font-semibold">
                HNX26EPS04
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
              Extreme Bad-Handwriting Digitizing Stack
            </h1>
          </div>
        </div>

        {/* 4-Step Technical Flow on large displays */}
        <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono bg-[#0c0c12] px-3.5 py-1.5 rounded-full border border-red-950/60 shadow-inner">
          <span className="text-slate-300 font-semibold flex items-center gap-1">
            <span className="text-red-500 font-bold">01</span> DOCUMENT
          </span>
          <span className="text-red-900">→</span>
          <span className="text-slate-300 font-semibold flex items-center gap-1">
            <span className="text-red-500 font-bold">02</span> RECOGNITION
          </span>
          <span className="text-red-900">→</span>
          <span className="text-slate-300 font-semibold flex items-center gap-1">
            <span className="text-red-500 font-bold">03</span> EVIDENCE
          </span>
          <span className="text-red-900">→</span>
          <span className="text-cyan-400 font-semibold flex items-center gap-1">
            <span className="text-cyan-500 font-bold">04</span> INTELLIGENCE
          </span>
        </div>

        {/* 3-State Live Engine Telemetry Badge */}
        <div className="flex items-center gap-2">
          {engineState === 'online' && (
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 shadow-sm shadow-emerald-950/50"
              title="FastAPI core processing pipeline is healthy & responsive"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-emerald-200">● ENGINE ONLINE</span>
              <span className="text-emerald-500/80 text-[10px]">({hostLabel})</span>
            </div>
          )}

          {engineState === 'waking' && (
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono bg-amber-950/70 border border-amber-500/40 text-amber-300 shadow-sm shadow-amber-950/50"
              title="Backend service cold-starting or connecting..."
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span className="font-bold text-amber-200">● ENGINE WAKING</span>
              <span className="text-amber-500/80 text-[10px]">(Connecting...)</span>
            </div>
          )}

          {engineState === 'offline' && (
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono bg-rose-950/70 border border-rose-500/40 text-rose-300 shadow-sm shadow-rose-950/50"
              title="Backend endpoint unreachable or recovering"
            >
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="font-bold text-rose-200">● ENGINE OFFLINE</span>
              <span className="text-rose-500/80 text-[10px]">(Retrying...)</span>
            </div>
          )}

          {engineState === 'checking' && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono bg-[#101016] border border-red-950/60 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-slate-500 animate-pulse" />
              <span>● CHECKING...</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
