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
  Check
} from 'lucide-react';
import { SAMPLE_PRESETS, validateImageFile } from '../services/api';
import { SAMPLE_IMAGES } from '../utils/sampleImages';

/**
 * UploadPanel Component
 * Polished upload zone supporting:
 * - Drag and drop
 * - File browser input (PNG, JPG/JPEG)
 * - Immediate image preview & metadata display
 * - Clear/remove selected image
 * - Pre-loaded challenge handwriting presets for rapid testing
 * - Strict client-side validation & accessible controls
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
    onFileSelect(file, URL.createObjectURL(file));
  };

  const handleSelectPreset = async (preset) => {
    setErrorMsg('');
    setSelectedPresetId(preset.id);

    const sampleUrl = preset.sampleUrl || SAMPLE_IMAGES[preset.id] || '/samples/sample_doctor_prescription.png';
    const fileName = preset.fileName || (sampleUrl.split('/').pop()) || `${preset.id}_sample.png`;

    try {
      // 1. Load the actual image asset as binary using fetch()
      const res = await fetch(sampleUrl);

      // 2. Verify the fetch response is successful
      if (!res.ok) {
        throw new Error(`Failed to load sample image (HTTP ${res.status}: ${res.statusText})`);
      }

      // 3. Convert response to Blob
      const blob = await res.blob();

      // 4. Verify Blob has a valid image MIME type
      const mimeType = blob.type || 'image/png';
      if (!mimeType.startsWith('image/')) {
        throw new Error(`Invalid MIME type for sample asset: ${mimeType}`);
      }

      // 5. Create a real File from that Blob with the correct filename and MIME type
      const file = new File([blob], fileName, { type: mimeType });

      // Temporary console diagnostics for sample upload
      console.log('[Sample Upload Diagnostic]', {
        'sample URL': sampleUrl,
        'HTTP status': res.status,
        'Blob size': blob.size,
        'Blob MIME type': blob.type,
        'File name': file.name,
        'File MIME type': file.type,
        'File size': file.size,
      });

      // 6. Pass that File through the EXACT same upload/analyze function used by normal user file upload
      const objectUrl = URL.createObjectURL(file);
      onFileSelect(file, objectUrl, preset.id);

      // Auto-trigger analysis for instant demo execution if onProcess is provided
      if (onProcess) {
        onProcess({ file, presetId: preset.id });
      }
    } catch (err) {
      console.error('[Sample Upload Error]', err);
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
      setErrorMsg('Please upload a handwriting image or choose one of the challenging test samples below.');
      return;
    }
    setErrorMsg('');
    onProcess({ file: selectedFile, presetId: selectedPresetId });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Introduction Banner & Brand Identity */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-950/70 text-red-300 border border-red-900/50 text-xs font-mono font-semibold shadow-md shadow-red-950/40">
          <span className="text-red-500 font-black">CRY NOVA</span>
          <span className="text-red-900">•</span>
          <span>HNX26EPS04</span>
          <span className="text-red-900">•</span>
          <span className="text-slate-300">Extreme Bad-Handwriting Digitizing Stack</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
          Turn Difficult Handwriting Into Evidence-Linked Intelligence.
        </h2>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Robust, multi-pass digitization designed for illegible medical cursive, faded historical scripts, and rushed handwritten scrawls. Grounded in spatial provenance with human-in-the-loop uncertainty isolation.
        </p>

        {/* 3-Step Visual Metaphor */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 max-w-3xl mx-auto text-left">
          <div className="p-3.5 rounded-xl bg-[#0a0a0f] border border-red-950/70 flex items-start gap-2.5 shadow-sm">
            <span className="w-5 h-5 rounded-full bg-red-950 text-red-400 font-mono text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold border border-red-900/50">
              1
            </span>
            <div>
              <h4 className="text-xs font-bold text-white">Physical Paper</h4>
              <p className="text-[11px] text-slate-400">Degraded ink, ligatures, and physical pen strikethroughs.</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0a0a0f] border border-red-900/50 flex items-start gap-2.5 shadow-sm">
            <span className="w-5 h-5 rounded-full bg-red-900/80 text-red-200 font-mono text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold border border-red-700/60">
              2
            </span>
            <div>
              <h4 className="text-xs font-bold text-red-300">Digital Recognition</h4>
              <p className="text-[11px] text-slate-400">RapidOCR ONNX multi-pass recognition & spatial bounding boxes.</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0a0a0f] border border-cyan-950/70 flex items-start gap-2.5 shadow-sm">
            <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-300 font-mono text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold border border-cyan-800/60">
              3
            </span>
            <div>
              <h4 className="text-xs font-bold text-cyan-300">AI Intelligence</h4>
              <p className="text-[11px] text-slate-400">Grounded entities, measurements, provenance & interactive Q&A.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error notification */}
      {errorMsg && (
        <div
          role="alert"
          className="flex items-center gap-2.5 p-3.5 bg-rose-950/80 border border-rose-500/60 rounded-xl text-xs text-rose-200 animate-fadeIn shadow-lg shadow-rose-950/40"
        >
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* Upload Dropzone Container */}
      <div className="bg-[#0c0c12] border border-red-950/70 rounded-2xl p-6 shadow-2xl shadow-black backdrop-blur-sm">
        {!previewUrl ? (
          /* Dropzone Empty State */
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? 'border-red-500 bg-red-950/40 ring-2 ring-red-500/30'
                : 'border-red-950/60 hover:border-red-700/60 bg-[#07070b]/60 hover:bg-[#0a0a10]'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/jpg, image/webp"
              className="hidden"
              id="file-upload-input"
            />

            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-red-950/80 border border-red-800/50 flex items-center justify-center text-red-400 shadow-md shadow-red-950/50 group-hover:scale-105 transition-transform">
                <UploadCloud className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">
                  Drag and drop your handwriting scan here, or{' '}
                  <span className="text-red-400 underline underline-offset-2 hover:text-red-300">browse</span>
                </p>
                <p className="text-xs text-slate-400">
                  Supports PNG, JPG, JPEG, WEBP (Max 15MB)
                </p>
              </div>

              <div className="pt-2 text-[11px] text-slate-500 font-mono">
                Guidance: High-contrast lighting and flat scans yield the cleanest ligatures
              </div>
            </div>
          </div>
        ) : (
          /* Image Selected / Preview State */
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-red-950/60">
              <div className="flex items-center gap-2">
                <FileImage className="w-4 h-4 text-red-400" />
                <span className="text-xs font-bold text-white">
                  {selectedFile ? selectedFile.name : `Preset: ${SAMPLE_PRESETS.find(p => p.id === selectedPresetId)?.title || 'Selected Scan'}`}
                </span>
                {selectedFile && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-900/40">
                    {(selectedFile.size / 1024).toFixed(0)} KB
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleClearSelected}
                className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-rose-400 hover:bg-red-950/50 px-2.5 py-1 rounded transition-colors border border-transparent hover:border-red-900/40"
                title="Remove selected image"
              >
                <X className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            </div>

            {/* Preview Box */}
            <div className="relative rounded-xl overflow-hidden bg-[#050508] border border-red-950/60 flex items-center justify-center max-h-[380px] p-3 shadow-inner">
              <img
                src={previewUrl}
                alt="Uploaded handwriting scan preview"
                className="max-h-[360px] max-w-full rounded object-contain shadow-2xl"
              />
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
                <HelpCircle className="w-3.5 h-3.5 text-red-500/70" />
                <span>Ready for neural OCR analysis & uncertainty isolation.</span>
              </div>

              <button
                type="button"
                onClick={handleTriggerProcess}
                disabled={isProcessing}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-lg shadow-red-950/60 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98] border border-red-500/30"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Process & Digitize Handwriting</span>
              </button>
            </div>
          </div>
        )}

        {/* Challenging Handwriting Presets (Allows judges to test immediately) */}
        <div className="mt-8 pt-6 border-t border-red-950/60">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Or Test With Realistic Challenging Manuscripts:
            </span>
            <span className="text-[10px] font-mono text-red-400">
              Instant Hackathon Benchmarks
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {SAMPLE_PRESETS.map((preset) => {
              const isSelected = selectedPresetId === preset.id && !selectedFile;

              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-3.5 rounded-xl border text-left transition-all relative ${
                    isSelected
                      ? 'bg-red-950/50 border-red-500 ring-1 ring-red-500/50 shadow-lg shadow-red-950/50'
                      : 'bg-[#08080d] border-red-950/60 hover:border-red-800/60 hover:bg-[#0c0c14]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-900/40 font-semibold">
                      {preset.tag}
                    </span>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-bold">
                        ✓
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-white mt-1 line-clamp-1">
                    {preset.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                    {preset.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Realistic System Disclaimer */}
      <div className="p-4 rounded-xl bg-[#0a0a0f] border border-red-950/60 text-xs text-slate-400 flex items-start gap-3 shadow-sm">
        <ShieldCheck className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-slate-200 font-bold">
            Realistic Accuracy & Human-in-the-Loop Protocol
          </p>
          <p className="leading-relaxed text-[11px] text-slate-400">
            Extreme handwriting inherently possesses optical ambiguities (e.g. overlapping loops, faded ink, scribbled strikethroughs). This stack does not falsely claim 100% flawless recognition; instead, it detects, isolates, and flags low-confidence regions for rapid user verification and export.
          </p>
        </div>
      </div>
    </div>
  );
}
