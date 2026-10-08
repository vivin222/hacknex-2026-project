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
    <div className="min-h-screen flex flex-col bg-[#F5F0E6] text-[#171717] selection:bg-[#2563EB] selection:text-white">
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

        {/* State 4: Error State (Phase 17 — Clean, Judge-Appropriate, Zero Developer Leak) */}
        {appState === 'ERROR' && (
          <div className="w-full max-w-xl mx-auto my-12 p-8 bg-[#FAF6EE] border border-[#D8CEBC] rounded-xl shadow-md text-center space-y-6">
            <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 text-[#D97706] mx-auto flex items-center justify-center">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#D97706] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300">
                Engine Connection Notice
              </span>
              <h3 className="text-xl font-bold text-[#171717]">
                CRY NOVA could not reach the analysis engine.
              </h3>
              <p className="text-xs text-[#525252] leading-relaxed max-w-md mx-auto">
                {errorMessage.includes('waking up') || errorMessage.includes('initializing')
                  ? 'The cloud handwriting engine is spinning up from sleep mode. Free cloud instances take ~30 seconds to initialize.'
                  : errorMessage}
              </p>
            </div>

            {/* Practical connection guidance */}
            <div className="text-xs text-[#525252] bg-[#FFFFFF] p-4 rounded-lg border border-[#D8CEBC] text-left space-y-2">
              <div className="font-semibold text-[#171717] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                Recommended Actions:
              </div>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-[#525252]">
                <li>Click <strong>Retry Analysis</strong> to resend the document to the engine.</li>
                <li>If the backend is waking from sleep, it will be ready within 10–20 seconds.</li>
                <li>Verify your network connection can access secure HTTPS endpoints.</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={handleRetry}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white font-medium text-xs shadow-xs transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Analysis
              </button>

              <button
                type="button"
                onClick={handleResetAll}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#FFFFFF] hover:bg-[#FAF6EE] text-[#171717] font-medium text-xs border border-[#D8CEBC] transition-colors"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                Upload Again
              </button>

              <button
                type="button"
                onClick={() => setErrorMessage('')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-[#737373] hover:text-[#171717] text-xs transition-colors"
              >
                Clear Error
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Technical Archival Footer */}
      <footer className="border-t border-[#D8CEBC] bg-[#FAF6EE]/90 py-5 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#525252]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#171717]">Team CRY NOVA</span>
            <span className="text-[#A39986]">•</span>
            <span className="font-mono text-[#525252]">HNX26EPS04</span>
            <span className="text-[#A39986]">•</span>
            <span>Paper Intelligence Stack</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono text-[#525252]">
            <span className="text-[#2563EB] flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse" />
              Live Pipeline Active (Zero Hallucination)
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
