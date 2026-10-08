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
  Crosshair
} from 'lucide-react';
import ConfidenceBadge from './ConfidenceBadge';
import { getConfidenceBadgeProps } from '../config/thresholds';

/**
 * IntelligencePanel Component (Phase 1 & Phase 4)
 * Displays extracted clinical/document intelligence and the human verification flag queue:
 * - Prominent "Needs Human Review" Audit Queue
 * - Strikethrough & Revision Conflict Detection
 * - Structured Entities with Confidence Badges
 * - Measurements & Dosages
 * - Timeline & Chronology
 * - Verified Claims with Interactive Spatial Provenance
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
      {/* 1. Document-Level Human Verification Flag Banner (Phase 1) */}
      {needsReview ? (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/50 shadow-lg space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs tracking-wider uppercase">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Needs Human Review ({flags.length || 1} flagged items)</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-900/60 text-amber-300 border border-amber-700/60 uppercase">
              Action Required
            </span>
          </div>

          <p className="text-xs text-amber-200/90 leading-relaxed">
            {reviewSummary?.documentWarning ||
              'This manuscript contains low-confidence or revised handwriting regions. Human verification is recommended before clinical or official reliance.'}
          </p>

          {/* Flags Queue */}
          {flags.length > 0 && (
            <div className="space-y-2 pt-1">
              {flags.map((flag, idx) => (
                <div
                  key={flag.id || idx}
                  className="p-3 bg-slate-950/80 border border-amber-800/40 rounded-lg text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800/50 uppercase font-bold shrink-0">
                        ⚠ {flag.type || 'NEEDS REVIEW'}
                      </span>
                      <span className="font-semibold text-slate-100 truncate">
                        "{flag.target}"
                      </span>
                    </div>
                    {typeof flag.confidence === 'number' && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300 shrink-0">
                        Confidence: {Math.round(flag.confidence * 100)}%
                      </span>
                    )}
                  </div>

                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    <span className="text-slate-400 font-medium">Reason: </span>
                    {flag.reason}
                  </p>

                  <div className="flex items-center justify-between pt-1 text-[10px]">
                    <span className="text-amber-400/90 font-mono">
                      {flag.recommendation || 'Verify against original scan.'}
                    </span>
                    {flag.bbox && onSelectBbox && (
                      <button
                        type="button"
                        onClick={() => onSelectBbox(flag.bbox)}
                        className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        <Crosshair className="w-3 h-3" />
                        <span>Locate on Scan</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-medium">All Extracted Entities Meet High Confidence Threshold (✓)</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400/80">No Critical Ambiguities</span>
        </div>
      )}

      {/* 2. Strikethrough & Revision Conflict Detections (Phase 4) */}
      {conflicts && conflicts.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 space-y-3">
          <div className="flex items-center gap-2 text-rose-300 font-semibold text-xs tracking-wider uppercase">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Strikethrough Revisions & Conflicts ({conflicts.length})</span>
          </div>

          <div className="space-y-2">
            {conflicts.map((conf, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-950/80 border border-rose-800/40 rounded-lg text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-rose-200">{conf.type}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 uppercase border border-rose-800/50">
                    {conf.severity || 'Revision'}
                  </span>
                </div>

                <p className="text-slate-300 leading-relaxed text-[11px]">{conf.description}</p>

                {conf.struck_evidence && (
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center gap-2 text-xs flex-wrap">
                    <span className="line-through bg-rose-950 text-rose-300 px-2 py-0.5 rounded border border-rose-800/60 font-mono text-[11px]">
                      {conf.struck_evidence}
                    </span>
                    <span className="text-rose-400 font-mono text-[11px]">↓ crossed out</span>
                    {conf.active_evidence && (
                      <span className="bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800/60 font-semibold font-mono text-[11px]">
                        {conf.active_evidence} (Active)
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Structured Entities & Attributes */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Stethoscope className="w-3.5 h-3.5 text-indigo-400" />
            Extracted Entities ({entities.length})
          </span>
          <span className="text-[10px] font-mono text-slate-500">Structured Semantics</span>
        </div>

        {entities.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {entities.map((ent, idx) => {
              const badgeProps = getConfidenceBadgeProps(ent.confidence, ent.type.toLowerCase());
              return (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 text-xs hover:border-slate-600 transition-colors"
                >
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/40 font-semibold">
                    {ent.type}
                  </span>
                  <span className="font-medium text-slate-200">{ent.value}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${badgeProps.badgeClass}`}
                    title={ent.review_reason || badgeProps.label}
                  >
                    {badgeProps.symbol} {Math.round(ent.confidence * 100)}%
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">No structured entities detected in manuscript.</p>
        )}
      </div>

      {/* 4. Measurements & Timeline Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Measurements */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              Measurements & Dosages ({measurements.length})
            </span>
            <span className="text-[10px] font-mono text-slate-500">Quantitative Evidence</span>
          </div>

          {measurements.length > 0 ? (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {measurements.map((m, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs"
                >
                  <span className="text-slate-400 truncate pr-2">{m.metric}:</span>
                  <span className="font-mono font-semibold text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/30 shrink-0">
                    {m.value}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No quantitative measurements detected.</p>
          )}
        </div>

        {/* Timeline */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              Timeline & Dates ({timeline.length})
            </span>
            <span className="text-[10px] font-mono text-slate-500">Chronological Sequence</span>
          </div>

          {timeline.length > 0 ? (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {timeline.map((t, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs"
                >
                  <span className="text-slate-400 truncate pr-2">{t.event}:</span>
                  <span className="font-mono font-semibold text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/30 shrink-0">
                    {t.timeframe}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No timeline dates or durations detected.</p>
          )}
        </div>
      </div>

      {/* 5. Verified Claims with Provenance & Spatial Tracing */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
            Verified Claims & Spatial Provenance ({claims.length})
          </span>
          <span className="text-[10px] font-mono text-slate-500">Source Line Evidence</span>
        </div>

        {claims.length > 0 ? (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {claims.map((c, idx) => (
              <div
                key={idx}
                onMouseEnter={() => onHoverBbox && onHoverBbox(c.bbox)}
                onMouseLeave={() => onHoverBbox && onHoverBbox(null)}
                onClick={() => onSelectBbox && onSelectBbox(c.bbox)}
                className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs flex items-start justify-between gap-3 hover:border-indigo-500/50 hover:bg-slate-950 cursor-pointer transition-all"
              >
                <div className="space-y-1 min-w-0">
                  <div className="text-slate-200 font-medium leading-relaxed">{c.claim}</div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                    <span className="text-indigo-400">Source: {c.source || filename}</span>
                    {c.bbox && (
                      <span className="text-slate-400 flex items-center gap-1">
                        <Scan className="w-3 h-3 text-indigo-400" />
                        <span>BBox [{c.bbox.slice(0, 2).join(', ')}]</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="shrink-0">
                  <ConfidenceBadge confidence={c.confidence} size="sm" showLabel={false} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">No textual claims detected in document.</p>
        )}
      </div>
    </div>
  );
}
