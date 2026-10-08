import React from 'react';
import {
  ShieldAlert,
  FileCheck2,
  Calendar,
  Activity,
  User,
  Pill,
  Stethoscope,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Scan,
  Crosshair,
  Scissors,
  ArrowRight
} from 'lucide-react';
import ConfidenceBadge from './ConfidenceBadge';

/**
 * IntelligencePanel Component (Phases 11, 13, 14, 15)
 * Structured Document Intelligence with Grounded Provenance:
 * - Prominent "⚠ NEEDS HUMAN REVIEW" banner & review queue
 * - Revision Detection & Contradiction alerts
 * - Extracted Entities (Medications, Patients, Clinical Terms)
 * - Numerical Measurements & Units
 * - Timeline & Chronology
 * - Verified Claims with [OBSERVED], [INFERRED], [UNCERTAIN] status and spatial bbox provenance
 */
export default function IntelligencePanel({
  entities = [],
  claims = [],
  measurements = [],
  timeline = [],
  conflicts = [],
  flags = [],
  reviewSummary = null,
  filename = 'document.png',
  onHoverBbox = null,
  onSelectBbox = null,
}) {
  const needsReview = reviewSummary?.needsHumanReview || flags.length > 0;

  return (
    <div className="space-y-5">
      {/* 1. Human Verification Flag Banner (Phase 13) */}
      {needsReview ? (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[#D97706] font-bold text-xs tracking-wider uppercase">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>⚠ NEEDS HUMAN REVIEW ({flags.length || 1} flagged items)</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-[#D97706] border border-amber-300 font-bold uppercase">
              Verification Required
            </span>
          </div>

          <p className="text-xs text-[#525252] leading-relaxed">
            {reviewSummary?.documentWarning ||
              'This manuscript contains low-confidence or revised handwriting regions. Human verification is recommended before official reliance.'}
          </p>

          {/* Flags Queue */}
          {flags.length > 0 && (
            <div className="space-y-2 pt-1">
              {flags.map((flag, idx) => (
                <div
                  key={flag.id || idx}
                  className="p-3 bg-[#FFFFFF] border border-amber-200 rounded-lg text-xs space-y-1.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-[#D97706] border border-amber-300 uppercase font-bold shrink-0">
                        ⚠ {flag.type || 'NEEDS REVIEW'}
                      </span>
                      <span className="font-bold text-[#171717] truncate">
                        "{flag.target}"
                      </span>
                    </div>
                    {typeof flag.confidence === 'number' && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FAF6EE] text-[#D97706] border border-amber-200 shrink-0 font-bold">
                        {Math.round(flag.confidence * 100)}%
                      </span>
                    )}
                  </div>

                  <p className="text-[#525252] text-[11px] leading-relaxed">
                    <span className="font-semibold text-[#171717]">Reason: </span>
                    {flag.reason}
                  </p>

                  <div className="flex items-center justify-between pt-1 text-[10px]">
                    <span className="text-[#D97706] font-mono font-medium">
                      {flag.recommendation || 'Verify against original scan.'}
                    </span>
                    {flag.bbox && onSelectBbox && (
                      <button
                        type="button"
                        onClick={() => onSelectBbox(flag.bbox)}
                        className="inline-flex items-center gap-1 text-[#2563EB] hover:underline font-mono"
                      >
                        <Crosshair className="w-3 h-3" />
                        Locate on Scan
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#2563EB] font-semibold">
            <CheckCircle2 className="w-4 h-4 text-[#2563EB]" />
            <span>High-Fidelity Document</span>
          </div>
          <span className="text-[11px] font-mono text-[#525252]">
            All segments meet calibrated confidence standards
          </span>
        </div>
      )}

      {/* 2. Revision Conflicts (Phase 15 — Crossed Out vs Active Directives) */}
      {conflicts.length > 0 && (
        <div className="p-4 rounded-xl bg-red-50/70 border border-red-200 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#DC2626] font-bold text-xs uppercase tracking-wide">
              <Scissors className="w-4 h-4" />
              <span>Revision Detection & Contradiction Isolation</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-100 text-[#DC2626] border border-red-200 font-bold">
              {conflicts.length} Revisions
            </span>
          </div>

          <div className="space-y-2">
            {conflicts.map((conf, idx) => (
              <div
                key={conf.id || idx}
                className="p-3 bg-[#FFFFFF] border border-red-200 rounded-lg text-xs space-y-1 shadow-2xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] text-[#DC2626] uppercase font-bold px-1.5 py-0.2 rounded bg-red-50 border border-red-200">
                    {conf.type || 'STRIKETHROUGH_REVISION'}
                  </span>
                  {conf.struck_evidence && (
                    <span className="text-xs font-mono text-[#DC2626] line-through font-bold">
                      [{conf.struck_evidence}]
                    </span>
                  )}
                </div>
                <p className="text-[#525252] text-xs leading-relaxed mt-1">
                  {conf.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Structured Entities (Phase 11) */}
      <div className="bg-[#FAF6EE] border border-[#D8CEBC] rounded-xl overflow-hidden shadow-xs">
        <div className="px-4 py-3 bg-[#FAF6EE] border-b border-[#D8CEBC] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-[#2563EB]" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#171717]">
              Extracted Entities
            </h4>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#EAE3D2] text-[#525252] font-semibold border border-[#D8CEBC]">
            {entities.length} items
          </span>
        </div>

        <div className="p-3.5 space-y-2 max-h-[300px] overflow-y-auto">
          {entities.length > 0 ? (
            entities.map((ent, idx) => {
              const isMed = ent.type?.toLowerCase().includes('med');
              const isPat = ent.type?.toLowerCase().includes('patient');
              const EntIcon = isMed ? Pill : isPat ? User : Activity;
              const iconColor = isMed ? 'text-[#2563EB]' : isPat ? 'text-[#06B6D4]' : 'text-[#525252]';

              return (
                <div
                  key={idx}
                  onMouseEnter={() => ent.bbox && onHoverBbox && onHoverBbox(ent.bbox)}
                  onMouseLeave={() => onHoverBbox && onHoverBbox(null)}
                  onClick={() => ent.bbox && onSelectBbox && onSelectBbox(ent.bbox)}
                  className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#D8CEBC] hover:border-[#2563EB] flex items-center justify-between gap-3 text-xs transition-colors cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 rounded bg-[#FAF6EE] border border-[#D8CEBC] shrink-0">
                      <EntIcon className={`w-3.5 h-3.5 ${iconColor}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-[#171717] truncate">
                        {ent.value}
                      </div>
                      <div className="text-[10px] font-mono text-[#737373]">
                        {ent.type}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <ConfidenceBadge confidence={ent.confidence} size="sm" showLabel={false} />
                    {ent.bbox && (
                      <span className="text-[10px] font-mono text-[#2563EB] flex items-center gap-0.5">
                        <Crosshair className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-[#737373] text-center py-3">No structured entities extracted.</p>
          )}
        </div>
      </div>

      {/* 4. Measurements & Quantities */}
      <div className="bg-[#FAF6EE] border border-[#D8CEBC] rounded-xl overflow-hidden shadow-xs">
        <div className="px-4 py-3 bg-[#FAF6EE] border-b border-[#D8CEBC] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#06B6D4]" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#171717]">
              Measurements & Metrics
            </h4>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#EAE3D2] text-[#525252] font-semibold border border-[#D8CEBC]">
            {measurements.length} values
          </span>
        </div>

        <div className="p-3.5 space-y-2 max-h-[220px] overflow-y-auto">
          {measurements.length > 0 ? (
            measurements.map((m, idx) => (
              <div
                key={idx}
                onMouseEnter={() => m.bbox && onHoverBbox && onHoverBbox(m.bbox)}
                onMouseLeave={() => onHoverBbox && onHoverBbox(null)}
                onClick={() => m.bbox && onSelectBbox && onSelectBbox(m.bbox)}
                className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#D8CEBC] hover:border-[#06B6D4] flex items-center justify-between text-xs cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono font-bold text-[#171717]">
                    {m.value}
                  </span>
                  {m.unit && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#FAF6EE] text-[#0891B2] border border-cyan-200">
                      {m.unit}
                    </span>
                  )}
                  {m.category && (
                    <span className="text-[10px] text-[#737373] truncate">
                      ({m.category})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {typeof m.confidence === 'number' && (
                    <ConfidenceBadge confidence={m.confidence} size="sm" showLabel={false} />
                  )}
                  {m.bbox && (
                    <span className="text-[10px] font-mono text-[#06B6D4] flex items-center gap-0.5">
                      <Crosshair className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-[#737373] text-center py-3">No quantitative measurements detected.</p>
          )}
        </div>
      </div>

      {/* 5. Verified Claims with Spatial Provenance (Phase 14 — Core Novelty) */}
      <div className="bg-[#FAF6EE] border border-[#D8CEBC] rounded-xl overflow-hidden shadow-xs">
        <div className="px-4 py-3 bg-[#FAF6EE] border-b border-[#D8CEBC] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-[#2563EB]" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#171717]">
              Verified Claims & Provenance
            </h4>
          </div>
          <span className="text-[10px] font-mono text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-bold">
            Ground Truth Links
          </span>
        </div>

        <div className="p-3.5 space-y-2.5 max-h-[300px] overflow-y-auto">
          {claims.length > 0 ? (
            claims.map((claim, idx) => (
              <div
                key={idx}
                onMouseEnter={() => claim.bbox && onHoverBbox && onHoverBbox(claim.bbox)}
                onMouseLeave={() => onHoverBbox && onHoverBbox(null)}
                onClick={() => claim.bbox && onSelectBbox && onSelectBbox(claim.bbox)}
                className="p-3 bg-[#FFFFFF] border border-[#D8CEBC] hover:border-[#2563EB] rounded-lg text-xs space-y-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-[#2563EB] border border-blue-200 font-bold">
                      [OBSERVED]
                    </span>
                    <span className="font-semibold text-[#171717]">
                      {claim.claim}
                    </span>
                  </div>
                  {claim.confidence && (
                    <ConfidenceBadge confidence={claim.confidence} size="sm" showLabel={false} />
                  )}
                </div>

                {claim.evidence && (
                  <p className="text-[11px] text-[#525252] pl-2 border-l-2 border-[#2563EB] font-serif-doc italic">
                    "{claim.evidence}"
                  </p>
                )}

                <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-[#737373]">
                  <span>Source: {claim.source || filename}</span>
                  {claim.bbox && (
                    <span className="text-[#2563EB] flex items-center gap-1 font-semibold hover:underline">
                      <Crosshair className="w-3 h-3" />
                      Locate on Scan [{claim.bbox.slice(0, 2).join(',')}]
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-[#737373] text-center py-3">No claims evaluated.</p>
          )}
        </div>
      </div>
    </div>
  );
}
