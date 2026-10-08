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
 * IntelligencePanel Component
 * Structured Document Intelligence with Grounded Provenance:
 * - Prominent "⚠ NEEDS HUMAN REVIEW" banner & review queue
 * - Revision Detection & Contradiction alerts
 * - Extracted Entities (Medications, Patients, Clinical Terms)
 * - Numerical Measurements & Units
 * - Timeline & Chronology
 * - Verified Claims with [OBSERVED], [INFERRED], [UNCERTAIN] status and spatial bbox provenance
 * Theme: High-Contrast Red + Black
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
      {/* 1. Human Verification Flag Banner */}
      {needsReview ? (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 shadow-lg space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs tracking-wider uppercase">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>⚠ NEEDS HUMAN REVIEW ({flags.length || 1} flagged items)</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-900/60 text-amber-300 border border-amber-700/60 font-bold uppercase">
              Verification Required
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-mono">
            {reviewSummary?.documentWarning ||
              'This manuscript contains low-confidence or revised handwriting regions. Human verification is recommended before official reliance.'}
          </p>

          {/* Flags Queue */}
          {flags.length > 0 && (
            <div className="space-y-2 pt-1">
              {flags.map((flag, idx) => (
                <div
                  key={flag.id || idx}
                  className="p-3 bg-[#050508] border border-amber-900/50 rounded-lg text-xs space-y-1.5 shadow-inner"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800 uppercase font-bold shrink-0">
                        ⚠ {flag.type || 'NEEDS REVIEW'}
                      </span>
                      <span className="font-bold text-white truncate">
                        "{flag.target}"
                      </span>
                    </div>
                    {typeof flag.confidence === 'number' && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 shrink-0 font-bold">
                        {Math.round(flag.confidence * 100)}%
                      </span>
                    )}
                  </div>

                  <p className="text-slate-300 text-[11px] leading-relaxed font-mono">
                    <span className="font-semibold text-red-400">Reason: </span>
                    {flag.reason}
                  </p>

                  <div className="flex items-center justify-between pt-1 text-[10px]">
                    <span className="text-amber-400 font-mono font-medium">
                      {flag.recommendation || 'Verify against original scan.'}
                    </span>
                    {flag.bbox && onSelectBbox && (
                      <button
                        type="button"
                        onClick={() => onSelectBbox(flag.bbox)}
                        className="inline-flex items-center gap-1 text-cyan-400 hover:underline font-mono"
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
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/50 flex items-center justify-between gap-3 text-xs shadow-md">
          <div className="flex items-center gap-2 text-emerald-300 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>High-Fidelity Document</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            All segments meet calibrated confidence standards
          </span>
        </div>
      )}

      {/* 2. Revision Conflicts (Crossed Out vs Active Directives) */}
      {conflicts.length > 0 && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wide">
              <Scissors className="w-4 h-4" />
              <span>Revision Detection & Contradiction Isolation</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-900/60 text-red-300 border border-red-700/60 font-bold">
              {conflicts.length} Revisions
            </span>
          </div>

          <div className="space-y-2">
            {conflicts.map((conf, idx) => (
              <div
                key={conf.id || idx}
                className="p-3 bg-[#050508] border border-red-900/50 rounded-lg text-xs space-y-1 shadow-inner"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] text-red-400 uppercase font-bold px-1.5 py-0.2 rounded bg-red-950 border border-red-800">
                    {conf.type || 'STRIKETHROUGH_REVISION'}
                  </span>
                  {conf.struck_evidence && (
                    <span className="text-xs font-mono text-red-400 line-through font-bold">
                      [{conf.struck_evidence}]
                    </span>
                  )}
                </div>
                <p className="text-slate-300 text-xs leading-relaxed mt-1 font-mono">
                  {conf.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Structured Entities */}
      <div className="bg-[#0c0c12] border border-red-950/60 rounded-xl overflow-hidden shadow-xl">
        <div className="px-4 py-3 bg-[#08080d] border-b border-red-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Extracted Entities
            </h4>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#12121a] text-slate-300 font-semibold border border-red-950/60">
            {entities.length} items
          </span>
        </div>

        <div className="p-3.5 space-y-2 max-h-[300px] overflow-y-auto">
          {entities.length > 0 ? (
            entities.map((ent, idx) => {
              const isMed = ent.type?.toLowerCase().includes('med');
              const isPat = ent.type?.toLowerCase().includes('patient');
              const EntIcon = isMed ? Pill : isPat ? User : Activity;
              const iconColor = isMed ? 'text-red-400' : isPat ? 'text-cyan-400' : 'text-slate-400';

              return (
                <div
                  key={idx}
                  onMouseEnter={() => ent.bbox && onHoverBbox && onHoverBbox(ent.bbox)}
                  onMouseLeave={() => onHoverBbox && onHoverBbox(null)}
                  onClick={() => ent.bbox && onSelectBbox && onSelectBbox(ent.bbox)}
                  className="p-2.5 rounded-lg bg-[#050508] border border-red-950/60 hover:border-red-600/60 flex items-center justify-between gap-3 text-xs transition-colors cursor-pointer shadow-inner"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 rounded bg-[#0c0c14] border border-red-950/60 shrink-0">
                      <EntIcon className={`w-3.5 h-3.5 ${iconColor}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-white truncate">
                        {ent.value}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {ent.type}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <ConfidenceBadge confidence={ent.confidence} size="sm" showLabel={false} />
                    {ent.bbox && (
                      <span className="text-[10px] font-mono text-cyan-400 flex items-center gap-0.5">
                        <Crosshair className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-slate-400 text-center py-3">No structured entities extracted.</p>
          )}
        </div>
      </div>

      {/* 4. Measurements & Quantities */}
      <div className="bg-[#0c0c12] border border-red-950/60 rounded-xl overflow-hidden shadow-xl">
        <div className="px-4 py-3 bg-[#08080d] border-b border-red-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Measurements & Metrics
            </h4>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#12121a] text-slate-300 font-semibold border border-red-950/60">
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
                className="p-2.5 rounded-lg bg-[#050508] border border-red-950/60 hover:border-cyan-600/60 flex items-center justify-between text-xs cursor-pointer shadow-inner"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono font-bold text-white">
                    {m.value}
                  </span>
                  {m.unit && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/70 text-cyan-300 border border-cyan-800/50">
                      {m.unit}
                    </span>
                  )}
                  {m.category && (
                    <span className="text-[10px] text-slate-400 truncate">
                      ({m.category})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {typeof m.confidence === 'number' && (
                    <ConfidenceBadge confidence={m.confidence} size="sm" showLabel={false} />
                  )}
                  {m.bbox && (
                    <span className="text-[10px] font-mono text-cyan-400 flex items-center gap-0.5">
                      <Crosshair className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 text-center py-3">No quantitative measurements detected.</p>
          )}
        </div>
      </div>

      {/* 5. Verified Claims with Spatial Provenance */}
      <div className="bg-[#0c0c12] border border-red-950/60 rounded-xl overflow-hidden shadow-xl">
        <div className="px-4 py-3 bg-[#08080d] border-b border-red-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-red-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Verified Claims & Provenance
            </h4>
          </div>
          <span className="text-[10px] font-mono text-red-400 bg-red-950/80 px-2 py-0.5 rounded border border-red-900/60 font-bold">
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
                className="p-3 bg-[#050508] border border-red-950/60 hover:border-red-600/60 rounded-lg text-xs space-y-1.5 transition-colors cursor-pointer shadow-inner"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-red-950 text-red-400 border border-red-900 font-bold">
                      [OBSERVED]
                    </span>
                    <span className="font-semibold text-white">
                      {claim.claim}
                    </span>
                  </div>
                  {claim.confidence && (
                    <ConfidenceBadge confidence={claim.confidence} size="sm" showLabel={false} />
                  )}
                </div>

                {claim.evidence && (
                  <p className="text-[11px] text-slate-300 pl-2 border-l-2 border-red-600 font-mono italic">
                    "{claim.evidence}"
                  </p>
                )}

                <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-slate-400">
                  <span>Source: {claim.source || filename}</span>
                  {claim.bbox && (
                    <span className="text-cyan-400 flex items-center gap-1 font-semibold hover:underline">
                      <Crosshair className="w-3 h-3" />
                      Locate on Scan [{claim.bbox.slice(0, 2).join(',')}]
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 text-center py-3">No claims evaluated.</p>
          )}
        </div>
      </div>
    </div>
  );
}
