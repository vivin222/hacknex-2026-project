import React from 'react';
import { AlertTriangle, HelpCircle, Check, ArrowRight, CornerDownRight, Crosshair } from 'lucide-react';
import ConfidenceBadge from './ConfidenceBadge';

/**
 * UncertaintyPanel Component
 * Exposes uncertainty rather than hiding it:
 * Displays all ambiguous segments with confidence score, root-cause reason,
 * source region coordinates, and alternative interpretations.
 * Theme: High-Contrast Red + Black
 */
export default function UncertaintyPanel({
  uncertainRegions = [],
  activeRegionId = null,
  onSelectRegion = () => {},
  onApplyAlternative = () => {},
}) {
  if (!uncertainRegions || uncertainRegions.length === 0) {
    return (
      <div className="bg-[#0c0c12] border border-red-950/60 rounded-xl p-5 text-center shadow-md">
        <div className="w-8 h-8 rounded-full bg-emerald-950/80 text-emerald-400 mx-auto flex items-center justify-center mb-2 border border-emerald-500/30">
          <Check className="w-4 h-4" />
        </div>
        <h4 className="text-sm font-bold text-white">No Ambiguities Flagged</h4>
        <p className="text-xs text-slate-400 mt-1">All extracted character strokes satisfy calibrated fidelity thresholds.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0c0c12] border border-red-950/60 rounded-xl overflow-hidden shadow-xl">
      {/* Panel Header */}
      <div className="px-5 py-3.5 bg-[#08080d] border-b border-red-950/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-950/80 text-amber-400 border border-amber-800/40">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="text-amber-400">⚠ NEEDS HUMAN REVIEW</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/50 font-bold">
                {uncertainRegions.length} flagged
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Low-certainty strokes isolated for human verification
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono text-slate-400 hidden sm:inline bg-[#12121a] px-2 py-1 rounded border border-red-950/60">
          Auditing Layer
        </span>
      </div>

      {/* Uncertainty list */}
      <div className="p-4 space-y-3 max-h-[460px] overflow-y-auto">
        {uncertainRegions.map((region) => {
          const isSelected = activeRegionId === region.id;
          const conf = region.confidence ?? 0.5;

          let cardBorder = 'border-amber-950/70 bg-[#050508] hover:border-amber-600/60';
          if (conf < 0.6) {
            cardBorder = 'border-red-950/70 bg-[#050508] hover:border-red-600/60';
          }

          if (isSelected) {
            cardBorder = 'border-cyan-500 bg-cyan-950/20 ring-1 ring-cyan-500/50';
          }

          return (
            <div
              key={region.id}
              onClick={() => onSelectRegion(region)}
              className={`p-3.5 rounded-lg border transition-all cursor-pointer shadow-inner ${cardBorder}`}
            >
              {/* Region Top Row */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-white bg-[#0f0f16] px-2 py-1 rounded border border-red-950/60">
                      "{region.text}"
                    </span>
                    {region.line && (
                      <span className="text-[10px] font-mono text-slate-400">
                        {region.line}
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <ConfidenceBadge confidence={region.confidence} size="sm" showLabel={false} />
                  {region.bbox && (
                    <span className="text-[10px] font-mono text-cyan-400 flex items-center gap-1 hover:underline">
                      <Crosshair className="w-3 h-3" />
                      Locate
                    </span>
                  )}
                </div>
              </div>

              {/* Reason description */}
              <p className="text-xs text-slate-300 mt-2 leading-relaxed font-mono">
                <span className="font-semibold text-red-400">Reason: </span>
                {region.reason}
              </p>

              {/* Suggested Alternatives if present */}
              {region.alternatives && region.alternatives.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-red-950/60 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 font-semibold">
                    <CornerDownRight className="w-3 h-3 text-cyan-400" />
                    Possible Interpretations:
                  </span>
                  {region.alternatives.map((alt, aIdx) => (
                    <button
                      key={aIdx}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onApplyAlternative(region, alt);
                      }}
                      className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#101018] hover:bg-amber-950/60 text-slate-200 border border-red-950/60 hover:border-amber-500/50 transition-colors"
                      title="Click to apply substitution"
                    >
                      {alt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
