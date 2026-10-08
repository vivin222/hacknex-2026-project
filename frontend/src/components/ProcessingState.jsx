import React, { useEffect, useState } from 'react';
import { Loader2, Cpu, CheckCircle2, FileSearch, Layers } from 'lucide-react';

const STAGES = [
  { label: 'Ingesting image & applying adaptive binarization', icon: FileSearch },
  { label: 'Segmenting cursive baseline, ligatures & ascenders', icon: Layers },
  { label: 'Executing transformer OCR & uncertainty scoring', icon: Cpu },
  { label: 'Isolating margin notes & crossed-out corrections', icon: CheckCircle2 },
];

/**
 * ProcessingState Component
 * Displays clean technical progress while handwriting analysis is running.
 * Explicitly displays Mock Engine status to maintain transparency.
 */
export default function ProcessingState({ filename = 'handwriting_scan.png' }) {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    const stageInterval = setInterval(() => {
      setCurrentStage((prev) => {
        if (prev < STAGES.length - 1) return prev + 1;
        return prev;
      });
    }, 450);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) return 92;
        return prev + 12;
      });
    }, 200);

    return () => {
      clearInterval(stageInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto my-12 p-8 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-md">
      {/* Top status indicator */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              Analyzing handwriting...
            </h3>
            <p className="text-xs text-slate-400 font-mono truncate max-w-sm">
              Target: {filename}
            </p>
          </div>
        </div>

        {/* Mock transparency badge */}
        <div className="text-right">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
            Mock Pipeline (Lap 3)
          </span>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            Future: POST /api/process
          </div>
        </div>
      </div>

      {/* Progress meter */}
      <div className="mt-6">
        <div className="flex justify-between items-center text-xs font-mono text-slate-400 mb-2">
          <span>PIPELINE EXECUTION</span>
          <span className="text-indigo-400 font-semibold">{progress}%</span>
        </div>
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Pipeline steps */}
      <div className="mt-8 space-y-3">
        {STAGES.map((stage, idx) => {
          const StageIcon = stage.icon;
          const isDone = idx < currentStage;
          const isCurrent = idx === currentStage;

          return (
            <div
              key={stage.label}
              className={`flex items-center gap-3 p-3 rounded-lg border text-xs transition-all duration-200 ${
                isDone
                  ? 'bg-slate-950/40 border-slate-800 text-slate-400'
                  : isCurrent
                  ? 'bg-indigo-950/30 border-indigo-500/40 text-indigo-200 shadow-sm'
                  : 'bg-slate-950/20 border-slate-900 text-slate-600'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-mono font-bold ${
                  isDone
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : isCurrent
                    ? 'bg-indigo-500 text-white animate-pulse'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {isDone ? '✓' : idx + 1}
              </div>
              <span className="flex-1 font-medium">{stage.label}</span>
              {isCurrent && (
                <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider animate-pulse">
                  processing
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer disclaimer */}
      <div className="mt-8 pt-4 border-t border-slate-800/80 text-center text-[11px] text-slate-500">
        Simulating multi-pass neural segmentation and uncertainty scoring without requiring active server.
      </div>
    </div>
  );
}
