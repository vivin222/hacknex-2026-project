import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileImage,
  X,
  Play,
  AlertCircle,
  HelpCircle,
  Sparkles,
  FileText,
  ShieldCheck,
  Check,
  ArrowRight,
  FileSearch,
  Scissors,
  Activity
} from 'lucide-react';
import { SAMPLE_PRESETS, validateImageFile } from '../services/api';
import { SAMPLE_IMAGES } from '../utils/sampleImages';
import CharacterFieldCanvas from './CharacterFieldCanvas';

/**
 * UploadPanel Component — Astra-Style Spatial Homepage & Intelligence Desk
 * Team: CRY NOVA | HNX26EPS04
 *
 * Visual Architecture:
 * - Void-black canvas with spatial FIELD OF INDIVIDUAL CHARACTERS
 * - Dominant central CRY NOVA hero with soft radial contrast mask
 * - Primary CTA: ENTER OCR (triggers direct file picker or analysis)
 * - Secondary CTA: EXPLORE INTELLIGENCE (launches benchmark intelligence)
 * - Interactive zero-interruption upload desk and 3 benchmark dockets
 */
export default function UploadPanel({
  onProcess = () => {},
  selectedFile = null,
  previewUrl = null,
  onFileSelect = () => {},
  onClear = () => {},
  isProcessing = false,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileVerification(file);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFileVerification(file);
    }
  };

  const handleFileVerification = (file) => {
    setErrorMsg('');
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrorMsg(validation.error);
      return;
    }
    setSelectedPresetId(null);
    const objUrl = URL.createObjectURL(file);
    onFileSelect(file, objUrl);

    // ZERO-INTERRUPTION WORKFLOW: Automatically trigger full pipeline immediately
    if (onProcess) {
      onProcess({ file, presetId: null });
    }
  };

  const handleSelectPreset = async (preset) => {
    setErrorMsg('');
    setSelectedPresetId(preset.id);

    const sampleUrl = preset.sampleUrl || SAMPLE_IMAGES[preset.id] || '/samples/sample_doctor_prescription.png';
    const fileName = preset.fileName || (sampleUrl.split('/').pop()) || `${preset.id}_sample.png`;

    try {
      const res = await fetch(sampleUrl);
      if (!res.ok) {
        throw new Error(`Failed to load sample document (HTTP ${res.status}: ${res.statusText})`);
      }
      const blob = await res.blob();
      const mimeType = blob.type || 'image/png';
      const file = new File([blob], fileName, { type: mimeType });
      const objectUrl = URL.createObjectURL(file);

      onFileSelect(file, objectUrl, preset.id);

      // Auto-trigger analysis for instant demo execution
      if (onProcess) {
        onProcess({ file, presetId: preset.id });
      }
    } catch (err) {
      console.error('[Sample Preset Error]', err);
      setErrorMsg(`Could not load sample: ${err.message}`);
      setSelectedPresetId(null);
    }
  };

  const handleClearSelected = () => {
    setSelectedPresetId(null);
    setErrorMsg('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClear();
  };

  const handleTriggerProcess = () => {
    if (!previewUrl && !selectedFile) {
      setErrorMsg('Please select a handwriting scan or choose one of the benchmark samples below.');
      return;
    }
    setErrorMsg('');
    onProcess({ file: selectedFile, presetId: selectedPresetId });
  };

  // Primary Hero Navigation: ENTER OCR
  const handleEnterOcr = () => {
    if (selectedFile || previewUrl) {
      handleTriggerProcess();
    } else {
      const deskElem = document.getElementById('ocr-workspace-desk');
      if (deskElem) {
        deskElem.scrollIntoView({ behavior: 'smooth' });
      }
      fileInputRef.current?.click();
    }
  };

  // Secondary Hero Navigation: EXPLORE INTELLIGENCE
  const handleExploreIntelligence = () => {
    handleSelectPreset(SAMPLE_PRESETS[0]);
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto space-y-12 py-2">
      {/* 1. SPATIAL FIELD OF INDIVIDUAL CHARACTERS (Canvas Animation, unmounted during OCR) */}
      <CharacterFieldCanvas />

      {/* 2. DOMINANT CENTRAL HERO WITH RADIAL CONTRAST MASK */}
      <div className="relative z-10 text-center space-y-6 pt-6 sm:pt-14 pb-8">
        {/* Refined Radial Soft Contrast Mask behind Hero */}
        <div className="absolute inset-0 pointer-events-none -z-10 bg-[radial-gradient(ellipse_80%_65%_at_50%_45%,rgba(5,5,8,0.98)_0%,rgba(5,5,8,0.76)_52%,rgba(5,5,8,0)_100%)]" />

        {/* Brand Tag Badge & Static Technical Metadata (Entrance Stage 1) */}
        <div className="animate-hero-badge flex flex-col items-center gap-2.5">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-950/40 text-red-400 border border-red-500/30 text-xs font-mono font-medium shadow-[0_0_18px_rgba(239,68,68,0.25)]">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-bold text-white tracking-wide">CRY NOVA</span>
            <span className="text-red-500/50">•</span>
            <span className="text-neutral-400">HNX26EPS04</span>
            <span className="text-red-500/50">•</span>
            <span className="text-red-400 font-semibold">Document Intelligence Lab</span>
          </div>

          <div className="hidden sm:flex items-center gap-2.5 text-[10px] font-mono tracking-widest text-neutral-500 uppercase">
            <span className="text-neutral-400">HNX26 / EPS04</span>
            <span>•</span>
            <span>DOCUMENT INTELLIGENCE LAB</span>
            <span>•</span>
            <span className="text-neutral-400">RAPIDOCR ONNX + FORENSIC STACK</span>
          </div>
        </div>

        {/* Central Dominant Headline (Entrance Stage 2) */}
        <h1 className="animate-hero-title text-5xl sm:text-7xl md:text-8xl font-black tracking-tight text-white drop-shadow-[0_0_45px_rgba(220,38,38,0.45)]">
          CRY NOVA
        </h1>

        {/* Subtitle (Entrance Stage 3) */}
        <div className="animate-hero-subtitle text-xs sm:text-sm md:text-base font-mono font-bold tracking-[0.22em] uppercase text-red-500">
          EXTREME BAD-HANDWRITING DIGITIZING STACK
        </div>

        {/* Tagline Manifesto (Entrance Stage 4) */}
        <p className="animate-hero-tagline text-base sm:text-lg font-serif-doc italic text-neutral-400 max-w-2xl mx-auto leading-relaxed">
          "Turn difficult handwriting into evidence-linked intelligence."
        </p>

        {/* Primary & Secondary Hero CTAs (Entrance Stage 5) */}
        <div className="animate-hero-cta flex flex-wrap items-center justify-center gap-4 pt-2">
          {/* Primary CTA: ENTER OCR */}
          <button
            type="button"
            onClick={handleEnterOcr}
            aria-label="Enter OCR Digitization Workspace"
            className="animate-crimson-pulse px-8 py-4 rounded-xl font-bold text-sm tracking-wider uppercase bg-gradient-to-r from-[#DC2626] via-[#EF4444] to-[#B91C1C] hover:from-[#B91C1C] hover:to-[#DC2626] text-white shadow-[0_0_30px_rgba(239,68,68,0.55)] hover:shadow-[0_0_48px_rgba(239,68,68,0.85)] transition-all duration-200 transform hover:scale-[1.03] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050508] cursor-pointer flex items-center gap-2.5"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>ENTER OCR</span>
          </button>

          {/* Secondary CTA: EXPLORE INTELLIGENCE */}
          <button
            type="button"
            onClick={handleExploreIntelligence}
            aria-label="Explore Document Intelligence Sample"
            className="px-7 py-4 rounded-xl font-semibold text-sm tracking-wide bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700/80 hover:border-red-500/60 shadow-md hover:shadow-[0_0_20px_rgba(220,38,38,0.25)] backdrop-blur-md transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050508] cursor-pointer flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-red-400" />
            <span>EXPLORE INTELLIGENCE</span>
          </button>
        </div>

        {/* Concept Visual Architecture Pillars (Entrance Stage 6) */}
        <div className="animate-hero-pillars grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-6 max-w-3xl mx-auto text-left">
          <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 flex items-start gap-3 shadow-xs hover:border-red-500/40 transition-colors backdrop-blur-sm">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#DC2626] to-[#B91C1C] text-white font-mono text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold shadow-2xs">
              01
            </span>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-red-400">Physical Paper</h4>
              <p className="text-xs text-neutral-400 mt-0.5">Degraded ink strokes, cursive ligatures & pen strikethroughs.</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 flex items-start gap-3 shadow-xs hover:border-red-500/40 transition-colors backdrop-blur-sm">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#8B5CF6] to-[#DC2626] text-white font-mono text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold shadow-2xs">
              02
            </span>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400">Digital Recognition</h4>
              <p className="text-xs text-neutral-400 mt-0.5">RapidOCR ONNX (0.3s), stroke isolation & uncertainty engine.</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 flex items-start gap-3 shadow-xs hover:border-red-500/40 transition-colors backdrop-blur-sm">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#10B981] to-[#06B6D4] text-white font-mono text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold shadow-2xs">
              03
            </span>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">AI Intelligence</h4>
              <p className="text-xs text-neutral-400 mt-0.5">Extracted entities, claims, revisions & grounded citations.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MAIN UPLOAD & DIGITIZATION DESK */}
      <div id="ocr-workspace-desk" className="relative z-10 bg-[#0c0d12]/95 border border-neutral-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        {/* Validation Error Alert */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-500/40 text-red-400 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {/* Upload Dropzone / Document Preview State */}
        {!previewUrl ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative overflow-hidden border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? 'border-red-500 bg-red-950/30 shadow-[0_0_30px_rgba(239,68,68,0.25)]'
                : 'border-neutral-700/80 hover:border-red-500/70 bg-[#12131a]/60 hover:bg-[#151622]/80 hover:shadow-lg'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/jpg, image/webp"
              className="hidden"
            />

            <div className="flex flex-col items-center justify-center space-y-3.5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#DC2626] via-[#EF4444] to-[#991B1B] flex items-center justify-center text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                <UploadCloud className="w-8 h-8 text-white" />
              </div>

              <div>
                <p className="text-base sm:text-lg font-bold text-white">
                  Drop handwritten manuscript or click to browse
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  Supports high-resolution PNG, JPG, JPEG, WEBP (Max 15MB)
                </p>
              </div>

              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Zero-Interruption Auto-Analysis: Dropping a document starts the pipeline instantly</span>
              </div>
            </div>
          </div>
        ) : (
          /* Document Selected State */
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2 min-w-0">
                <FileImage className="w-4 h-4 text-red-500 shrink-0" />
                <span className="text-xs font-semibold text-white truncate">
                  {selectedFile ? selectedFile.name : `Selected Document`}
                </span>
                {selectedFile && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                    {(selectedFile.size / 1024).toFixed(0)} KB
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleClearSelected}
                className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-red-400 px-2 py-1 rounded transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            </div>

            {/* Document Preview Box */}
            <div className="relative rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 flex items-center justify-center max-h-[380px] p-3 shadow-inner">
              <img
                src={previewUrl}
                alt="Selected handwriting scan"
                className="max-h-[360px] max-w-full rounded-lg object-contain"
              />
            </div>

            {/* Process Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div className="text-xs text-neutral-400 flex items-center gap-1.5 font-mono">
                <HelpCircle className="w-3.5 h-3.5 text-red-400" />
                <span>Ready for neural OCR analysis & uncertainty isolation.</span>
              </div>

              <button
                type="button"
                onClick={handleTriggerProcess}
                disabled={isProcessing}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#DC2626] to-[#EF4444] hover:opacity-95 text-white font-medium text-sm shadow-md disabled:opacity-50 transition-opacity cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Process & Digitize Handwriting</span>
              </button>
            </div>
          </div>
        )}

        {/* 4. SAMPLE DOCUMENT BENCHMARKS — 3 AUTHENTIC ARCHIVAL DOCKETS */}
        <div className="mt-8 pt-6 border-t border-neutral-800">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              Sample Document Experience — Test Benchmarks:
            </span>
            <span className="text-[10px] font-mono text-neutral-400 uppercase">
              1-Click Instant Execution
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SAMPLE_PRESETS.map((preset) => {
              const isSelected = selectedPresetId === preset.id && !selectedFile;
              const isSample1 = preset.code === 'SAMPLE 01' || preset.id === 'sample_01' || preset.id === 'clinical';
              const isSample2 = preset.code === 'SAMPLE 02' || preset.id === 'sample_02' || preset.id === 'historical';
              const isSample3 = preset.code === 'SAMPLE 03' || preset.id === 'sample_03' || preset.id === 'engineering';

              const accentBorder = isSample1
                ? 'border-l-4 border-l-[#2563EB]'
                : isSample2
                ? 'border-l-4 border-l-[#DC2626]'
                : 'border-l-4 border-l-[#06B6D4]';

              const badgeColor = isSample1
                ? 'bg-blue-950/60 text-blue-400 border-blue-500/40'
                : isSample2
                ? 'bg-red-950/60 text-red-400 border-red-500/40'
                : 'bg-cyan-950/60 text-cyan-400 border-cyan-500/40';

              const buttonGradient = isSample1
                ? 'bg-gradient-to-r from-[#2563EB] to-[#06B6D4] hover:opacity-95 text-white'
                : isSample2
                ? 'bg-gradient-to-r from-[#DC2626] to-[#EF4444] hover:opacity-95 text-white'
                : 'bg-gradient-to-r from-[#0891B2] to-[#06B6D4] hover:opacity-95 text-white';

              return (
                <div
                  key={preset.id}
                  className={`bg-[#12131a]/80 border rounded-xl p-4.5 flex flex-col justify-between transition-all duration-200 ${accentBorder} ${
                    isSelected
                      ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)] ring-2 ring-red-500/30'
                      : 'border-neutral-800 hover:border-neutral-700 hover:shadow-lg'
                  }`}
                >
                  <div>
                    {/* Header: Sample Code & Tag */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-xs font-bold tracking-tight text-white">
                        {preset.code || preset.title}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${badgeColor} font-semibold`}>
                        {preset.tag || 'Challenge Scan'}
                      </span>
                    </div>

                    {/* Document Title */}
                    <h3 className="text-sm font-bold text-white mb-2">
                      {preset.title}
                    </h3>

                    {/* Document Thumbnail Preview */}
                    <div className="w-full h-28 bg-neutral-900 rounded-lg border border-neutral-800 overflow-hidden mb-3 relative group">
                      <img
                        src={preset.sampleUrl}
                        alt={preset.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-black/20" />
                    </div>

                    {/* Capability Description */}
                    <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                      {preset.description}
                    </p>
                  </div>

                  {/* Try Sample Action Button */}
                  <button
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    disabled={isProcessing}
                    className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer ${buttonGradient}`}
                  >
                    <span>⚡ Run Benchmark Scan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. PROTOCOL NOTICE */}
      <div className="relative z-10 p-4 rounded-xl bg-neutral-950/80 border border-neutral-800/80 text-xs text-neutral-400 flex items-start gap-3 shadow-xs">
        <ShieldCheck className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-white font-semibold">
            Paper Intelligence Audit Standard
          </p>
          <p className="leading-relaxed text-[11px] text-neutral-400">
            Extreme low-legibility handwriting is decoded with multi-pass OCR, visual strikethrough inspection, and grounded confidence scoring. Low-certainty segments are explicitly surfaced for human verification rather than silently hallucinated.
          </p>
        </div>
      </div>
    </div>
  );
}
