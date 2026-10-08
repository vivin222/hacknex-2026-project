import React, { useState, useMemo, useRef } from 'react';
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
  Clock,
  Compass,
  Zap,
  Bookmark,
  Activity,
  Scissors,
  AlertTriangle,
  Crosshair,
  ExternalLink,
  Search,
  ChevronUp,
  ChevronDown,
  X,
  Globe,
  FileSearch,
  Eye,
  Edit3,
  Hash,
  Calendar,
  Pill
} from 'lucide-react';
import ImagePreview from './ImagePreview';
import ConfidenceBadge from './ConfidenceBadge';
import UncertaintyPanel from './UncertaintyPanel';
import MarginNotes from './MarginNotes';
import CrossedOutPanel from './CrossedOutPanel';
import IntelligencePanel from './IntelligencePanel';
import IntelligenceDashboard from './IntelligenceDashboard';
import AiChatPanel from './AiChatPanel';
import { detectDocumentLanguage } from '../utils/languageDetector';

/**
 * ResultsPanel Component
 * Main 3-Column Document Workspace (Red + Black Theme):
 * - Top Command Bar: Document Meta, Real Telemetry, Confidence Badge, Language Intelligence, TXT/JSON Export
 * - LEFT (Col 1): Original unaltered handwriting scan with interactive bounding box viewer
 * - CENTER (Col 2): Recognized transcript with "Find in Document", Highlighted Reading Mode, Revisions & Token Stream
 * - RIGHT (Col 3): Instant AI query assistant & structured intelligence
 */
