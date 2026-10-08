import React, { useEffect, useState } from 'react';
import {
  Loader2,
  CheckCircle2,
  FileSearch,
  Cpu,
  Eye,
  Sparkles,
  AlertCircle,
  Clock,
  Layers,
  Zap,
} from 'lucide-react';

const PROGRESS_STEPS = [
  {
    id: 'reading',
    label: 'READING DOCUMENT',
    detail: 'Ingesting document bytes & normalizing image canvas',
    icon: FileSearch,
  },
  {
    id: 'recognizing',
    label: 'RECOGNIZING HANDWRITING',
    detail: 'Fast-Path primary OCR detecting verbatim character strokes',
    icon: Cpu,
  },
  {
    id: 'visual',
    label: 'CHECKING VISUAL EVIDENCE',
    detail: 'Inspecting stroke contours & isolating pen strikethroughs',
    icon: Eye,
  },
  {
    id: 'intelligence',
    label: 'BUILDING INTELLIGENCE',
    detail: 'Synthesizing verified claims, clinical entities & spatial citations',
    icon: Sparkles,
  },
];

/**
 * ProcessingState Component — Progressive Document Intelligence
 * Team: CRY NOVA
 * Concept: Fast progressive feedback without artificial timer staring
 */
export default function ProcessingState({
  filename = 'handwriting_scan.png',
  previewUrl = null,
  statusMessage = '',
}) {
  const [activeStep, setActiveStep] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0.0);

  useEffect(() => {
    const t0 = Date.now();
    const timer = setInterval(() => {
      setElapsedSec(Number(((Date.now() - t0) / 1000).toFixed(1)));
    }, 100);

    // Natural progressive step pacing
    const stepInterval = setInterval(() => {
      setActiveStep((prev) => (prev < PROGRESS_STEPS.length - 1 ? prev + 1 : prev));
    }, 1300);

    return () => {
      clearInterval(timer);
      clearInterval(stepInterval);
    };
  }, []);

  // Update step if statusMessage changes to specific cues
  useEffect(() => {
    if (!statusMessage) return;
    const msg = statusMessage.toUpperCase();
    if (msg.includes('RECOGNIZING')) setActiveStep(1);
    else if (msg.includes('VISUAL')) setActiveStep(2);
    else if (msg.includes('INTELLIGENCE')) setActiveStep(3);
  }, [statusMessage]);

  return (
    <div className="w-full max-w-2xl mx-auto my-10 p-6 sm:p-8 bg-[#FAF6EE] border border-[#D8CEBC] rounded-2xl shadow-sm space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#D8CEBC]/80 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#171717] flex items-center justify-center text-[#F5F0E6] shadow-xs">
            <Zap className="w-5 h-5 text-[#06B6D4] animate-pulse" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-[#171717] tracking-tight">
              Analyzing Document Intelligence
            </h3>
            <p className="text-xs font-mono text-[#525252] truncate">
              Target: <span className="text-[#171717] font-semibold">{filename}</span>
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-blue-50/80 border border-blue-200 text-[#2563EB]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-ping" />
          <span className="font-semibold">Fast-Path Active</span>
        </div>
      </div>

      {/* Cold Start Banner if waking */}
      {statusMessage && statusMessage.includes('Wake-up') && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-[#D97706] text-xs flex items-center gap-3 animate-pulse">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-mono font-medium">{statusMessage}</span>
        </div>
      )}

      {/* Target Image Preview Strip if available */}
      {previewUrl && (
        <div className="p-3 rounded-xl bg-[#FFFFFF] border border-[#D8CEBC]/70 flex items-center gap-3 shadow-2xs">
          <img
            src={previewUrl}
            alt="Scanning input"
            className="w-16 h-12 object-cover rounded-lg border border-[#D8CEBC] shrink-0"
          />
          <div className="text-xs min-w-0">
            <p className="font-semibold text-[#171717]">Direct Optical Scan Stream</p>
            <p className="text-[11px] text-[#737373] font-mono truncate">
              Preserving spatial resolution for 100% grounded bounding boxes
            </p>
          </div>
        </div>
      )}

      {/* 4 Meaningful Progress Stages */}
      <div className="space-y-3 pt-2">
        {PROGRESS_STEPS.map((step, idx) => {
          const StepIcon = step.icon;
          const isDone = idx < activeStep;
          const isCurrent = idx === activeStep;

          return (
            <div
              key={step.id}
              className={`p-3.5 rounded-xl border transition-all duration-300 flex items-center justify-between ${
                isCurrent
                  ? 'bg-[#FFFFFF] border-[#2563EB] shadow-xs ring-1 ring-[#2563EB]/20'
                  : isDone
                  ? 'bg-[#FAF6EE] border-[#D8CEBC]/60 opacity-90'
                  : 'bg-[#FAF6EE]/50 border-transparent opacity-40'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isDone
                      ? 'bg-emerald-100 text-emerald-700'
                      : isCurrent
                      ? 'bg-blue-100 text-[#2563EB]'
                      : 'bg-[#EAE3D2] text-[#737373]'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : isCurrent ? (
                    <StepIcon className="w-4 h-4 text-[#2563EB] animate-pulse" />
                  ) : (
                    <StepIcon className="w-4 h-4 text-[#737373]" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-mono font-bold tracking-wider ${
                        isDone
                          ? 'text-emerald-700'
                          : isCurrent
                          ? 'text-[#2563EB]'
                          : 'text-[#737373]'
                      }`}
                    >
                      {step.label}
                    </span>
                    {isDone && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ✓
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#525252] truncate mt-0.5">{step.detail}</p>
                </div>
              </div>

              {isCurrent && (
                <div className="shrink-0 flex items-center gap-1.5 pl-2">
                  <Loader2 className="w-4 h-4 text-[#2563EB] animate-spin" />
                  <span className="text-[11px] font-mono font-medium text-[#2563EB]">…</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Secondary Telemetry Footer */}
      <div className="pt-2 border-t border-[#D8CEBC]/60 flex items-center justify-between text-[11px] font-mono text-[#737373]">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[#A39986]" />
          <span>Telemetry: {elapsedSec}s elapsed</span>
        </div>
        <span>Evidence-Linked Pipeline</span>
      </div>
    </div>
  );
}
