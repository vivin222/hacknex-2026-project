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
  Crosshair
} from 'lucide-react';
import ImagePreview from './ImagePreview';
import ConfidenceBadge from './ConfidenceBadge';
import UncertaintyPanel from './UncertaintyPanel';
import MarginNotes from './MarginNotes';
import CrossedOutPanel from './CrossedOutPanel';
import IntelligencePanel from './IntelligencePanel';
import IntelligenceDashboard from './IntelligenceDashboard';
import AiChatPanel from './AiChatPanel';

/**
 * ResultsPanel Component — Paper Intelligence Research Desk
 * Left: Original handwriting source with interactive bounding box viewer
 * Right: Instant AI Assistant OR Clean Document Editor & Transcript
 * Bottom: Real Intelligence Telemetry & Auditing Drawers (Uncertainty, Revisions, Provenance)
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
  const [selectedRegionId, setSelectedRegionId] = useState(null);
  const [selectedBbox, setSelectedBbox] = useState(null);
  const [hoveredBbox, setHoveredBbox] = useState(null);
  const [showRawOcr, setShowRawOcr] = useState(false);
  const [activeTab, setActiveTab] = useState('uncertainty'); // 'uncertainty' | 'marginalia'
  const [rightViewMode, setRightViewMode] = useState('assistant'); // 'assistant' | 'editor'

  const wordCount = editableText.trim() ? editableText.trim().split(/\s+/).length : 0;
  const charCount = editableText.length;
  const isEdited = editableText !== resultData.text;

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

  // Export as text file (Phase 19)
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

  // Export structured analysis as JSON with complete provenance (Phase 19)
  const handleExportJson = () => {
    const exportPayload = {
      filename: originalFilename,
      digitizedText: editableText,
      overallConfidence: resultData.overallConfidence,
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
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `digitized_${originalFilename.replace(/\.[^/.]+$/, '')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Apply alternative suggestion from uncertainty panel
  const handleApplyAlternative = (region, alt) => {
    if (editableText.includes(region.text)) {
      setEditableText((prev) => prev.replace(region.text, alt));
    }
  };

  // Append margin note or crossed out text to editor
  const handleAppendText = (snippet) => {
    setEditableText((prev) => `${prev.trim()}\n\n[Margin Note]: ${snippet}`);
  };

  const handleRestoreCrossedOut = (snippet) => {
    setEditableText((prev) => `${prev.trim()}\n\n[Restored]: ${snippet}`);
  };

  return (
    <div className="w-full space-y-6">
      {/* Top action bar — Archival Research Desk Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FAF6EE] border border-[#D8CEBC] p-4 rounded-xl shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onResetAll}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FFFFFF] hover:bg-[#EAE3D2] text-[#171717] text-xs font-semibold border border-[#D8CEBC] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Upload New Scan
          </button>
          <div className="h-4 w-px bg-[#D8CEBC] hidden sm:block" />
          <div className="text-xs text-[#525252] font-mono truncate max-w-xs sm:max-w-md">
            Document: <span className="text-[#171717] font-semibold">{originalFilename}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-[#525252] font-mono hidden md:inline">
            Document Score:
          </div>
          <ConfidenceBadge confidence={resultData.overallConfidence} size="md" />
        </div>
      </div>

      {/* REAL INTELLIGENCE TELEMETRY BAR (Phase 16) */}
      <IntelligenceDashboard resultData={resultData} />

      {/* MAIN SIDE-BY-SIDE RESEARCH DESK (Phase 8, 12, 14) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* LEFT COLUMN: ORIGINAL HANDWRITING SOURCE */}
        <div className="flex flex-col h-full min-h-[500px]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold tracking-wider uppercase text-[#171717] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
              Original Handwriting Source
            </h3>
            <span className="text-[11px] font-mono text-[#737373]">
              Physical Scan Reference
            </span>
          </div>

          <div className="flex-1">
            <ImagePreview
              imageUrl={originalImageUrl}
              title="Manuscript Scan"
              caption={`Resolution: ${resultData.processingInfo?.resolutionDpi || 300} DPI • Passes: ${resultData.processingInfo?.multiPassInfo?.passes_evaluated || 3}`}
              segments={resultData.segments || []}
              selectedBbox={selectedBbox}
              hoveredBbox={hoveredBbox}
              onSelectSegment={(seg) => setSelectedBbox(seg?.bbox || null)}
            />
          </div>

          {/* Preprocessing info card */}
          {resultData.processingInfo && (
            <div className="mt-3 p-3 bg-[#FAF6EE] border border-[#D8CEBC] rounded-lg text-xs space-y-2">
              <div className="flex items-center justify-between font-mono text-[11px] text-[#525252]">
                <span className="flex items-center gap-1.5 text-[#171717] font-bold">
                  <Sliders className="w-3.5 h-3.5 text-[#2563EB]" />
                  Multi-Pass Pipeline Telemetry:
                </span>
                <span className="text-[#737373]">
                  {resultData.processingInfo.processingTimeMs}ms latency
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {resultData.processingInfo.preProcessingApplied?.map((filter, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FFFFFF] text-[#525252] border border-[#D8CEBC]"
                  >
                    {filter}
                  </span>
                ))}
              </div>
              {resultData.processingInfo.multiPassInfo && (
                <div className="pt-2 border-t border-[#D8CEBC] flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[#2563EB] font-bold">
                    Multi-Pass HTR ({resultData.processingInfo.multiPassInfo.passes_evaluated || 3} passes)
                  </span>
                  <span className="text-[#171717]">
                    Selected Pass: <span className="font-bold text-[#2563EB]">{resultData.processingInfo.multiPassInfo.selected_pass}</span>
                    {resultData.processingInfo.multiPassInfo.confidence_gain > 0 && (
                      <span className="text-[#059669] font-bold ml-1">
                        (+{(resultData.processingInfo.multiPassInfo.confidence_gain * 100).toFixed(1)}% gain)
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: AI ASSISTANT OR CLEAN DOCUMENT EDITOR */}
        <div className="flex flex-col h-full min-h-[500px]">
          {/* View Mode Toggle Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1 p-1 bg-[#FAF6EE] border border-[#D8CEBC] rounded-lg">
              <button
                type="button"
                onClick={() => setRightViewMode('assistant')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-all ${
                  rightViewMode === 'assistant'
                    ? 'bg-[#0891B2] text-white shadow-xs'
                    : 'text-[#525252] hover:text-[#171717]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Instant AI Assistant</span>
              </button>

              <button
                type="button"
                onClick={() => setRightViewMode('editor')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-all ${
                  rightViewMode === 'editor'
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'text-[#525252] hover:text-[#171717]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Document Editor</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono text-[#525252]">
              {rightViewMode === 'editor' ? (
                <>
                  <span>{wordCount} words</span>
                  <span>•</span>
                  <span>{charCount} chars</span>
                  {isEdited && (
                    <span className="text-[#D97706] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-300 font-bold">
                      Modified
                    </span>
                  )}
                </>
              ) : (
                <span className="text-[#0891B2] flex items-center gap-1 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] animate-pulse" />
                  Grounded Intelligence Active
                </span>
              )}
            </div>
          </div>

          {rightViewMode === 'assistant' ? (
            /* Mode 1: Instant AI Assistant Q&A Panel (Phase 12) */
            <div className="flex-1 flex flex-col min-h-[460px]">
              <AiChatPanel
                resultData={resultData}
                onSelectBbox={(bbox) => setSelectedBbox(bbox)}
              />
            </div>
          ) : (
            /* Mode 2: Clean Document Editor & Transcript */
            <div className="flex-1 flex flex-col bg-[#FAF6EE] border border-[#D8CEBC] rounded-xl overflow-hidden shadow-xs">
              {/* Document Editor Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-[#FAF6EE] border-b border-[#D8CEBC]">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#2563EB]" />
                  <span className="text-xs font-bold text-[#171717]">
                    Digitized Transcription
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowRawOcr(!showRawOcr)}
                    className={`text-[11px] font-mono px-2 py-0.5 rounded transition-colors ${
                      showRawOcr
                        ? 'bg-blue-100 text-[#2563EB] border border-blue-300 font-bold'
                        : 'text-[#737373] hover:text-[#171717] bg-[#FFFFFF] border border-[#D8CEBC]'
                    }`}
                    title="Toggle raw uncorrected OCR output"
                  >
                    {showRawOcr ? 'Hide Raw OCR' : 'View Raw OCR'}
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleResetText}
                    disabled={!isEdited}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs text-[#737373] hover:text-[#171717] hover:bg-[#EAE3D2] disabled:opacity-30 transition-colors"
                    title="Revert edits back to initial transcription"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span className="hidden sm:inline">Reset</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs bg-[#FFFFFF] hover:bg-[#EAE3D2] text-[#171717] border border-[#D8CEBC] transition-colors"
                    title="Copy transcription to clipboard"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-[#059669]" />
                        <span className="text-[#059669] font-bold">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleExportJson}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs bg-[#FFFFFF] hover:bg-[#EAE3D2] text-[#171717] border border-[#D8CEBC] font-semibold transition-colors"
                    title="Export complete analysis payload as .json file with provenance"
                  >
                    <FileDown className="w-3 h-3 text-[#2563EB]" />
                    <span>JSON</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportText}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs bg-[#2563EB] hover:bg-blue-700 text-white font-semibold shadow-xs transition-colors"
                    title="Export digitized text as .txt file"
                  >
                    <Download className="w-3 h-3" />
                    <span>TXT</span>
                  </button>
                </div>
              </div>

              {/* Raw OCR Comparison Drawer (if toggled) */}
              {showRawOcr && (
                <div className="p-3 bg-[#FFFFFF] border-b border-[#D8CEBC] text-xs">
                  <div className="flex items-center justify-between text-[#525252] font-mono text-[11px] mb-1">
                    <span className="text-[#D97706] font-bold flex items-center gap-1">
                      <Code2 className="w-3 h-3" />
                      Raw Verbatim OCR Stream (Before Post-Processing):
                    </span>
                  </div>
                  <div className="p-2.5 bg-[#FAF6EE] rounded font-mono text-[#171717] text-xs leading-relaxed border border-[#D8CEBC]">
                    {resultData.rawOcrText || 'No raw OCR stream provided.'}
                  </div>
                </div>
              )}

              {/* Interactive Flagged Tokens Pill Strip */}
              {resultData.uncertainRegions && resultData.uncertainRegions.length > 0 && (
                <div className="px-4 py-2 bg-[#FAF6EE] border-b border-[#D8CEBC] text-xs flex items-center gap-2 overflow-x-auto">
                  <span className="text-[11px] font-mono text-[#525252] shrink-0 font-bold">
                    Flagged Tokens:
                  </span>
                  <div className="flex items-center gap-1.5">
                    {resultData.uncertainRegions.map((region) => {
                      const isSelected = selectedRegionId === region.id;
                      const inText = editableText.includes(region.text);

                      return (
                        <button
                          key={region.id}
                          type="button"
                          onClick={() => {
                            const nextSelect = isSelected ? null : region.id;
                            setSelectedRegionId(nextSelect);
                            setSelectedBbox(nextSelect ? region.bbox : null);
                          }}
                          className={`text-[11px] font-mono px-2 py-0.5 rounded-full border transition-all whitespace-nowrap flex items-center gap-1 ${
                            isSelected
                              ? 'bg-[#D97706] text-white font-bold border-[#D97706] shadow-xs'
                              : inText
                              ? 'bg-amber-50 text-[#D97706] border-amber-300 hover:border-amber-400'
                              : 'bg-[#EAE3D2] text-[#737373] border-[#D8CEBC] line-through opacity-70'
                          }`}
                          title={`Click to focus on image: "${region.text}" (${Math.round(region.confidence * 100)}% - ${region.reason})`}
                        >
                          <span>{region.text}</span>
                          <span className="text-[9px] opacity-75">
                            {Math.round(region.confidence * 100)}%
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Editable Text Area (Paper Sheet feel) */}
              <div className="relative flex-1 p-4 bg-[#FFFFFF] flex flex-col">
                <label htmlFor="transcription-editor" className="sr-only">
                  Editable Transcription Text
                </label>
                <textarea
                  id="transcription-editor"
                  value={editableText}
                  onChange={(e) => setEditableText(e.target.value)}
                  placeholder="Transcribed text will appear here..."
                  rows={14}
                  className="w-full flex-1 p-4 bg-[#FAF6EE] text-[#171717] font-serif-doc text-base sm:text-lg leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-[#2563EB] rounded-lg placeholder-[#A39986] border border-[#D8CEBC] transition-colors"
                  spellCheck="true"
                />

                <div className="mt-2 pt-2 border-t border-[#D8CEBC] flex items-center justify-between text-[11px] text-[#737373] font-mono">
                  <span>Directly editable • Click tokens above or cards below to inspect</span>
                  <span>Verified Archival Buffer</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SEMANTIC INTELLIGENCE, ENTITIES, PROVENANCE & CONFLICT DETECTION */}
      <IntelligencePanel
        entities={resultData.entities}
        claims={resultData.claims}
        measurements={resultData.measurements}
        timeline={resultData.timeline}
        conflicts={resultData.conflicts}
        flags={resultData.flags}
        reviewSummary={resultData.reviewSummary}
        filename={originalFilename}
        onHoverBbox={(bbox) => setHoveredBbox(bbox)}
        onSelectBbox={(bbox) => setSelectedBbox(bbox)}
      />

      {/* AUDITING & DISAMBIGUATION BREAKDOWN SECTION */}
      <div className="pt-4 border-t border-[#D8CEBC]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#171717] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#2563EB]" />
              Auditing & Disambiguation Breakdown
            </h3>
            <p className="text-xs text-[#525252]">
              Transparent isolation of uncertainty, peripheral notes, and pen strikethroughs.
            </p>
          </div>

          {/* Quick tab switcher */}
          <div className="flex items-center gap-1 bg-[#FAF6EE] p-1 rounded-lg border border-[#D8CEBC] text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('uncertainty')}
              className={`px-3 py-1 rounded font-bold transition-colors ${
                activeTab === 'uncertainty'
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'text-[#525252] hover:text-[#171717]'
              }`}
            >
              Uncertainty ({resultData.uncertainRegions?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('marginalia')}
              className={`px-3 py-1 rounded font-bold transition-colors ${
                activeTab === 'marginalia'
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'text-[#525252] hover:text-[#171717]'
              }`}
            >
              Annotations & Revisions ({((resultData.marginNotes?.length || 0) + (resultData.crossedOutText?.length || 0))})
            </button>
          </div>
        </div>

        {/* Tab / Grid Display */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Uncertainty Panel */}
          <div className={`${activeTab === 'uncertainty' ? 'block' : 'hidden lg:block'} lg:col-span-2 space-y-4`}>
            <UncertaintyPanel
              uncertainRegions={resultData.uncertainRegions}
              activeRegionId={selectedRegionId}
              onSelectRegion={(reg) => {
                setSelectedRegionId(reg.id);
                if (reg.bbox) setSelectedBbox(reg.bbox);
              }}
              onApplyAlternative={handleApplyAlternative}
            />
          </div>

          {/* Margin Notes and Crossed-Out Text */}
          <div className={`${activeTab === 'marginalia' ? 'block' : 'hidden lg:block'} space-y-6`}>
            <MarginNotes
              notes={resultData.marginNotes}
              onAppendToEditor={handleAppendText}
              onSelectBbox={(bbox) => setSelectedBbox(bbox)}
            />

            <CrossedOutPanel
              crossedOutItems={resultData.crossedOutText}
              onRestoreToEditor={handleRestoreCrossedOut}
              onSelectBbox={(bbox) => setSelectedBbox(bbox)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
