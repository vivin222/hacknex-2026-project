import React, { useEffect, useState } from 'react';
import { PenTool, Activity, ShieldCheck, Database, Layers, Radio, Sparkles } from 'lucide-react';
import { checkBackendHealth } from '../services/api';

/**
 * Header Component — Paper Intelligence Research Desk
 * Team: CRY NOVA
 * Project: HNX26EPS04 — Extreme Bad-Handwriting Digitizing Stack
 */
export default function Header() {
  const [backendStatus, setBackendStatus] = useState({ checked: false, online: false });

  useEffect(() => {
    let isMounted = true;
    checkBackendHealth().then((res) => {
      if (isMounted) {
        setBackendStatus({ checked: true, online: res.online, hostLabel: res.hostLabel });
      }
    });

    const interval = setInterval(() => {
      checkBackendHealth().then((res) => {
        if (isMounted) {
          setBackendStatus({ checked: true, online: res.online, hostLabel: res.hostLabel });
        }
      });
    }, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="border-b border-[#D8CEBC] bg-[#FAF6EE]/95 backdrop-blur-md sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Project Identifiers */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#171717] flex items-center justify-center text-[#F5F0E6] shadow-sm">
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
        <div className="hidden lg:flex items-center gap-2 text-xs font-mono bg-[#EAE3D2]/70 px-3 py-1.5 rounded-full border border-[#D8CEBC]">
          <span className="text-[#171717] font-semibold">Physical Paper</span>
          <span className="text-[#A39986]">→</span>
          <span className="text-[#2563EB] font-semibold">Digital Understanding</span>
          <span className="text-[#A39986]">→</span>
          <span className="text-[#06B6D4] font-semibold">AI Intelligence</span>
        </div>

        {/* Architecture & Live Telemetry Badge */}
        <div className="flex items-center gap-2">
          {backendStatus.online ? (
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono bg-blue-50 border border-blue-200 text-[#2563EB] shadow-xs"
              title="FastAPI engine connected and active"
            >
              <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse" />
              <span>Engine:</span>
              <span className="font-semibold">
                {backendStatus.hostLabel || 'Cloud Active'}
              </span>
            </div>
          ) : (
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono bg-amber-50 border border-amber-200 text-[#D97706]"
              title="Checking engine connectivity..."
            >
              <span className="w-2 h-2 rounded-full bg-[#D97706] animate-pulse" />
              <span>Engine:</span>
              <span className="font-medium">Connecting...</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
