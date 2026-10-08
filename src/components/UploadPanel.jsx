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

/**
 * UploadPanel Component — Paper Intelligence Research Desk
 * Concept: PHYSICAL PAPER → DIGITAL UNDERSTANDING → AI INTELLIGENCE
 * Locked Colors:
 * - Paper: #F5F0E6 / #FAF6EE
 * - Ink: #171717
 * - Primary Blue: #2563EB
 * - AI Cyan: #06B6D4
 * - Human Review Amber: #D97706
 * - Retraction Red: #DC2626
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

    const sampleUrl = preset.sampleUrl || SAMPLE_IMAGES[preset.id] || SAMPLE_IMAGES[preset.legacyId] || '/samples/sample_doctor_prescription.png';
    const fileName = preset.fileName || `${preset.id}.png`;

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

      // Auto-trigger analysis for seamless testing
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

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 py-2">
      {/* Hero Header — Paper Intelligence Brand */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-violet-500/10 text-[#171717] border border-blue-500/30 text-xs font-mono font-medium shadow-xs">
          <span className="font-bold text-[#2563EB]">CRY NOVA</span>
          <span className="text-[#A39986]">•</span>
          <span className="text-[#525252]">HNX26EPS04</span>
          <span className="text-[#A39986]">•</span>
          <span className="text-[#06B6D4] font-semibold">Document Intelligence Lab</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#171717]">
          Extreme Bad-Handwriting Digitizing Stack
        </h1>

        <p className="text-base sm:text-lg font-serif-doc italic text-[#525252] max-w-2xl mx-auto">
          "Turn difficult handwriting into evidence-linked intelligence."
        </p>

        {/* Hero Concept Visual: PHYSICAL PAPER -> DIGITAL UNDERSTANDING -> AI INTELLIGENCE */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-3 max-w-3xl mx-auto text-left">
          <div className="p-4 rounded-xl bg-[#FAF6EE] border border-[#2563EB]/40 flex items-start gap-3 shadow-xs hover:border-[#2563EB] transition-colors">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#06B6D4] text-white font-mono text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold shadow-2xs">
              01
            </span>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">Physical Paper</h4>
              <p className="text-xs text-[#525252] mt-0.5">Degraded strokes, cursive ligatures & pen strikethroughs.</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF6EE] border border-[#8B5CF6]/40 flex items-start gap-3 shadow-xs hover:border-[#8B5CF6] transition-colors">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#8B5CF6] to-[#D946EF] text-white font-mono text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold shadow-2xs">
              02
            </span>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#8B5CF6]">Digital Understanding</h4>
              <p className="text-xs text-[#525252] mt-0.5">Fast-Path OCR (0.3s), stroke isolation & uncertainty engine.</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF6EE] border border-[#10B981]/40 flex items-start gap-3 shadow-xs hover:border-[#10B981] transition-colors">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#10B981] to-[#06B6D4] text-white font-mono text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold shadow-2xs">
              03
            </span>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#10B981]">AI Intelligence</h4>
              <p className="text-xs text-[#525252] mt-0.5">Extracted entities, claims, revisions & grounded citations.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Upload Desk Card */}
      <div className="bg-[#FAF6EE] border border-[#D8CEBC] rounded-2xl p-6 sm:p-8 shadow-sm">
        {/* Validation Error Alert */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-[#DC2626] text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {/* Upload Zone / Document Preview State */}
        {!previewUrl ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative overflow-hidden border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? 'border-[#06B6D4] bg-cyan-50/50 shadow-lg shadow-cyan-500/10'
                : 'border-[#D8CEBC] hover:border-[#2563EB] bg-[#FFFFFF]/80 hover:bg-[#FFFFFF] hover:shadow-md'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".png,.jpg,.jpeg,.webp,.bmp,.tiff"
              className="hidden"
            />

            <div className="flex flex-col items-center justify-center space-y-3.5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#2563EB] via-[#06B6D4] to-[#8B5CF6] flex items-center justify-center text-white shadow-md">
                <UploadCloud className="w-8 h-8 text-white" />
              </div>

              <div>
                <p className="text-base sm:text-lg font-bold text-[#171717]">
                  Drop handwritten manuscript or click to browse
                </p>
                <p className="text-xs text-[#737373] mt-1">
                  Supports high-resolution PNG, JPG, JPEG, WEBP, BMP, TIFF (Max 10MB)
                </p>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-mono font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Zero-Interruption Auto-Analysis: Dropping a document starts the pipeline instantly</span>
              </div>
            </div>
          </div>
        ) : (
          /* Document Selected State */
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#D8CEBC]">
              <div className="flex items-center gap-2 min-w-0">
                <FileImage className="w-4 h-4 text-[#2563EB] shrink-0" />
                <span className="text-xs font-semibold text-[#171717] truncate">
                  {selectedFile ? selectedFile.name : `Selected Document`}
                </span>
                {selectedFile && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EAE3D2] text-[#525252]">
                    {(selectedFile.size / 1024).toFixed(0)} KB
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleClearSelected}
                className="inline-flex items-center gap-1 text-xs text-[#737373] hover:text-[#DC2626] px-2 py-1 rounded transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            </div>

            {/* Document Preview Box */}
            <div className="relative rounded-xl overflow-hidden bg-[#FFFFFF] border border-[#D8CEBC] flex items-center justify-center max-h-[380px] p-3 shadow-inner">
              <img
                src={previewUrl}
                alt="Selected handwriting scan"
                className="max-h-[360px] max-w-full rounded-lg object-contain"
              />
            </div>

            {/* Process Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div className="text-xs text-[#525252] flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Ready for multi-pass HTR recognition and semantic extraction.</span>
              </div>

              <button
                type="button"
                onClick={handleTriggerProcess}
                disabled={isProcessing}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#06B6D4] hover:opacity-95 text-white font-medium text-sm shadow-sm disabled:opacity-50 transition-opacity"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Process & Digitize Handwriting</span>
              </button>
            </div>
          </div>
        )}

        {/* Phase 7: Sample Document Experience — 3 Visually Distinctive Archival Dockets */}
        <div className="mt-8 pt-6 border-t border-[#D8CEBC]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#171717] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#2563EB] to-[#06B6D4]" />
              Sample Document Experience — Test Benchmarks:
            </span>
            <span className="text-[10px] font-mono text-[#737373] uppercase">
              1-Click Instant Execution
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SAMPLE_PRESETS.map((preset) => {
              const isSelected = selectedPresetId === preset.id && !selectedFile;
              const isSample1 = preset.code === 'SAMPLE 01';
              const isSample2 = preset.code === 'SAMPLE 02';
              const isSample3 = preset.code === 'SAMPLE 03';

              const accentBorder = isSample1
                ? 'border-l-4 border-l-[#2563EB]'
                : isSample2
                ? 'border-l-4 border-l-[#F43F5E]'
                : 'border-l-4 border-l-[#10B981]';

              const badgeColor = isSample1
                ? 'bg-blue-50 text-[#2563EB] border-blue-200'
                : isSample2
                ? 'bg-rose-50 text-[#F43F5E] border-rose-200'
                : 'bg-emerald-50 text-[#10B981] border-emerald-200';

              const buttonGradient = isSample1
                ? 'bg-gradient-to-r from-[#2563EB] to-[#06B6D4] hover:opacity-95 text-white'
                : isSample2
                ? 'bg-gradient-to-r from-[#F43F5E] to-[#F59E0B] hover:opacity-95 text-white'
                : 'bg-gradient-to-r from-[#10B981] to-[#06B6D4] hover:opacity-95 text-white';

              return (
                <div
                  key={preset.id}
                  className={`bg-[#FFFFFF] border rounded-xl p-4.5 flex flex-col justify-between transition-all duration-200 ${accentBorder} ${
                    isSelected
                      ? 'border-[#2563EB] shadow-lg ring-2 ring-[#2563EB]/30'
                      : 'border-[#D8CEBC] hover:border-[#171717] hover:shadow-md'
                  }`}
                >
                  <div>
                    {/* Header: Sample Code & Tag */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-xs font-bold tracking-tight text-[#171717]">
                        {preset.code}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${badgeColor} font-semibold`}>
                        {preset.tag}
                      </span>
                    </div>

                    {/* Document Title */}
                    <h3 className="text-sm font-bold text-[#171717] mb-2">
                      {preset.title}
                    </h3>

                    {/* Document Thumbnail Preview */}
                    <div className="w-full h-28 bg-[#FAF6EE] rounded-lg border border-[#D8CEBC] overflow-hidden mb-3 relative group">
                      <img
                        src={preset.sampleUrl}
                        alt={preset.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-black/5" />
                    </div>

                    {/* Capability Description */}
                    <p className="text-xs text-[#525252] leading-relaxed mb-4">
                      {preset.description}
                    </p>
                  </div>

                  {/* Try Sample Action Button */}
                  <button
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    disabled={isProcessing}
                    className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs ${buttonGradient}`}
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

      {/* Protocol Notice */}
      <div className="p-4 rounded-lg bg-[#FAF6EE] border border-[#D8CEBC] text-xs text-[#525252] flex items-start gap-3 shadow-xs">
        <ShieldCheck className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-[#171717] font-semibold">
            Paper Intelligence Audit Standard
          </p>
          <p className="leading-relaxed text-[11px] text-[#525252]">
            Extreme low-legibility handwriting is decoded with multi-pass OCR, visual strikethrough inspection, and grounded confidence scoring. Low-certainty segments are explicitly surfaced for human verification rather than silently hallucinated.
          </p>
        </div>
      </div>
    </div>
  );
}
