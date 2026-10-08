import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Eye, Sun, Maximize2 } from 'lucide-react';

/**
 * ImagePreview Component
 * Renders the uploaded or selected original handwriting scan with inspection tools:
 * - Zoom controls (+ / - / reset)
 * - Inverted / High-Contrast mode for deciphering faded ink
 * - Non-destructive inspection
 */
export default function ImagePreview({
  imageUrl,
  title = 'Original Handwriting Scan',
  caption = '',
  compact = false,
  onRemove = null,
}) {
  const [zoom, setZoom] = useState(1);
  const [contrastMode, setContrastMode] = useState(false); // High-contrast binarization simulation

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => {
    setZoom(1);
    setContrastMode(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-lg backdrop-blur">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800/80">
        <div className="flex items-center gap-2 min-w-0">
          <Eye className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-300 truncate">
            {title}
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 hidden sm:inline">
            Original Unaltered
          </span>
        </div>

        {/* Inspection Tools */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setContrastMode(!contrastMode)}
            className={`p-1.5 rounded text-xs transition-colors ${
              contrastMode
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Toggle High-Contrast / Ink Enhancement"
            aria-label="Toggle High-Contrast"
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <div className="h-4 w-px bg-slate-800 mx-1" />
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoom <= 0.75}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] text-slate-400 px-1 min-w-[3ch] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoom >= 3}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            title="Reset Zoom and Filters"
            aria-label="Reset View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Image canvas container */}
      <div className="relative flex-1 overflow-auto bg-slate-950/70 p-4 min-h-[260px] flex items-center justify-center select-none">
        {imageUrl ? (
          <div className="relative transition-transform duration-150 ease-out flex items-center justify-center">
            <img
              src={imageUrl}
              alt="Handwriting scan submitted for OCR digitization"
              className={`max-w-full max-h-[520px] rounded object-contain shadow-2xl transition-all duration-200 ${
                contrastMode
                  ? 'contrast-[180%] brightness-110 grayscale'
                  : 'filter drop-shadow-md'
              }`}
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
              }}
            />
          </div>
        ) : (
          <div className="text-center p-8 text-slate-500">
            <p className="text-sm">No image available</p>
          </div>
        )}

        {/* Contrast indicator tag */}
        {contrastMode && (
          <div className="absolute bottom-3 left-3 bg-amber-500/90 text-slate-950 font-mono text-[10px] font-bold px-2 py-0.5 rounded shadow">
            ENHANCED CONTRAST FILTER ACTIVE
          </div>
        )}
      </div>

      {/* Footer info */}
      {caption && (
        <div className="px-4 py-2 bg-slate-900/90 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
          <span className="truncate">{caption}</span>
          <span className="text-slate-500 font-mono shrink-0 ml-2">Inspection Mode</span>
        </div>
      )}
    </div>
  );
}
