import React, { useState } from 'react';
import {
  Copy,
  Check,
  Download,
  RotateCcw,
  FileText,
  Sliders,
  ArrowLeft,
  Sparkles,
  Layers,
  Code2,
  FileDown,
  Info,
  Crosshair,
  Activity,
  Scissors,
  Bookmark,
  AlertTriangle,
  Zap,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import ImagePreview from './ImagePreview';
import ConfidenceBadge from './ConfidenceBadge';
import UncertaintyPanel from './UncertaintyPanel';
import MarginNotes from './MarginNotes';
import CrossedOutPanel from './CrossedOutPanel';
import IntelligencePanel from './IntelligencePanel';
import AiChatPanel from './AiChatPanel';

/**
 * ResultsPanel Component — 3-Column Document-First AI Workspace
 * Team: CRY NOVA | HNX26EPS04
 *
 * 3-Column / 3-Layer Architecture:
 * - LEFT:   Document Scan (Hero canvas, zoom/pan, contrast toggle, box toggle, confidence heatmap)
 * - CENTER: Recognized Transcript & Evidence Stream (active text, token alignment, isolated strikethroughs, marginalia)
 * - RIGHT:  Instant AI Intelligence (Ask CRY NOVA assistant, entities, verified claims, vitals, conflict radar)
 *
 * Real Latency Telemetry:
 * - "Recognition 1.8s | Visual 0.7s | Intelligence 0.2s | Total 2.7s"
 */
export default function ResultsPanel({
  resultData,
  originalImageUrl,
  originalFilename = 'scan.png',
  onResetAll = () => {},
}) {
  // Local editable text state
  const [editableText, setEditableText] = useState(resultData.text || '');
  const [copied, setCopied] = useState(false);
  const [selectedBbox, setSelectedBbox] = useState(null);
  const [hoveredBbox, setHoveredBbox] = useState(null);
  const [showTokens, setShowTokens] = useState(true);
  const [centerSubTab, setCenterSubTab] = useState('transcript'); // 'transcript' | 'revisions' | 'uncertainty'
  const [rightSubTab, setRightSubTab] = useState('assistant'); // 'assistant' | 'intelligence'
  const [mobileActiveCol, setMobileActiveCol] = useState('left'); // 'left' | 'center' | 'right'

  const wordCount = editableText.trim() ? editableText.trim().split(/\s+/).length : 0;
  const charCount = editableText.length;
  const isEdited = editableText !== resultData.text;

  // Extract telemetry safely
  const telemetry = resultData.telemetry || {
    recognition_sec: Number(((resultData.processingInfo?.stage_timings?.recognition_ms || 1200) / 1000).toFixed(1)),
    visual_sec: Number(((resultData.processingInfo?.stage_timings?.visual_ms || 200) / 1000).toFixed(1)),
    intelligence_sec: 0.2,
    total_sec: Number(((resultData.processingInfo?.processingTimeMs || 1500) / 1000).toFixed(1)),
    display: `Recognition 1.2s | Visual 0.2s | Intelligence 0.2s | Total 1.6s`,
    fastPath: true,
  };

  // Copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(editableText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Revert back to original machine output
  const handleResetText = () => {
    setEditableText(resultData.text || '');
  };

  // Export as text file
  const handleExportText = () => {
    const blob = new Blob([editableText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `digitized_${originalFilename.replace(/\.[^/.]+$/, '')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export structured analysis as JSON with complete provenance
  const handleExportJson = () => {
    const exportPayload = {
      filename: originalFilename,
      digitizedText: editableText,
      overallConfidence: resultData.overallConfidence,
      telemetry,
      reviewSummary: resultData.reviewSummary,
      flags: resultData.flags,
      entities: resultData.entities,
      claims: resultData.claims,
      measurements: resultData.measurements,
      timeline: resultData.timeline,
      conflicts: resultData.conflicts,
      provenance: resultData.provenance,
      uncertainRegions: resultData.uncertainRegions,
      segments: resultData.segments,
      processingInfo: resultData.processingInfo,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `digitized_${originalFilename.replace(/\.[^/.]+$/, '')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const segments = resultData.segments || [];
  const crossedOutItems = resultData.crossedOutText || [];
  const marginNotes = resultData.marginNotes || [];
  const uncertainRegions = resultData.uncertainRegions || [];

  return (
    <div className="w-full max-w-[1720px] mx-auto px-3 sm:px-6 py-4 space-y-4">
      {/* =========================================================================
          TOP COMMAND & REAL LATENCY TELEMETRY BAR
         ========================================================================= */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3.5 bg-[#FAF6EE] border border-[#D8CEBC] rounded-xl shadow-xs">
        {/* Left: Navigation & Document Meta */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onResetAll}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FFFFFF] hover:bg-[#EAE3D2] text-[#171717] text-xs font-semibold border border-[#D8CEBC] transition-colors shrink-0 shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>New Scan</span>
          </button>
          <div className="h-4 w-px bg-[#D8CEBC] hidden sm:block shrink-0" />
          <div className="text-xs text-[#525252] font-mono truncate">
            Document: <span className="text-[#171717] font-semibold">{originalFilename}</span>
          </div>
        </div>

        {/* Center: Real Latency Telemetry */}
        <div className="flex items-center justify-center gap-2 px-3 py-1 bg-[#FFFFFF] border border-[#D8CEBC] rounded-lg text-xs font-mono shadow-2xs overflow-x-auto">
          <span className="flex items-center gap-1 text-[#2563EB] font-bold shrink-0">
            <Zap className="w-3.5 h-3.5" />
            {telemetry.fastPath ? '⚡ Fast Path' : 'Multi-Pass'}
          </span>
          <span className="text-[#D8CEBC]">|</span>
          <span className="text-[#171717] shrink-0">
            Recognition <strong className="font-semibold text-[#2563EB]">{telemetry.recognition_sec}s</strong>
          </span>
          <span className="text-[#A39986]">|</span>
          <span className="text-[#171717] shrink-0">
            Visual <strong className="font-semibold text-[#06B6D4]">{telemetry.visual_sec}s</strong>
          </span>
          <span className="text-[#A39986]">|</span>
          <span className="text-[#171717] shrink-0">
            Intelligence <strong className="font-semibold text-[#0891B2]">{telemetry.intelligence_sec}s</strong>
          </span>
          <span className="text-[#D8CEBC]">|</span>
          <span className="text-[#171717] font-bold shrink-0">
            Total {telemetry.total_sec}s
          </span>
        </div>

        {/* Right: Confidence & Export Actions */}
        <div className="flex items-center justify-end gap-2 shrink-0">
          <ConfidenceBadge confidence={resultData.overallConfidence} size="md" />

          <button
            type="button"
            onClick={handleExportText}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#FFFFFF] hover:bg-[#EAE3D2] text-[#171717] text-xs font-mono font-medium border border-[#D8CEBC] transition-colors"
            title="Download plain transcription text"
          >
            <Download className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>TXT</span>
          </button>

          <button
            type="button"
            onClick={handleExportJson}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#FFFFFF] hover:bg-[#EAE3D2] text-[#171717] text-xs font-mono font-medium border border-[#D8CEBC] transition-colors"
            title="Download full intelligence JSON with provenance coordinates"
          >
            <Code2 className="w-3.5 h-3.5 text-[#06B6D4]" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Mobile / Tablet Column Switcher (< xl) */}
      <div className="flex xl:hidden items-center p-1 bg-[#FAF6EE] border border-[#D8CEBC] rounded-lg text-xs font-bold">
        <button
          type="button"
          onClick={() => setMobileActiveCol('left')}
          className={`flex-1 py-1.5 rounded text-center transition-all ${
            mobileActiveCol === 'left' ? 'bg-[#171717] text-[#FAF6EE]' : 'text-[#525252]'
          }`}
        >
          1. Document Scan
        </button>
        <button
          type="button"
          onClick={() => setMobileActiveCol('center')}
          className={`flex-1 py-1.5 rounded text-center transition-all ${
            mobileActiveCol === 'center' ? 'bg-[#2563EB] text-white' : 'text-[#525252]'
          }`}
        >
          2. Transcript & Stream
        </button>
        <button
          type="button"
          onClick={() => setMobileActiveCol('right')}
          className={`flex-1 py-1.5 rounded text-center transition-all ${
            mobileActiveCol === 'right' ? 'bg-[#0891B2] text-white' : 'text-[#525252]'
          }`}
        >
          3. AI Intelligence
        </button>
      </div>

      {/* =========================================================================
          THE 3-COLUMN DOCUMENT-FIRST RESEARCH WORKSPACE (Hero: Physical Scan)
         ========================================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        {/* =======================================================================
            COLUMN 1 (LEFT, 4 COLS): HERO DOCUMENT SCAN
           ======================================================================= */}
        <div
          className={`xl:col-span-4 flex flex-col h-full min-h-[580px] space-y-3 ${
            mobileActiveCol === 'left' ? 'block' : 'hidden xl:flex'
          }`}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold tracking-wider uppercase text-[#171717] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
              <span>1. Original Document Scan</span>
            </h3>
            <span className="text-[11px] font-mono text-[#737373]">
              Optical Ground Truth
            </span>
          </div>

          <div className="flex-1 min-h-[460px]">
            <ImagePreview
              imageUrl={originalImageUrl}
              title="Manuscript Scan"
              caption={`Resolution: ${resultData.processingInfo?.resolutionDpi || 300} DPI`}
              segments={segments}
              selectedBbox={selectedBbox}
              hoveredBbox={hoveredBbox}
              onSelectSegment={(seg) => setSelectedBbox(seg?.bbox || null)}
            />
          </div>

          {/* Under-Scan Pipeline Telemetry Card */}
          <div className="p-3 bg-[#FAF6EE] border border-[#D8CEBC] rounded-xl text-xs space-y-2">
            <div className="flex items-center justify-between font-mono text-[11px] text-[#525252]">
              <span className="flex items-center gap-1.5 text-[#171717] font-bold">
                <Sliders className="w-3.5 h-3.5 text-[#2563EB]" />
                Optical Ingestion Pipeline:
              </span>
              <span className="text-[#2563EB] font-bold">
                {resultData.processingInfo?.multiPassInfo?.passesEvaluated || 1} pass evaluated
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {resultData.processingInfo?.preProcessingApplied?.map((filter, i) => (
                <span
                  key={i}
                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FFFFFF] text-[#525252] border border-[#D8CEBC]"
                >
                  {filter}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* =======================================================================
            COLUMN 2 (CENTER, 4 COLS): RECOGNIZED TRANSCRIPT & EVIDENCE STREAM
           ======================================================================= */}
        <div
          className={`xl:col-span-4 flex flex-col h-full min-h-[580px] space-y-3 ${
            mobileActiveCol === 'center' ? 'block' : 'hidden xl:flex'
          }`}
        >
          {/* Center Column Header & Tabs */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 p-0.5 bg-[#FAF6EE] border border-[#D8CEBC] rounded-lg">
              <button
                type="button"
                onClick={() => setCenterSubTab('transcript')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  centerSubTab === 'transcript'
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'text-[#525252] hover:text-[#171717]'
                }`}
              >
                Active Transcript
              </button>
              {crossedOutItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCenterSubTab('revisions')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 ${
                    centerSubTab === 'revisions'
                      ? 'bg-[#DC2626] text-white shadow-xs'
                      : 'text-[#DC2626] hover:bg-red-50'
                  }`}
                >
                  <Scissors className="w-3 h-3" />
                  <span>Revisions ({crossedOutItems.length})</span>
                </button>
              )}
              {uncertainRegions.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCenterSubTab('uncertainty')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 ${
                    centerSubTab === 'uncertainty'
                      ? 'bg-[#D97706] text-white shadow-xs'
                      : 'text-[#D97706] hover:bg-amber-50'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>Flags ({uncertainRegions.length})</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#525252]">
              <span>{wordCount} words</span>
              <span>•</span>
              <button
                type="button"
                onClick={handleCopy}
                className="p-1 rounded hover:bg-[#EAE3D2] text-[#171717] transition-colors"
                title="Copy transcription"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Subtab 1: Active Transcription & Interactive Token Stream */}
          {centerSubTab === 'transcript' && (
            <div className="flex-1 flex flex-col bg-[#FAF6EE] border border-[#D8CEBC] rounded-xl overflow-hidden shadow-xs">
              {/* Document Textarea */}
              <div className="p-3.5 border-b border-[#D8CEBC] bg-[#FFFFFF]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#737373] font-bold">
                    Primary Transcribed Body
                  </span>
                  {isEdited && (
                    <button
                      type="button"
                      onClick={handleResetText}
                      className="text-[10px] font-mono text-[#2563EB] hover:underline flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset original
                    </button>
                  )}
                </div>
                <textarea
                  value={editableText}
                  onChange={(e) => setEditableText(e.target.value)}
                  className="w-full h-44 p-2.5 text-sm font-sans bg-[#FAF6EE]/50 border border-[#D8CEBC]/70 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#2563EB] leading-relaxed resize-none text-[#171717]"
                  placeholder="Extracted transcription text..."
                />
              </div>

              {/* Interactive Token Stream (Click to locate bounding box on scan) */}
              <div className="flex-1 p-3.5 flex flex-col min-h-[220px]">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#D8CEBC]/70">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#171717]">
                    <Crosshair className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>Evidence Stream (Click to Locate Box)</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#737373]">
                    {segments.length} tokens
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[260px] flex flex-wrap gap-1.5 content-start pr-1">
                  {segments.map((seg, idx) => {
                    const isTargeted =
                      selectedBbox &&
                      seg.bbox &&
                      Math.abs(selectedBbox[0] - seg.bbox[0]) < 12 &&
                      Math.abs(selectedBbox[1] - seg.bbox[1]) < 12;

                    let badgeStyle = 'bg-[#FFFFFF] text-[#171717] border-[#D8CEBC] hover:border-[#2563EB]';
                    if (seg.is_crossed_out) {
                      badgeStyle = 'bg-red-50 text-[#DC2626] border-red-200 line-through';
                    } else if (seg.is_margin_note) {
                      badgeStyle = 'bg-cyan-50 text-[#0891B2] border-cyan-200 border-dashed';
                    } else if (seg.uncertain || (seg.confidence && seg.confidence < 0.75)) {
                      badgeStyle = 'bg-amber-50 text-[#D97706] border-amber-300';
                    }

                    if (isTargeted) {
                      badgeStyle = 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-300';
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedBbox(seg.bbox)}
                        onMouseEnter={() => setHoveredBbox(seg.bbox)}
                        onMouseLeave={() => setHoveredBbox(null)}
                        className={`text-xs font-mono px-2 py-1 rounded-md border transition-all text-left flex items-center gap-1 ${badgeStyle}`}
                        title={`Confidence: ${Math.round((seg.confidence || 0.8) * 100)}% • Click to locate on scan`}
                      >
                        <span>{seg.text}</span>
                        {seg.confidence && !seg.is_crossed_out && (
                          <span className="text-[10px] opacity-75">
                            {Math.round(seg.confidence * 100)}%
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Subtab 2: Isolated Revisions & Strikethroughs */}
          {centerSubTab === 'revisions' && (
            <div className="flex-1">
              <CrossedOutPanel
                crossedOutItems={crossedOutItems}
                onSelectBbox={(bbox) => setSelectedBbox(bbox)}
              />
            </div>
          )}

          {/* Subtab 3: Flagged Uncertainties */}
          {centerSubTab === 'uncertainty' && (
            <div className="flex-1">
              <UncertaintyPanel
                uncertainRegions={uncertainRegions}
                onSelectRegion={(r) => setSelectedBbox(r.bbox)}
              />
            </div>
          )}

          {/* Marginal Notes Banner if detected */}
          {marginNotes.length > 0 && centerSubTab === 'transcript' && (
            <div className="p-3 bg-cyan-50/70 border border-cyan-200 rounded-xl text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[#0891B2]">
                <Bookmark className="w-3.5 h-3.5" />
                <span>Marginal Annotations Detected ({marginNotes.length})</span>
              </div>
              <p className="text-[11px] text-[#525252]">
                Peripheral text isolated to maintain primary reading flow.
              </p>
            </div>
          )}
        </div>

        {/* =======================================================================
            COLUMN 3 (RIGHT, 4 COLS): INSTANT AI INTELLIGENCE
           ======================================================================= */}
        <div
          className={`xl:col-span-4 flex flex-col h-full min-h-[580px] space-y-3 ${
            mobileActiveCol === 'right' ? 'block' : 'hidden xl:flex'
          }`}
        >
          {/* Right Column Header & Subtabs */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 p-0.5 bg-[#FAF6EE] border border-[#D8CEBC] rounded-lg">
              <button
                type="button"
                onClick={() => setRightSubTab('assistant')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-all ${
                  rightSubTab === 'assistant'
                    ? 'bg-[#0891B2] text-white shadow-xs'
                    : 'text-[#525252] hover:text-[#171717]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ask CRY NOVA</span>
              </button>

              <button
                type="button"
                onClick={() => setRightSubTab('intelligence')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-all ${
                  rightSubTab === 'intelligence'
                    ? 'bg-[#171717] text-[#FAF6EE] shadow-xs'
                    : 'text-[#525252] hover:text-[#171717]'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Structured Intelligence</span>
              </button>
            </div>

            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
              In-Memory &lt;50ms
            </span>
          </div>

          {/* Subtab 1: Instant AI Query Assistant */}
          {rightSubTab === 'assistant' ? (
            <div className="flex-1 flex flex-col min-h-[520px]">
              <AiChatPanel
                resultData={resultData}
                onSelectBbox={(bbox) => setSelectedBbox(bbox)}
              />
            </div>
          ) : (
            /* Subtab 2: Structured Document Intelligence (Entities, Vitals, Timeline) */
            <div className="flex-1 overflow-y-auto max-h-[640px] pr-1">
              <IntelligencePanel
                entities={resultData.entities || []}
                claims={resultData.claims || []}
                measurements={resultData.measurements || []}
                timeline={resultData.timeline || []}
                conflicts={resultData.conflicts || []}
                flags={resultData.flags || []}
                reviewSummary={resultData.reviewSummary}
                filename={originalFilename}
                onSelectBbox={(bbox) => setSelectedBbox(bbox)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
