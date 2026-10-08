import React, { useState } from 'react';
import Header from './components/Header';
import UploadPanel from './components/UploadPanel';
import ProcessingState from './components/ProcessingState';
import ResultsPanel from './components/ResultsPanel';
import { processImage } from './services/api';
import { AlertCircle, RotateCcw, RefreshCw, UploadCloud, ShieldAlert } from 'lucide-react';

/**
 * Main Application Component — Paper Intelligence Research Desk
 * Team: CRY NOVA
 * Project: HNX26EPS04 — Extreme Bad-Handwriting Digitizing Stack
 */
export default function App() {
  // State machine: 'UPLOAD' | 'PROCESSING' | 'RESULTS' | 'ERROR'
  const [appState, setAppState] = useState('UPLOAD');

  // Input states
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [presetId, setPresetId] = useState(null);

  // Result and processing telemetry states
  const [resultData, setResultData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [processingStatus, setProcessingStatus] = useState('');

  // Handle file selection
  const handleFileSelect = (file, url, chosenPresetId = null) => {
    setSelectedFile(file);
    setPreviewUrl(url);
    setPresetId(chosenPresetId);
    setResultData(null);
    setErrorMessage('');
    setProcessingStatus('');
  };

  // Clear selected file
  const handleClearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setPresetId(null);
    setResultData(null);
    setErrorMessage('');
    setProcessingStatus('');
  };

  // Execute digitization process with actual uploaded file
  const handleProcess = async (processOptions = {}) => {
    setAppState('PROCESSING');
    setErrorMessage('');
    setProcessingStatus('');
    setResultData(null);

    const targetFile = processOptions.file || selectedFile;
    const targetSource = targetFile || previewUrl;

    if (!targetSource) {
      setErrorMessage('No document provided for handwriting digitization.');
      setAppState('ERROR');
      return;
    }

    const filename = targetFile?.name ||
      (processOptions.presetId ? `${processOptions.presetId}_sample.png` : (presetId ? `${presetId}_sample.png` : 'document_scan.png'));

    try {
      const data = await processImage(targetSource, {
        presetId: processOptions.presetId || presetId,
        filename,
        onStatusUpdate: (status) => {
          setProcessingStatus(status);
        },
      });

      if (!data) {
        throw new Error('Received an empty response from the handwriting analysis engine.');
      }

      setResultData(data);
      setAppState('RESULTS');
    } catch (err) {
      console.error('Handwriting pipeline error:', err);
      setErrorMessage(
        err.message || 'CRY NOVA could not reach the analysis engine. Please retry in a few moments.'
      );
      setAppState('ERROR');
    }
  };

  // Reset back to upload
  const handleResetAll = () => {
    setAppState('UPLOAD');
    setSelectedFile(null);
    setPreviewUrl(null);
    setPresetId(null);
    setResultData(null);
    setErrorMessage('');
    setProcessingStatus('');
  };

  // Retry the current document
  const handleRetry = () => {
    if (selectedFile || previewUrl) {
      handleProcess({ file: selectedFile, presetId });
    } else {
      handleResetAll();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#050508] text-slate-100 selection:bg-red-600 selection:text-white">
      {/* Header */}
      <Header />

      {/* Main Research Desk Area */}
      <main className={`flex-1 w-full mx-auto px-3 sm:px-6 py-6 sm:py-8 transition-all ${appState === 'RESULTS' ? 'max-w-[1760px]' : 'max-w-7xl'}`}>
        {/* State 1: Upload / Landing */}
        {appState === 'UPLOAD' && (
          <UploadPanel
            onProcess={handleProcess}
            selectedFile={selectedFile}
            previewUrl={previewUrl}
            onFileSelect={handleFileSelect}
            onClear={handleClearFile}
            isProcessing={false}
          />
        )}

        {/* State 2: Processing */}
        {appState === 'PROCESSING' && (
          <ProcessingState
            filename={selectedFile ? selectedFile.name : `${presetId || 'uploaded_scan'}.png`}
            previewUrl={previewUrl}
            statusMessage={processingStatus}
          />
        )}

        {/* State 3: Results */}
        {appState === 'RESULTS' && resultData && (
          <ResultsPanel
            resultData={resultData}
            originalImageUrl={previewUrl}
            originalFilename={selectedFile ? selectedFile.name : (resultData.filename || 'uploaded_scan.png')}
            onResetAll={handleResetAll}
          />
        )}

        {/* State 4: Hardened Error Recovery Screen (Never a blank page) */}
        {appState === 'ERROR' && (
          <div className="w-full max-w-2xl mx-auto my-8 p-6 sm:p-8 bg-[#0c0c12] border border-red-900/60 rounded-2xl shadow-2xl shadow-black text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-red-950/80 border border-red-800/50 text-red-400 mx-auto flex items-center justify-center shadow-lg shadow-red-950/50">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-red-400 font-bold px-3 py-1 rounded-full bg-red-950/80 border border-red-900/60">
                OCR Engine Notice
              </span>
              <h3 className="text-xl font-bold text-white">
                Handwriting Analysis Could Not Complete
              </h3>
              <p className="text-xs text-red-300 font-mono bg-[#050508] p-3.5 rounded-lg border border-red-950 text-left overflow-x-auto shadow-inner">
                {errorMessage || 'Service encountered temporary latency or network cutoff.'}
              </p>
            </div>

            {/* Preserved Document Thumbnail Preview (Ensures user context is never lost) */}
            {previewUrl && (
              <div className="bg-[#050508] p-3 rounded-xl border border-red-950/60 flex items-center gap-4 text-left">
                <img
                  src={previewUrl}
                  alt="Failed scan preview"
                  className="w-16 h-16 object-cover rounded-lg border border-red-900/40 bg-black/60 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-white truncate">
                    {selectedFile ? selectedFile.name : 'Uploaded Document Scan'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Your document is preserved in memory. You can retry Fast OCR or test a verified sample.
                  </div>
                </div>
              </div>
            )}

            <div className="text-xs text-slate-300 space-y-1.5 text-left bg-[#08080d] p-4 rounded-xl border border-red-950/40 font-mono text-[11px]">
              <div className="font-bold text-red-400 flex items-center gap-1.5">
                <span>⚡ Quick Recovery Actions:</span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-slate-400">
                <li><strong className="text-slate-200">Retry Fast OCR:</strong> Cloud instance may have been waking up from idle state.</li>
                <li><strong className="text-slate-200">Use Sample Benchmark:</strong> Test verified clinical prescription or strikethrough samples.</li>
                <li><strong className="text-slate-200">Scale scan:</strong> If uploading huge raw scans (&gt;15MB), resize to 1200px for faster processing.</li>
              </ul>
            </div>

            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => handleProcess({ file: selectedFile, previewUrl })}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-950/60 transition-all border border-red-500/30"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retry Fast OCR
              </button>
              <button
                type="button"
                onClick={handleResetAll}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#14141c] hover:bg-[#1a1a24] text-slate-300 font-semibold text-xs border border-red-950/60 transition-colors"
              >
                Return to Upload
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Technical Footer */}
      <footer className="border-t border-red-950/70 bg-[#050508] py-5 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2 font-mono">
            <span className="font-bold text-red-500">CRY NOVA</span>
            <span className="text-red-900">•</span>
            <span>HNX26EPS04</span>
            <span className="text-red-900">•</span>
            <span className="text-slate-300">Extreme Bad-Handwriting Digitizing Stack</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span className="text-red-400 flex items-center gap-1.5 font-semibold">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              RapidOCR ONNX + Forensic Vision Stack
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
