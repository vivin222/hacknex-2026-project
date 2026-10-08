import React from 'react';
import { AlertTriangle, HelpCircle, Check, ArrowRight, CornerDownRight } from 'lucide-react';
import ConfidenceBadge from './ConfidenceBadge';

/**
 * UncertaintyPanel Component
 * CORE JUDGING FEATURE:
 * Displays all detected ambiguous or low-confidence handwriting segments.
 * Clearly surfaces extracted text, confidence percentage, root-cause reason,
 * and quick-substitution alternatives for human-in-the-loop correction.
 */
export default function UncertaintyPanel({
  uncertainRegions = [],
  activeRegionId = null,
  onSelectRegion = () => {},
  onApplyAlternative = () => {},
}) {
  if (!uncertainRegions || uncertainRegions.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 text-center">
        <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center mb-2">
          <Check className="w-4 h-4" />
        </div>
        <h4 className="text-sm font-medium text-slate-300">No Low-Confidence Regions Flagged</h4>
        <p className="text-xs text-slate-500 mt-1">All characters met the minimum OCR fidelity threshold.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      {/* Panel Header */}
      <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800/90 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Uncertain Regions
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {uncertainRegions.length} flagged
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Low-fidelity strokes flagged for human verification
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono text-slate-400 hidden sm:inline bg-slate-800/80 px-2 py-1 rounded">
          Core Auditing Layer
        </span>
      </div>

      {/* Uncertainty list */}
      <div className="p-4 space-y-3 max-h-[460px] overflow-y-auto">
        {uncertainRegions.map((region) => {
          const isSelected = activeRegionId === region.id;
          const conf = region.confidence ?? 0.5;

          // Border color based on confidence severity
          let cardBorder = 'border-amber-500/30 bg-amber-950/10 hover:border-amber-500/50';
          if (conf < 0.6) {
            cardBorder = 'border-rose-500/40 bg-rose-950/15 hover:border-rose-500/60';
          } else if (conf >= 0.7) {
            cardBorder = 'border-yellow-500/30 bg-yellow-950/10 hover:border-yellow-500/40';
          }

          if (isSelected) {
            cardBorder = 'border-indigo-500 bg-indigo-950/30 ring-1 ring-indigo-500';
          }

          return (
            <div
              key={region.id}
              onClick={() => onSelectRegion(region)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${cardBorder}`}
            >
              {/* Region Top Row */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-slate-100 bg-slate-900/90 px-2 py-1 rounded border border-slate-700/80">
                      "{region.text}"
                    </span>
                    {region.line && (
                      <span className="text-[10px] font-mono text-slate-500">
                        Line {region.line}
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0">
                  <ConfidenceBadge confidence={region.confidence} size="sm" showLabel={false} />
                </div>
              </div>

              {/* Reason description */}
              <div className="mt-2.5 flex items-start gap-1.5 text-xs text-amber-200/90 bg-amber-950/30 px-2.5 py-1.5 rounded-lg border border-amber-500/20">
                <HelpCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                <span className="font-normal leading-relaxed">{region.reason}</span>
              </div>

              {/* Suggested Alternatives if available */}
              {((region.alternatives && region.alternatives.length > 0) || (region.suggested_alternatives && region.suggested_alternatives.length > 0)) && (
                <div className="mt-3 pt-2.5 border-t border-slate-800/80">
                  <div className="text-[11px] font-medium text-slate-400 mb-1.5 flex items-center gap-1">
                    <CornerDownRight className="w-3 h-3 text-slate-500" />
                    Suggested Disambiguations:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(region.alternatives || region.suggested_alternatives || []).map((alt) => (
                      <button
                        key={alt}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onApplyAlternative(region, alt);
                        }}
                        className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800/90 hover:bg-indigo-600 text-slate-300 hover:text-white border border-slate-700 hover:border-indigo-500 transition-colors flex items-center gap-1"
                        title={`Replace "${region.text}" with "${alt}"`}
                      >
                        <span>{alt}</span>
                        <ArrowRight className="w-2.5 h-2.5 opacity-60" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
