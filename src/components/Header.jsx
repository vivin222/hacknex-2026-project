import React, { useEffect, useState } from 'react';
import { PenTool, Activity, ShieldCheck, Database, Layers, Radio, Sparkles, Terminal } from 'lucide-react';
import { checkBackendHealth } from '../services/api';

/**
 * Header Component — Paper Intelligence Research Desk
 * Team: CRY NOVA
 * Project: HNX26EPS04 — Extreme Bad-Handwriting Digitizing Stack
 */
export default function Header() {
  const [backendStatus, setBackendStatus] = useState({
    checked: false,
    online: false,
    status: 'checking',
    hostLabel: '',
  });

  useEffect(() => {
    let isMounted = true;
    const performCheck = () => {
      checkBackendHealth().then((res) => {
        if (isMounted) {
          setBackendStatus({
            checked: true,
            online: res.online,
            status: res.status || (res.online ? 'online' : 'offline'),
            hostLabel: res.hostLabel || '',
          });
        }
      });
    };

    performCheck();
    const interval = setInterval(performCheck, 12000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="border-b border-[#D8CEBC]/70 bg-[#FAF6EE]/95 backdrop-blur-md sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Project Identifiers */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#171717] flex items-center justify-center text-[#F5F0E6] shadow-sm ring-1 ring-[#171717]/10">
            <PenTool className="w-5 h-5 text-[#2563EB]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-widest text-[#171717] uppercase font-mono">
                CRY NOVA
              </span>
              <span className="text-[#A39986]">•</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#EAE3D2] text-[#525252] font-semibold border border-[#D8CEBC]">
                HNX26EPS04
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-semibold text-[#171717] tracking-tight">
              Extreme Bad-Handwriting Digitizing Stack
            </h1>
          </div>
        </div>

        {/* Workflow breadcrumb on medium+ displays */}
        <div className="hidden lg:flex items-center gap-2 text-xs font-mono bg-[#EAE3D2]/70 px-3.5 py-1.5 rounded-full border border-[#D8CEBC]/80">
          <span className="text-[#171717] font-semibold">Physical Paper</span>
          <span className="text-[#A39986]">→</span>
          <span className="text-[#2563EB] font-semibold">Fast Preprocess & Primary OCR</span>
          <span className="text-[#A39986]">→</span>
          <span className="text-[#06B6D4] font-semibold">Evidence-Linked AI</span>
        </div>

        {/* Real Backend Status Badge */}
        <div className="flex items-center gap-2">
          {backendStatus.status === 'online' ? (
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-mono bg-emerald-50/90 border border-emerald-300 text-emerald-800 shadow-xs"
              title="FastAPI engine active and ready"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
              <span className="font-bold tracking-wide">ENGINE ONLINE</span>
              {backendStatus.hostLabel && (
                <span className="text-emerald-700/80 text-[10px] hidden sm:inline font-sans">
                  ({backendStatus.hostLabel})
                </span>
              )}
            </div>
          ) : backendStatus.status === 'waking' ? (
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-mono bg-amber-50 border border-amber-300 text-amber-900 shadow-xs"
              title="Cloud server waking from cold standby..."
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span className="font-bold tracking-wide">ENGINE WAKING</span>
              <span className="text-amber-700/80 text-[10px] hidden md:inline font-sans">
                (Standby spin-up)
              </span>
            </div>
          ) : backendStatus.status === 'offline' ? (
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-mono bg-rose-50 border border-rose-300 text-rose-800 shadow-xs"
              title="Engine offline or initializing..."
            >
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="font-bold tracking-wide">ENGINE OFFLINE</span>
              <span className="text-rose-600 text-[10px] hidden md:inline font-sans">
                (Re-checking...)
              </span>
            </div>
          ) : (
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-mono bg-blue-50/70 border border-blue-200 text-[#2563EB]"
              title="Verifying engine status..."
            >
              <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse" />
              <span className="font-medium">ENGINE CHECKING</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
