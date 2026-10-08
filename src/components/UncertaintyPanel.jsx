import React from 'react';
import { AlertTriangle, HelpCircle, Check, ArrowRight, CornerDownRight, Crosshair } from 'lucide-react';
import ConfidenceBadge from './ConfidenceBadge';

/**
 * UncertaintyPanel Component (Phase 13 — Human Review)
 * Exposes uncertainty rather than hiding it:
 * Displays all ambiguous segments with confidence score, root-cause reason,
 * source region coordinates, and alternative interpretations.
 */
export default function UncertaintyPanel({
  uncertainRegions = [],
  activeRegionId = null,
  onSelectRegion = () => {},
  onApplyAlternative = () => {},
}) {
  if (!uncertainRegions || uncertainRegions.length === 0) {
    return (
      <div className="bg-[#FAF6EE] border border-[#D8CEBC] rounded-xl p-5 text-center shadow-xs">
        <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#059669] mx-auto flex items-center justify-center mb-2 border border-emerald-200">
          <Check className="w-4 h-4" />
        </div>
        <h4 className="text-sm font-bold text-[#171717]">No Ambiguities Flagged</h4>
        <p className="text-xs text-[#525252] mt-1">All extracted character strokes satisfy calibrated fidelity thresholds.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF6EE] border border-[#D8CEBC] rounded-xl overflow-hidden shadow-xs">
      {/* Panel Header */}
      <div className="px-5 py-3.5 bg-[#FAF6EE] border-b border-[#D8CEBC] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-50 text-[#D97706] border border-amber-200">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#171717] flex items-center gap-2">
              <span>⚠ NEEDS HUMAN REVIEW</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-[#D97706] border border-amber-300 font-bold">
                {uncertainRegions.length} flagged
              </span>
            </h3>
            <p className="text-[11px] text-[#525252]">
              Low-certainty strokes isolated for human verification
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono text-[#525252] hidden sm:inline bg-[#EAE3D2] px-2 py-1 rounded border border-[#D8CEBC]">
          Auditing Layer
        </span>
      </div>

      {/* Uncertainty list */}
      <div className="p-4 space-y-3 max-h-[460px] overflow-y-auto">
        {uncertainRegions.map((region) => {
          const isSelected = activeRegionId === region.id;
          const conf = region.confidence ?? 0.5;

          let cardBorder = 'border-amber-200 bg-[#FFFFFF] hover:border-[#D97706]';
          if (conf < 0.6) {
            cardBorder = 'border-red-200 bg-[#FFFFFF] hover:border-[#DC2626]';
          }

          if (isSelected) {
            cardBorder = 'border-[#2563EB] bg-blue-50/40 ring-1 ring-[#2563EB]';
          }

          return (
            <div
              key={region.id}
              onClick={() => onSelectRegion(region)}
              className={`p-3.5 rounded-lg border transition-all cursor-pointer shadow-2xs ${cardBorder}`}
            >
              {/* Region Top Row */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-[#171717] bg-[#FAF6EE] px-2 py-1 rounded border border-[#D8CEBC]">
                      "{region.text}"
                    </span>
                    {region.line && (
                      <span className="text-[10px] font-mono text-[#737373]">
                        {region.line}
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <ConfidenceBadge confidence={region.confidence} size="sm" showLabel={false} />
                  {region.bbox && (
                    <span className="text-[10px] font-mono text-[#2563EB] flex items-center gap-1 hover:underline">
                      <Crosshair className="w-3 h-3" />
                      Locate
                    </span>
                  )}
                </div>
              </div>

              {/* Reason description */}
              <p className="text-xs text-[#525252] mt-2 leading-relaxed">
                <span className="font-semibold text-[#171717]">Reason: </span>
                {region.reason}
              </p>

              {/* Suggested Alternatives if present */}
              {region.alternatives && region.alternatives.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-[#D8CEBC]/70 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-mono text-[#737373] flex items-center gap-1 font-semibold">
                    <CornerDownRight className="w-3 h-3" />
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
                      className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#FAF6EE] hover:bg-amber-100 text-[#171717] border border-[#D8CEBC] hover:border-amber-400 transition-colors"
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
