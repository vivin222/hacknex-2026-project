import React, { useState } from 'react';
import Header from './components/Header';
import UploadPanel from './components/UploadPanel';
import ProcessingState from './components/ProcessingState';
import ResultsPanel from './components/ResultsPanel';
import { processImage } from './services/api';
import { AlertCircle, RotateCcw } from 'lucide-react';

/**
 * Main Application Component for HNX26EPS04 Digitizing Stack
 * Team: CRY NOVA
 *
 * Coordinates 4 distinct application states:
 * 1. UPLOAD (Landing & Image Selection - NO DEFAULT IMAGES PRE-LOADED)
 * 2. PROCESSING (Sending actual uploaded bytes to FastAPI /analyze)
 * 3. RESULTS (Real extracted text, uncertainty, provenance, and conflict detection)
 * 4. ERROR (Real error reporting - NEVER faking demo success)
 */
export default function App() {
  // State machine: 'UPLOAD' | 'PROCESSING' | 'RESULTS' | 'ERROR'
  const [appState, setAppState] = useState('UPLOAD');

  // Input states - Start EMPTY by default
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [presetId, setPresetId] = useState(null);

  // Result state
  const [resultData, setResultData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle file selection (CRITICAL: Immediately clear any previous result)
  const handleFileSelect = (file, url, chosenPresetId = null) => {
    setSelectedFile(file);
    setPreviewUrl(url);
    setPresetId(chosenPresetId);
    setResultData(null); // OLD RESULT -> CLEAR
    setErrorMessage('');
  };

  // Clear selected file/image
  const handleClearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setPresetId(null);
    setResultData(null); // OLD RESULT -> CLEAR
    setErrorMessage('');
  };

  // Execute digitization process with actual uploaded file
  const handleProcess = async (processOptions = {}) => {
    setAppState('PROCESSING');
    setErrorMessage('');
    setResultData(null); // Clear previous result before new run

    try {
      const targetSource = processOptions.file || selectedFile || previewUrl;
      if (!targetSource) {
        throw new Error('No image provided for processing.');
      }

      const filename = processOptions.file?.name ||
        selectedFile?.name ||
        (processOptions.presetId ? `${processOptions.presetId}_sample.png` : 'uploaded_document.png');

      const data = await processImage(targetSource, {
        presetId: processOptions.presetId || presetId,
        filename,
      });

      if (!data) {
        throw new Error('Empty response received from analysis service.');
      }

      setResultData(data);
      setAppState('RESULTS');
    } catch (err) {
      console.error('Processing error:', err);
      setErrorMessage(err.message || 'An error occurred during real handwriting analysis.');
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
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
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

        {/* State 4: Error State */}
        {appState === 'ERROR' && (
          <div className="w-full max-w-xl mx-auto my-12 p-8 bg-slate-900 border border-rose-500/30 rounded-2xl shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-rose-400 font-semibold px-2.5 py-0.5 rounded-full bg-rose-950/60 border border-rose-800/40">
                Pipeline Error
              </span>
              <h3 className="text-xl font-bold text-slate-100">
                Handwriting Analysis Unsuccessful
              </h3>
              <p className="text-xs text-rose-300 font-mono bg-slate-950 p-3 rounded-lg border border-slate-800 text-left overflow-x-auto">
                {errorMessage}
              </p>
            </div>

            <div className="text-xs text-slate-400 space-y-1 text-left bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
              <div className="font-semibold text-slate-300">Diagnostics:</div>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-400">
                <li>Make sure the FastAPI backend is running (`uvicorn backend.main:app --port 8000`).</li>
                <li>Verify the uploaded file is a valid non-corrupted image (PNG, JPG, WEBP).</li>
                <li>Check backend terminal logs for stack trace or optical recognition messages.</li>
              </ul>
            </div>

            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={handleResetAll}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Return to Upload
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Technical Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/90 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Team CRY NOVA</span>
            <span>•</span>
            <span>HNX26EPS04</span>
            <span>•</span>
            <span>Extreme Bad-Handwriting Digitizer</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Live Pipeline Active
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