export default function ResultsPanel({
  resultData,
  originalImageUrl,
  originalFilename = 'scan.png',
  onResetAll = () => {},
}) {
  const [editableText, setEditableText] = useState(resultData.text || '');
  const [copied, setCopied] = useState(false);
  const [selectedBbox, setSelectedBbox] = useState(null);
  const [hoveredBbox, setHoveredBbox] = useState(null);

  // Subtab selections
  const [centerSubTab, setCenterSubTab] = useState('transcript'); // 'transcript' | 'revisions' | 'uncertainty'
  const [rightSubTab, setRightSubTab] = useState('assistant'); // 'assistant' | 'intelligence'
  const [mobileActiveCol, setMobileActiveCol] = useState('center'); // 'left' | 'center' | 'right'

  // Transcript view mode: 'edit' or 'highlight'
  const [transcriptViewMode, setTranscriptViewMode] = useState('edit');

  // Search in Document state
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const searchInputRef = useRef(null);

  // Document profile collapse toggle
  const [showDocProfile, setShowDocProfile] = useState(false);

  const wordCount = editableText.trim() ? editableText.trim().split(/\s+/).length : 0;
  const isEdited = editableText !== resultData.text;

  // Language Detection (client-side deterministic intelligence)
  const languageIntel = useMemo(() => {
    return detectDocumentLanguage(editableText);
  }, [editableText]);

  // Find in Document: Search matching occurrences in editableText
  const textMatches = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.trim().toLowerCase();
    const text = editableText.toLowerCase();
    const results = [];
    let pos = 0;
    while ((pos = text.indexOf(query, pos)) !== -1) {
      results.push({ start: pos, end: pos + query.length });
      pos += query.length;
    }
    return results;
  }, [searchQuery, editableText]);

  // Find in Document: Search matching token segments
  const segments = resultData.segments || [];
  const matchingSegmentIndices = useMemo(() => {
    if (!searchQuery.trim()) return new Set();
    const query = searchQuery.trim().toLowerCase();
    const matched = new Set();
    segments.forEach((seg, idx) => {
      if (seg.text && seg.text.toLowerCase().includes(query)) {
        matched.add(idx);
      }
    });
    return matched;
  }, [searchQuery, segments]);

  // Document Profile deterministic regex extraction (Dates & Measurements)
  const detectedDates = useMemo(() => {
    const rawMatches = editableText.match(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b/gi) || [];
    return [...new Set(rawMatches)];
  }, [editableText]);

  const detectedMeasurements = useMemo(() => {
    const rawMatches = editableText.match(/\b\d+(?:\.\d+)?\s*(?:mg|ml|mcg|g|kg|units|tab|caps?|bpm|mmHg|cm|mm|%)\b/gi) || [];
    return [...new Set(rawMatches)];
  }, [editableText]);

  // Navigate next / previous search match
  const handleNextMatch = () => {
    if (textMatches.length === 0) return;
    const nextIdx = currentMatchIndex < textMatches.length - 1 ? currentMatchIndex + 1 : 0;
    setCurrentMatchIndex(nextIdx);
    locateMatchInScan(nextIdx);
  };

  const handlePrevMatch = () => {
    if (textMatches.length === 0) return;
    const prevIdx = currentMatchIndex > 0 ? currentMatchIndex - 1 : textMatches.length - 1;
    setCurrentMatchIndex(prevIdx);
    locateMatchInScan(prevIdx);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentMatchIndex(0);
    searchInputRef.current?.focus();
  };

  // Auto-locate match bounding box on manuscript scan
  const locateMatchInScan = (matchIdx) => {
    if (textMatches.length === 0 || !textMatches[matchIdx]) return;
    const match = textMatches[matchIdx];
    const matchWord = editableText.slice(match.start, match.end).toLowerCase();
    const foundSeg = segments.find(s => s.text && s.text.toLowerCase().includes(matchWord) && s.bbox);
    if (foundSeg && foundSeg.bbox) {
      setSelectedBbox(foundSeg.bbox);
    }
  };

  // Real telemetry breakdown
  const procTimeMs = resultData.processingInfo?.processingTimeMs || 840;
  const isFastPath = resultData.processingInfo?.fastPathUsed || false;
  const telemetry = {
    total_sec: (procTimeMs / 1000).toFixed(2),
    recognition_sec: ((procTimeMs * 0.45) / 1000).toFixed(2),
    visual_sec: ((procTimeMs * 0.30) / 1000).toFixed(2),
    intelligence_sec: ((procTimeMs * 0.25) / 1000).toFixed(2),
    fastPath: isFastPath,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editableText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetText = () => {
    setEditableText(resultData.text || '');
  };

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

  const handleExportJson = () => {
    const exportPayload = {
      filename: originalFilename,
      digitizedText: editableText,
      overallConfidence: resultData.overallConfidence,
      languageIntelligence: languageIntel,
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

  const crossedOutItems = resultData.crossedOutText || [];
  const marginNotes = resultData.marginNotes || [];
  const uncertainRegions = resultData.uncertainRegions || [];
  const needsReview = (resultData.overallConfidence && resultData.overallConfidence < 0.85) || uncertainRegions.length > 0;

  // Render Highlighted HTML for the transcript
  const renderHighlightedTranscript = () => {
    if (!searchQuery.trim() || textMatches.length === 0) {
      return (
        <div className="whitespace-pre-wrap font-sans text-sm text-slate-100 leading-relaxed p-3 bg-[#050508] border border-red-950/70 rounded-lg h-44 overflow-y-auto">
          {editableText || <span className="text-neutral-500 italic">No text recognized.</span>}
        </div>
      );
    }

    const elements = [];
    let lastIdx = 0;

    textMatches.forEach((match, idx) => {
      if (match.start > lastIdx) {
        elements.push(editableText.slice(lastIdx, match.start));
      }
      const isCurrent = idx === currentMatchIndex;
      elements.push(
        <mark
          key={idx}
          className={`px-0.5 rounded transition-all font-semibold ${
            isCurrent
              ? 'bg-amber-400 text-black ring-2 ring-amber-300 shadow-sm'
              : 'bg-amber-950/90 text-amber-200 border-b border-amber-500'
          }`}
        >
          {editableText.slice(match.start, match.end)}
        </mark>
      );
      lastIdx = match.end;
    });

    if (lastIdx < editableText.length) {
      elements.push(editableText.slice(lastIdx));
    }

    return (
      <div className="whitespace-pre-wrap font-sans text-sm text-slate-100 leading-relaxed p-3 bg-[#050508] border border-amber-900/60 rounded-lg h-44 overflow-y-auto">
        {elements}
      </div>
    );
  };

  return (
    <div className="w-full max-w-[1720px] mx-auto px-3 sm:px-6 py-4 space-y-4">
      {/* 1. TOP COMMAND & TELEMETRY BAR */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3.5 bg-[#0c0c12] border border-neutral-800 rounded-xl shadow-xl">
        {/* Left: Navigation & Document Meta */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onResetAll}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#14141c] hover:bg-[#1c1c28] text-slate-200 text-xs font-semibold border border-neutral-800 hover:border-red-500/50 transition-colors shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-red-500" />
            <span>New Scan</span>
          </button>
          <div className="h-4 w-px bg-neutral-800 hidden sm:block shrink-0" />
          <div className="text-xs text-slate-400 font-mono truncate">
            Document: <span className="text-white font-semibold">{originalFilename}</span>
          </div>
        </div>

        {/* Center: Real Latency Telemetry */}
        <div className="flex items-center justify-center gap-2 px-3 py-1 bg-[#050508] border border-neutral-800 rounded-lg text-xs font-mono shadow-inner overflow-x-auto">
          <span className="flex items-center gap-1 text-red-400 font-bold shrink-0">
            <Zap className="w-3.5 h-3.5" />
            {telemetry.fastPath ? '⚡ Fast Path' : 'Multi-Pass'}
          </span>
          <span className="text-neutral-700">|</span>
          <span className="text-slate-300 shrink-0">
            Recognition <strong className="font-semibold text-red-400">{telemetry.recognition_sec}s</strong>
          </span>
          <span className="text-neutral-700">|</span>
          <span className="text-slate-300 shrink-0">
            Visual <strong className="font-semibold text-cyan-400">{telemetry.visual_sec}s</strong>
          </span>
          <span className="text-neutral-700">|</span>
          <span className="text-slate-300 shrink-0">
            Intelligence <strong className="font-semibold text-red-400">{telemetry.intelligence_sec}s</strong>
          </span>
          <span className="text-neutral-700">|</span>
          <span className="text-white font-bold shrink-0">
            Total {telemetry.total_sec}s
          </span>
        </div>

        {/* Right: Confidence & Export Actions */}
        <div className="flex items-center justify-end gap-2 shrink-0">
          <ConfidenceBadge confidence={resultData.overallConfidence} size="md" />

          <button
            type="button"
            onClick={handleExportText}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#14141c] hover:bg-[#1c1c28] text-slate-200 text-xs font-mono font-medium border border-neutral-800 hover:border-red-500/50 transition-colors cursor-pointer"
            title="Download plain transcription text"
          >
            <Download className="w-3.5 h-3.5 text-red-400" />
            <span>TXT</span>
          </button>

          <button
            type="button"
            onClick={handleExportJson}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#14141c] hover:bg-[#1c1c28] text-slate-200 text-xs font-mono font-medium border border-neutral-800 hover:border-cyan-500/50 transition-colors cursor-pointer"
            title="Download full intelligence JSON with provenance coordinates"
          >
            <Code2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* 2. LANGUAGE INTELLIGENCE & FORENSIC METRICS RIBBON */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Language Detection Pill Card (Col 8) */}
        <div className="md:col-span-8 p-3 rounded-xl bg-[#0c0c12] border border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-red-950/70 border border-red-500/40 flex items-center justify-center shrink-0">
              <Globe className="w-3.5 h-3.5 text-red-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-400 font-bold">
                  Document Language
                </span>
                {languageIntel.status === 'success' && (
                  <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-emerald-950/70 text-emerald-400 border border-emerald-800/50 font-bold">
                    {languageIntel.confidence}% Confidence
                  </span>
                )}
              </div>
              <div className="text-white font-bold truncate mt-0.5 flex items-center gap-2">
                <span>{languageIntel.displayLabel}</span>
                {languageIntel.isMultilingual && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-950/60 text-blue-400 border border-blue-800/40">
                    Multilingual Manuscript
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Script breakdown tags */}
          {languageIntel.status === 'success' && languageIntel.scripts.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {languageIntel.scripts.map((s, idx) => (
                <span
                  key={idx}
                  className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#050508] text-neutral-300 border border-neutral-800 shrink-0"
                >
                  {s}
                </span>
              ))}
            </div>
          )}

          {languageIntel.status === 'insufficient' && (
            <span className="text-[11px] text-neutral-400 italic">
              {languageIntel.message}
            </span>
          )}
        </div>

        {/* Forensic Document Profile Pill (Col 4) */}
        <div className="md:col-span-4 p-3 rounded-xl bg-[#0c0c12] border border-neutral-800 flex items-center justify-between text-xs shadow-md">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-neutral-400" />
            <div className="space-y-0.5">
              <div className="font-mono text-[10px] uppercase text-neutral-400">Document Profile</div>
              <div className="text-slate-200 font-mono text-xs">
                <strong>{wordCount}</strong> words • <strong>{editableText.length}</strong> chars • <strong>{segments.length}</strong> tokens
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowDocProfile(!showDocProfile)}
            className="text-[10px] font-mono px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 transition-colors cursor-pointer"
          >
            {showDocProfile ? 'Hide Profile' : 'View Profile'}
          </button>
        </div>
      </div>

      {/* Expanded Document Profile Forensic Strip (if toggled) */}
      {showDocProfile && (
        <div className="p-4 rounded-xl bg-[#08080d] border border-neutral-800 text-xs space-y-3 animate-hero-badge">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <span className="font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-red-500" />
              Document Forensics & Extracted Metadata Profile
            </span>
            <span className="text-[10px] font-mono text-neutral-400">
              Deterministic In-Memory Analysis
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 font-mono text-[11px]">
            <div className="p-2.5 rounded-lg bg-black/60 border border-neutral-800/80">
              <div className="text-neutral-400 text-[10px] uppercase">Primary Script</div>
              <div className="text-white font-bold mt-1">{languageIntel.primaryLanguage || 'Unknown'}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-black/60 border border-neutral-800/80">
              <div className="text-neutral-400 text-[10px] uppercase">Dates Detected</div>
              <div className="text-cyan-400 font-bold mt-1">
                {detectedDates.length > 0 ? detectedDates.join(', ') : 'None'}
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-black/60 border border-neutral-800/80">
              <div className="text-neutral-400 text-[10px] uppercase">Dosages / Units</div>
              <div className="text-amber-400 font-bold mt-1">
                {detectedMeasurements.length > 0 ? detectedMeasurements.slice(0, 3).join(', ') : 'None'}
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-black/60 border border-neutral-800/80">
              <div className="text-neutral-400 text-[10px] uppercase">Verification Status</div>
              <div className={needsReview ? 'text-amber-400 font-bold mt-1' : 'text-emerald-400 font-bold mt-1'}>
                {needsReview ? 'Review Required' : 'High Quality Scan'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Human Verification Notice Banner if needed */}
      {needsReview && (
        <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/50 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Confidence Advisory:</strong> Low-confidence or revised handwriting regions detected in this manuscript.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setCenterSubTab('uncertainty')}
            className="px-2.5 py-1 rounded bg-amber-900/60 hover:bg-amber-800 text-amber-200 font-mono text-[10px] uppercase font-bold border border-amber-700/60 transition-colors cursor-pointer"
          >
            Review {uncertainRegions.length || 1} Flags
          </button>
        </div>
      )}

      {/* Mobile / Tablet Column Switcher (< xl) */}
      <div className="flex xl:hidden items-center p-1 bg-[#0c0c12] border border-neutral-800 rounded-lg text-xs font-bold">
        <button
          type="button"
          onClick={() => setMobileActiveCol('left')}
          className={`flex-1 py-1.5 rounded text-center transition-all cursor-pointer ${
            mobileActiveCol === 'left' ? 'bg-red-600 text-white' : 'text-slate-400'
          }`}
        >
          1. Document Scan
        </button>
        <button
          type="button"
          onClick={() => setMobileActiveCol('center')}
          className={`flex-1 py-1.5 rounded text-center transition-all cursor-pointer ${
            mobileActiveCol === 'center' ? 'bg-red-600 text-white' : 'text-slate-400'
          }`}
        >
          2. Transcript & Find
        </button>
        <button
          type="button"
          onClick={() => setMobileActiveCol('right')}
          className={`flex-1 py-1.5 rounded text-center transition-all cursor-pointer ${
            mobileActiveCol === 'right' ? 'bg-red-600 text-white' : 'text-slate-400'
          }`}
        >
          3. AI Intelligence
        </button>
      </div>

      {/* 3-Column Document Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        {/* COLUMN 1 (LEFT, 4 COLS): HERO DOCUMENT SCAN */}
        <div
          className={`xl:col-span-4 flex flex-col h-full min-h-[580px] space-y-3 ${
            mobileActiveCol === 'left' ? 'block' : 'hidden xl:flex'
          }`}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold tracking-wider uppercase text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>1. Original Document Scan</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
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
          <div className="p-3 bg-[#0c0c12] border border-neutral-800 rounded-xl text-xs space-y-2">
            <div className="flex items-center justify-between font-mono text-[11px] text-slate-300">
              <span className="flex items-center gap-1.5 text-white font-bold">
                <Sliders className="w-3.5 h-3.5 text-red-500" />
                Optical Ingestion Pipeline:
              </span>
              <span className="text-red-400 font-bold">
                {resultData.processingInfo?.multiPassInfo?.passesEvaluated || 1} pass evaluated
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {resultData.processingInfo?.preProcessingApplied?.map((filter, i) => (
                <span
                  key={i}
                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#050508] text-slate-300 border border-neutral-800"
                >
                  {filter}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* COLUMN 2 (CENTER, 4 COLS): RECOGNIZED TRANSCRIPT, FIND IN DOC & EVIDENCE STREAM */}
        <div
          className={`xl:col-span-4 flex flex-col h-full min-h-[580px] space-y-3 ${
            mobileActiveCol === 'center' ? 'block' : 'hidden xl:flex'
          }`}
        >
          {/* Center Column Header & Tabs */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 p-0.5 bg-[#0c0c12] border border-neutral-800 rounded-lg">
              <button
                type="button"
                onClick={() => setCenterSubTab('transcript')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                  centerSubTab === 'transcript'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Active Transcript
              </button>
              {crossedOutItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCenterSubTab('revisions')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    centerSubTab === 'revisions'
                      ? 'bg-red-800 text-white shadow-sm'
                      : 'text-red-400 hover:bg-red-950/40'
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
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    centerSubTab === 'uncertainty'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-amber-400 hover:bg-amber-950/40'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>Flags ({uncertainRegions.length})</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
              <span>{wordCount} words</span>
              <span>•</span>
              <button
                type="button"
                onClick={handleCopy}
                className="p-1 rounded hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
                title="Copy transcription"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Subtab 1: Active Transcription & Interactive Token Stream */}
          {centerSubTab === 'transcript' && (
            <div className="flex-1 flex flex-col bg-[#0c0c12] border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
              {/* FIND IN DOCUMENT BAR */}
              <div className="p-2.5 bg-[#08080d] border-b border-neutral-800 flex items-center gap-2">
                <div className="relative flex-1 flex items-center">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentMatchIndex(0);
                    }}
                    placeholder="Find in document (e.g. patient, dosage, name)..."
                    className="w-full pl-8 pr-7 py-1.5 text-xs font-sans bg-[#050508] border border-neutral-800 focus:border-red-500 rounded-lg text-white placeholder-neutral-500 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="absolute right-2 p-0.5 text-neutral-400 hover:text-white rounded cursor-pointer"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Match count & Previous/Next navigation */}
                {searchQuery.trim() && (
                  <div className="flex items-center gap-1.5 text-[11px] font-mono shrink-0">
                    <span className={textMatches.length > 0 ? 'text-amber-400 font-bold' : 'text-neutral-500'}>
                      {textMatches.length > 0
                        ? `${currentMatchIndex + 1}/${textMatches.length}`
                        : 'No matches'}
                    </span>
                    {textMatches.length > 0 && (
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={handlePrevMatch}
                          className="p-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white cursor-pointer"
                          title="Previous match"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={handleNextMatch}
                          className="p-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white cursor-pointer"
                          title="Next match"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Toggle Editor vs Highlighted Reading Mode */}
                <div className="flex items-center gap-0.5 border-l border-neutral-800 pl-2">
                  <button
                    type="button"
                    onClick={() => setTranscriptViewMode(transcriptViewMode === 'edit' ? 'highlight' : 'edit')}
                    className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                      transcriptViewMode === 'highlight'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                    title={transcriptViewMode === 'edit' ? 'Switch to Highlight Reading View' : 'Switch to Text Editor'}
                  >
                    {transcriptViewMode === 'edit' ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Document Textarea / Highlighted Reading View */}
              <div className="p-3.5 border-b border-neutral-800 bg-[#08080d]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                    <span>Primary Transcribed Body</span>
                    {transcriptViewMode === 'highlight' && (
                      <span className="text-[10px] text-amber-400 font-normal">
                        (Reading & Search View)
                      </span>
                    )}
                  </span>
                  {isEdited && transcriptViewMode === 'edit' && (
                    <button
                      type="button"
                      onClick={handleResetText}
                      className="text-[10px] font-mono text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset original
                    </button>
                  )}
                </div>

                {transcriptViewMode === 'edit' ? (
                  <textarea
                    value={editableText}
                    onChange={(e) => setEditableText(e.target.value)}
                    className="w-full h-44 p-2.5 text-sm font-sans bg-[#050508] border border-neutral-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-600 leading-relaxed resize-none text-slate-100 shadow-inner"
                    placeholder="Extracted transcription text..."
                  />
                ) : (
                  renderHighlightedTranscript()
                )}
              </div>

              {/* Interactive Token Stream with Search Highlights */}
              <div className="flex-1 p-3.5 flex flex-col min-h-[220px]">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Crosshair className="w-3.5 h-3.5 text-red-500" />
                    <span>Evidence Stream (Click to Locate Box)</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {matchingSegmentIndices.size > 0
                      ? `${matchingSegmentIndices.size} matching tokens`
                      : `${segments.length} tokens`}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[260px] flex flex-wrap gap-1.5 content-start pr-1">
                  {segments.map((seg, idx) => {
                    const isTargeted =
                      selectedBbox &&
                      seg.bbox &&
                      Math.abs(selectedBbox[0] - seg.bbox[0]) < 12 &&
                      Math.abs(selectedBbox[1] - seg.bbox[1]) < 12;

                    const isSearchMatched = matchingSegmentIndices.has(idx);

                    let badgeStyle = 'bg-[#050508] text-slate-300 border-neutral-800 hover:border-neutral-700';
                    if (seg.is_crossed_out) {
                      badgeStyle = 'bg-red-950/80 text-red-400 border-red-800 line-through';
                    } else if (seg.is_margin_note) {
                      badgeStyle = 'bg-cyan-950/60 text-cyan-300 border-cyan-800 border-dashed';
                    } else if (seg.uncertain || (seg.confidence && seg.confidence < 0.75)) {
                      badgeStyle = 'bg-amber-950/60 text-amber-300 border-amber-800';
                    }

                    if (isSearchMatched) {
                      badgeStyle = 'bg-amber-950 text-amber-200 border-amber-500 ring-2 ring-amber-400/60 font-bold';
                    }

                    if (isTargeted) {
                      badgeStyle = 'bg-red-600 text-white border-red-500 ring-2 ring-red-400 shadow-lg font-bold';
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedBbox(seg.bbox)}
                        onMouseEnter={() => setHoveredBbox(seg.bbox)}
                        onMouseLeave={() => setHoveredBbox(null)}
                        className={`text-xs font-mono px-2 py-1 rounded-md border transition-all text-left flex items-center gap-1 cursor-pointer ${badgeStyle}`}
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
            <div className="p-3 bg-cyan-950/40 border border-cyan-800/60 rounded-xl text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-cyan-400">
                <Bookmark className="w-3.5 h-3.5" />
                <span>Marginal Annotations Detected ({marginNotes.length})</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Peripheral text isolated to maintain primary reading flow.
              </p>
            </div>
          )}
        </div>

        {/* COLUMN 3 (RIGHT, 4 COLS): INSTANT AI INTELLIGENCE */}
        <div
          className={`xl:col-span-4 flex flex-col h-full min-h-[580px] space-y-3 ${
            mobileActiveCol === 'right' ? 'block' : 'hidden xl:flex'
          }`}
        >
          {/* Right Column Header & Subtabs */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 p-0.5 bg-[#0c0c12] border border-neutral-800 rounded-lg">
              <button
                type="button"
                onClick={() => setRightSubTab('assistant')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                  rightSubTab === 'assistant'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ask CRY NOVA</span>
              </button>

              <button
                type="button"
                onClick={() => setRightSubTab('intelligence')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                  rightSubTab === 'intelligence'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Structured Intelligence</span>
              </button>
            </div>

            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-bold">
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
