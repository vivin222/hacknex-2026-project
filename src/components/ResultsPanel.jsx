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
  Info
} from 'lucide-react';
import ImagePreview from './ImagePreview';
import ConfidenceBadge from './ConfidenceBadge';
import UncertaintyPanel from './UncertaintyPanel';
import MarginNotes from './MarginNotes';
import CrossedOutPanel from './CrossedOutPanel';
import IntelligencePanel from './IntelligencePanel';

/**
 * ResultsPanel Component
 * Main Side-by-Side Verification & Transcription Workspace:
 * LEFT: Original unaltered handwriting scan with inspection controls
 * RIGHT: Real editable clean document editor with uncertainty highlighting,
 *        copy, reset, and export capabilities.
 * BOTTOM: Core Auditing Panels (Uncertainty, Margin Notes, Crossed-Out Content)
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
  const [activeTab, setActiveTab] = useState('uncertainty'); // 'uncertainty' | 'marginalia' | 'raw'

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

  // Export structured analysis as JSON
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
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-lg backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onResetAll}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700/80 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Upload New Scan
          </button>
          <div className="h-4 w-px bg-slate-800 hidden sm:block" />
          <div className="text-xs text-slate-400 font-mono truncate max-w-xs sm:max-w-md">
            File: <span className="text-slate-200 font-medium">{originalFilename}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-400 font-mono hidden md:inline">
            Overall Confidence:
          </div>
          <ConfidenceBadge confidence={resultData.overallConfidence} size="md" />
        </div>
      </div>

      {/* MAIN SIDE-BY-SIDE INSPECTION LAYOUT (Phase 5 & Phase 9) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* LEFT COLUMN: ORIGINAL IMAGE */}
        <div className="flex flex-col h-full min-h-[480px]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold tracking-wide uppercase text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              Original Handwriting Source
            </h3>
            <span className="text-[11px] font-mono text-slate-500">
              Unaltered Reference Image
            </span>
          </div>

          <div className="flex-1">
            <ImagePreview
              imageUrl={originalImageUrl}
              title="Input Manuscript"
              caption={`Resolution: ${resultData.processingInfo?.resolutionDpi || 300} DPI • Contrast: ${resultData.processingInfo?.contrastRatio || 'N/A'}`}
              segments={resultData.segments || []}
              selectedBbox={selectedBbox}
              hoveredBbox={hoveredBbox}
              onSelectSegment={(seg) => setSelectedBbox(seg?.bbox || null)}
              onHoverSegment={(seg) => setHoveredBbox(seg?.bbox || null)}
            />
          </div>

          {/* Preprocessing info card */}
          {resultData.processingInfo && (
            <div className="mt-3 p-3 bg-slate-900/70 border border-slate-800/80 rounded-xl text-xs space-y-2">
              <div className="flex items-center justify-between font-mono text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Sliders className="w-3 h-3 text-indigo-400" />
                  Engine Preprocessing:
                </span>
                <span className="text-slate-500">
                  {resultData.processingInfo.processingTimeMs}ms latency
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {resultData.processingInfo.preProcessingApplied?.map((filter, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/90 text-slate-300 border border-slate-700/60"
                  >
                    {filter}
                  </span>
                ))}
              </div>
              {resultData.processingInfo.multiPassInfo && (
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-emerald-400">
                    Multi-Pass HTR ({resultData.processingInfo.multiPassInfo.passes_evaluated || 3} variants)
                  </span>
                  <span className="text-slate-300">
                    Selected: <span className="text-indigo-300 font-semibold">{resultData.processingInfo.multiPassInfo.selected_pass}</span>
                    {resultData.processingInfo.multiPassInfo.confidence_gain > 0 && (
                      <span className="text-emerald-400 ml-1">
                        (+{(resultData.processingInfo.multiPassInfo.confidence_gain * 100).toFixed(1)}% conf)
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: EDITABLE TRANSCRIPTION */}
        <div className="flex flex-col h-full min-h-[480px]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold tracking-wide uppercase text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Clean Editable Transcription
            </h3>
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
              <span>{wordCount} words</span>
              <span>•</span>
              <span>{charCount} chars</span>
              {isEdited && (
                <span className="text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40">
                  Modified
                </span>
              )}
            </div>
          </div>

          {/* Document Editor Card */}
          <div className="flex-1 flex flex-col bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl document-paper">
            {/* Document Editor Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-900 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-medium text-slate-200">
                  Document Output
                </span>
                <button
                  type="button"
                  onClick={() => setShowRawOcr(!showRawOcr)}
                  className={`text-[11px] font-mono px-2 py-0.5 rounded transition-colors ${
                    showRawOcr
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
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
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  title="Revert edits back to initial transcription"
                  aria-label="Revert edits"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span className="hidden sm:inline">Reset</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition-colors"
                  title="Copy transcription to clipboard"
                  aria-label="Copy text"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
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
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition-colors"
                  title="Export complete analysis payload as .json file"
                  aria-label="Export JSON"
                >
                  <FileDown className="w-3 h-3 text-indigo-400" />
                  <span>JSON</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportText}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow transition-colors"
                  title="Export digitized text as .txt file"
                  aria-label="Export text"
                >
                  <Download className="w-3 h-3" />
                  <span>Export TXT</span>
                </button>
              </div>
            </div>

            {/* Raw OCR Comparison Drawer (if toggled) */}
            {showRawOcr && (
              <div className="p-3 bg-slate-950/90 border-b border-slate-800 text-xs">
                <div className="flex items-center justify-between text-slate-400 font-mono text-[11px] mb-1">
                  <span className="text-amber-400 flex items-center gap-1">
                    <Code2 className="w-3 h-3" />
                    Raw Unfiltered OCR Stream (Before Post-Processing):
                  </span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded font-mono text-slate-400 text-xs leading-relaxed border border-slate-800/80">
                  {resultData.rawOcrText || 'No raw OCR stream provided.'}
                </div>
              </div>
            )}

            {/* Interactive Uncertain Segment Pill Strip */}
            {resultData.uncertainRegions && resultData.uncertainRegions.length > 0 && (
              <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800/70 text-xs flex items-center gap-2 overflow-x-auto">
                <span className="text-[11px] font-mono text-slate-400 shrink-0">
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
                            ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow'
                            : inText
                            ? 'bg-amber-950/40 text-amber-300 border-amber-500/30 hover:border-amber-400'
                            : 'bg-slate-800 text-slate-400 border-slate-700 line-through opacity-70'
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

            {/* Editable Text Area (Real Document Editor feel) */}
            <div className="relative flex-1 p-4 bg-slate-950/50 flex flex-col">
              <label htmlFor="transcription-editor" className="sr-only">
                Editable Transcription Text
              </label>
              <textarea
                id="transcription-editor"
                value={editableText}
                onChange={(e) => setEditableText(e.target.value)}
                placeholder="Transcribed text will appear here..."
                rows={12}
                className="w-full flex-1 p-4 bg-transparent text-slate-100 font-sans text-sm md:text-base leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-indigo-500/50 rounded-lg placeholder-slate-600 border border-transparent hover:border-slate-800 focus:border-indigo-500/60 transition-colors"
                spellCheck="true"
              />

              <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <span>Directly editable • Click tokens above or cards below to inspect</span>
                <span>UTF-8 Document Buffer</span>
              </div>
            </div>
          </div>
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

      {/* CORE AUDITING PANELS SECTION (Phase 6, 7, 8) */}
      <div className="pt-4 border-t border-slate-800/80">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Auditing & Disambiguation Breakdown
            </h3>
            <p className="text-xs text-slate-400">
              Transparent isolation of uncertainty, peripheral margin notes, and crossed-out deletions.
            </p>
          </div>

          {/* Quick tab switcher on smaller screens */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('uncertainty')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeTab === 'uncertainty'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Uncertainty ({resultData.uncertainRegions?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('marginalia')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeTab === 'marginalia'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Annotations ({((resultData.marginNotes?.length || 0) + (resultData.crossedOutText?.length || 0))})
            </button>
          </div>
        </div>

        {/* Tab / Grid Display */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Phase 6: Uncertainty Panel (Takes 2 cols on wide screens if active or 1 col each) */}
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

          {/* Phase 7 & 8: Margin Notes and Crossed-Out Text */}
          <div className={`${activeTab === 'marginalia' ? 'block' : 'hidden lg:block'} space-y-6`}>
            <MarginNotes
              notes={resultData.marginNotes}
              onAppendToEditor={handleAppendText}
            />

            <CrossedOutPanel
              crossedOutItems={resultData.crossedOutText}
              onRestoreToEditor={handleRestoreCrossedOut}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
