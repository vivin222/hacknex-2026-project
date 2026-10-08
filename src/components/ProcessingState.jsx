import React, { useEffect, useState } from 'react';
import {
  Loader2,
  Cpu,
  Layers,
  FileCheck2,
  Eye,
  Sparkles,
  ShieldAlert,
  Binary,
  Clock,
  Compass,
  AlertCircle
} from 'lucide-react';

const PIPELINE_STAGES = [
  {
    id: 'validation',
    label: 'Document Ingestion & Byte Validation',
    detail: 'Verifying MIME headers, image integrity & pixel resolution',
    icon: Binary,
  },
  {
    id: 'preprocessing',
    label: 'Multi-Pass Adaptive Preprocessing',
    detail: 'Generating CLAHE contrast, Laplacian sharpened & adaptive binarization variants',
    icon: Layers,
  },
  {
    id: 'htr_ocr',
    label: 'Neural OCR / HTR Line & Word Detection',
    detail: 'RapidOCR ONNX Runtime extracting verbatim character strokes and bounding boxes',
    icon: Cpu,
  },
  {
    id: 'multipass_eval',
    label: 'Multi-Pass Evaluation & Candidate Scoring',
    detail: 'Evaluating passes using Mean Confidence × 0.6 + Character Yield × 0.4',
    icon: Compass,
  },
  {
    id: 'vlm_analysis',
    label: 'VLM Visual Reasoning & Strikethrough Inspection',
    detail: 'Inspecting visual structure, spatial margins & isolating pen strikethroughs',
    icon: Eye,
  },
  {
    id: 'correction',
    label: 'Contextual Post-Correction & Disambiguation',
    detail: 'Conservative post-correction preserving verbatim stroke evidence without hallucination',
    icon: Sparkles,
  },
  {
    id: 'semantics',
    label: 'Semantic Intelligence Extraction',
    detail: 'Extracting clinical entities, verified claims, measurements, vitals & timeline',
    icon: FileCheck2,
  },
  {
    id: 'uncertainty',
    label: 'Uncertainty Isolation & Source Provenance',
    detail: 'Evaluating calibrated thresholds and linking evidence coordinates to original scan',
    icon: ShieldAlert,
  },
];

/**
 * ProcessingState Component — Paper Intelligence Scanning Experience
 * Team: CRY NOVA
 */
export default function ProcessingState({
  filename = 'handwriting_scan.png',
  previewUrl = null,
  statusMessage = '',
}) {
  const [currentStage, setCurrentStage] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0.0);

  useEffect(() => {
    const startTime = Date.now();

    // Live elapsed timer
    const timerInterval = setInterval(() => {
      setElapsedSeconds(Number(((Date.now() - startTime) / 1000).toFixed(1)));
    }, 100);

    // Progressive stage progression
    const stageInterval = setInterval(() => {
      setCurrentStage((prev) => {
        if (prev < PIPELINE_STAGES.length - 1) return prev + 1;
        return prev;
      });
    }, 1100);

    return () => {
      clearInterval(timerInterval);
      clearInterval(stageInterval);
    };
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto my-8 p-6 sm:p-8 bg-[#FAF6EE] border border-[#D8CEBC] rounded-xl shadow-md space-y-6">
      {/* Scanner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#D8CEBC]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-lg bg-[#EAE3D2] border border-[#D8CEBC] text-[#171717] shrink-0">
            <Loader2 className="w-5 h-5 animate-spin text-[#2563EB]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#171717]">
                Scanning & Digitizing Manuscript
              </h3>
              <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse" />
            </div>
            <p className="text-xs text-[#525252] font-mono truncate max-w-sm mt-0.5">
              Target: <span className="text-[#171717] font-semibold">{filename}</span>
            </p>
          </div>
        </div>

        {/* Live Elapsed & Engine Badge */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5 shrink-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-[#FFFFFF] border border-[#D8CEBC] text-[#171717]">
            <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Elapsed: {elapsedSeconds}s</span>
          </div>
          <span className="text-[10px] font-mono text-[#2563EB] font-medium">
            FastAPI Pipeline (/analyze)
          </span>
        </div>
      </div>

      {/* Cloud Cold Start / Waking Up Banner if reported */}
      {statusMessage && (
        <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-300 text-[#D97706] text-xs flex items-center gap-2.5 animate-pulse">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-medium font-mono">{statusMessage}</span>
        </div>
      )}

      {/* Target Preview Thumbnail if available */}
      {previewUrl && (
        <div className="p-3 rounded-lg bg-[#FFFFFF] border border-[#D8CEBC] flex items-center gap-3 shadow-2xs">
          <img
            src={previewUrl}
            alt="Scanning input"
            className="w-16 h-12 object-cover rounded border border-[#D8CEBC] shrink-0"
          />
          <div className="text-xs space-y-0.5 min-w-0">
            <p className="font-semibold text-[#171717] truncate">Active OCR Ingestion Stream</p>
            <p className="text-[11px] text-[#737373] font-mono">
              Preserving original visual resolution for stroke disambiguation
            </p>
          </div>
        </div>
      )}

      {/* Active Stage Banner */}
      <div className="p-3.5 rounded-lg bg-[#FFFFFF] border border-[#2563EB]/40 shadow-xs">
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono text-[11px] uppercase tracking-wider text-[#2563EB] font-bold">
            Stage {currentStage + 1} of {PIPELINE_STAGES.length}
          </span>
          <span className="font-mono text-[11px] text-[#525252] font-semibold">
            {PIPELINE_STAGES[currentStage].label}
          </span>
        </div>
        <p className="text-xs text-[#171717] mt-1">
          {PIPELINE_STAGES[currentStage].detail}
        </p>
      </div>

      {/* Pipeline Stage Checklist */}
      <div className="space-y-1.5">
        {PIPELINE_STAGES.map((stage, idx) => {
          const StageIcon = stage.icon;
          const isDone = idx < currentStage;
          const isCurrent = idx === currentStage;

          return (
            <div
              key={stage.id}
              className={`flex items-start gap-3 p-2 rounded-lg border text-xs transition-all duration-200 ${
                isDone
                  ? 'bg-[#FAF6EE] border-[#D8CEBC]/70 text-[#525252]'
                  : isCurrent
                  ? 'bg-[#FFFFFF] border-[#2563EB] text-[#171717] shadow-xs'
                  : 'bg-[#FAF6EE]/50 border-transparent text-[#A39986] opacity-60'
              }`}
            >
              <div
                className={`w-5 h-5 rounded flex items-center justify-center shrink-0 text-[10px] font-mono font-bold mt-0.5 ${
                  isDone
                    ? 'bg-blue-50 text-[#2563EB] border border-blue-200'
                    : isCurrent
                    ? 'bg-[#2563EB] text-white animate-pulse'
                    : 'bg-[#EAE3D2] text-[#737373]'
                }`}
              >
                {isDone ? '✓' : idx + 1}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${isCurrent ? 'text-[#2563EB]' : 'text-[#171717]'}`}>
                    {stage.label}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] font-mono text-[#2563EB] uppercase tracking-wider font-bold">
                      Active
                    </span>
                  )}
                  {isDone && (
                    <span className="text-[10px] font-mono text-[#059669]">
                      Complete
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#737373] truncate mt-0.5">
                  {stage.detail}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Archival Guarantee */}
      <div className="pt-3 border-t border-[#D8CEBC] text-center text-[11px] font-mono text-[#737373] flex items-center justify-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
        <span>HNX26EPS04 AI Engine • Zero Hallucination Protocol Active</span>
      </div>
    </div>
  );
}
