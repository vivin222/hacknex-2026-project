import React, { useState, useRef, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  Sun,
  Layers,
  Maximize2,
  Scan,
  AlertTriangle
} from 'lucide-react';

/**
 * ImagePreview Component (Phase 5 - Professional Document & OCR Viewer)
 * Renders the uploaded original handwriting scan with interactive tools:
 * - Zoom controls (+ / - / fit-to-screen / 100% reset)
 * - Inverted / High-Contrast mode for deciphering faded ink
 * - SVG Bounding Box Overlays aligned to native image coordinates
 * - Visual distinction: Confident (green), Uncertain (amber dashed), Crossed-out (red strike), Margin (cyan)
 * - Interactive highlight of selected evidence / provenance
 */
export default function ImagePreview({
  imageUrl,
  title = 'Original Handwriting Scan',
  caption = '',
  segments = [],
  selectedBbox = null,
  hoveredBbox = null,
  onSelectSegment = null,
}) {
  const [zoom, setZoom] = useState(1);
  const [contrastMode, setContrastMode] = useState(false);
  const [showOverlays, setShowOverlays] = useState(true);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const imgRef = useRef(null);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 4));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setZoom(1);
  const handleFitToScreen = () => setZoom(0.9);

  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    setNaturalSize({ width: naturalWidth, height: naturalHeight });
  };

  // Helper to check if two bboxes match
  const isBboxMatch = (b1, b2) => {
    if (!b1 || !b2 || b1.length < 4 || b2.length < 4) return false;
    return (
      Math.abs(b1[0] - b2[0]) < 10 &&
      Math.abs(b1[1] - b2[1]) < 10 &&
      Math.abs(b1[2] - b2[2]) < 10 &&
      Math.abs(b1[3] - b2[3]) < 10
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl backdrop-blur">
      {/* Header Inspection Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800/80 gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <Eye className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-300 truncate">
            {title}
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 hidden sm:inline">
            Unaltered Capture
          </span>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-1">
          {/* Overlay Toggle */}
          <button
            type="button"
            onClick={() => setShowOverlays(!showOverlays)}
            className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition-colors ${
              showOverlays
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Toggle OCR Bounding Box Overlays"
            aria-label="Toggle Bounding Boxes"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden md:inline">Boxes</span>
          </button>

          {/* Contrast Mode Toggle */}
          <button
            type="button"
            onClick={() => setContrastMode(!contrastMode)}
            className={`p-1.5 rounded text-xs transition-colors ${
              contrastMode
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Toggle High-Contrast / Faint Ink Enhancement"
            aria-label="Toggle High-Contrast"
          >
            <Sun className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          {/* Zoom Out */}
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded disabled:opacity-30 transition-colors"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          {/* Zoom Label */}
          <span className="font-mono text-[11px] text-slate-300 px-1 min-w-[4ch] text-center">
            {Math.round(zoom * 100)}%
          </span>

          {/* Zoom In */}
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoom >= 4}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded disabled:opacity-30 transition-colors"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          {/* Fit to Screen */}
          <button
            type="button"
            onClick={handleFitToScreen}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            title="Fit to Screen"
            aria-label="Fit to Screen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* Reset 100% */}
          <button
            type="button"
            onClick={handleResetZoom}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            title="Reset to 100%"
            aria-label="Reset View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Interactive Canvas */}
      <div className="relative flex-1 overflow-auto bg-slate-950/80 p-4 min-h-[340px] flex items-center justify-center select-none">
        {imageUrl ? (
          <div
            className="relative transition-transform duration-150 ease-out flex items-center justify-center"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
            }}
          >
            {/* The Image Element */}
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Handwriting scan submitted for OCR digitization"
              onLoad={handleImageLoad}
              className={`max-w-full max-h-[580px] rounded object-contain shadow-2xl transition-all duration-200 ${
                contrastMode
                  ? 'contrast-[190%] brightness-105 grayscale'
                  : 'filter drop-shadow-md'
              }`}
            />

            {/* SVG Bounding Box Overlay Layer */}
            {showOverlays && naturalSize.width > 0 && segments.length > 0 && (
              <svg
                className="absolute inset-0 w-full h-full pointer-events-auto rounded"
                viewBox={`0 0 ${naturalSize.width} ${naturalSize.height}`}
                preserveAspectRatio="xMidYMid meet"
              >
                {segments.map((seg, idx) => {
                  if (!seg.bbox || seg.bbox.length < 4) return null;
                  const [x1, y1, x2, y2] = seg.bbox;
                  const w = Math.max(x2 - x1, 4);
                  const h = Math.max(y2 - y1, 4);

                  const isTargeted =
                    isBboxMatch(seg.bbox, selectedBbox) ||
                    isBboxMatch(seg.bbox, hoveredBbox);

                  const isHovered = hoveredIndex === idx;

                  let strokeColor = '#22c55e'; // Green for confident
                  let fillColor = 'rgba(34, 197, 94, 0.05)';
                  let strokeDash = undefined;

                  if (seg.is_crossed_out) {
                    strokeColor = '#ef4444'; // Red for crossed-out
                    fillColor = 'rgba(239, 68, 68, 0.15)';
                  } else if (seg.is_margin_note) {
                    strokeColor = '#06b6d4'; // Cyan for margin note
                    strokeDash = '6 3';
                    fillColor = 'rgba(6, 182, 212, 0.08)';
                  } else if (seg.uncertain || (seg.confidence && seg.confidence < 0.75)) {
                    strokeColor = '#f59e0b'; // Amber for uncertain
                    strokeDash = '5 3';
                    fillColor = 'rgba(245, 158, 11, 0.15)';
                  }

                  if (isTargeted) {
                    strokeColor = '#eab308'; // Highlight gold
                    fillColor = 'rgba(234, 179, 8, 0.25)';
                  }

                  return (
                    <g
                      key={idx}
                      className="cursor-pointer group"
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      onClick={() => onSelectSegment && onSelectSegment(seg)}
                    >
                      {/* Bounding Box Rect */}
                      <rect
                        x={x1}
                        y={y1}
                        width={w}
                        height={h}
                        fill={fillColor}
                        stroke={strokeColor}
                        strokeWidth={isTargeted ? 3.5 : isHovered ? 2.5 : 1.8}
                        strokeDasharray={strokeDash}
                        rx={3}
                        className="transition-all duration-150"
                      />

                      {/* Strikethrough diagonal indicator */}
                      {seg.is_crossed_out && (
                        <line
                          x1={x1}
                          y1={y1 + h / 2}
                          x2={x2}
                          y2={y1 + h / 2}
                          stroke="#ef4444"
                          strokeWidth={2.5}
                        />
                      )}

                      {/* Flag Label Banner on hover or if uncertain */}
                      {(isHovered || isTargeted || seg.uncertain || seg.is_crossed_out) && (
                        <g>
                          <rect
                            x={x1}
                            y={Math.max(0, y1 - 22)}
                            width={Math.min(w + 30, 240)}
                            height={20}
                            fill="#0f172a"
                            stroke={strokeColor}
                            strokeWidth={1}
                            rx={3}
                            opacity={0.95}
                          />
                          <text
                            x={x1 + 5}
                            y={Math.max(14, y1 - 7)}
                            fill="#f8fafc"
                            fontSize={11}
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            {seg.is_crossed_out
                              ? `[✕ Struck] ${seg.text.slice(0, 16)}`
                              : seg.uncertain
                              ? `[⚠ ${Math.round(seg.confidence * 100)}%] ${seg.text.slice(0, 16)}`
                              : `[✓ ${Math.round(seg.confidence * 100)}%] ${seg.text.slice(0, 16)}`}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
        ) : (
          <div className="text-center p-8 text-slate-500">
            <p className="text-sm">No image available</p>
          </div>
        )}

        {/* Enhanced Contrast Indicator Tag */}
        {contrastMode && (
          <div className="absolute bottom-3 left-3 bg-amber-500/90 text-slate-950 font-mono text-[10px] font-bold px-2 py-0.5 rounded shadow">
            ENHANCED INK CONTRAST FILTER ACTIVE
          </div>
        )}

        {/* BBox Legend Pill */}
        {showOverlays && segments.length > 0 && (
          <div className="absolute bottom-3 right-3 bg-slate-900/90 border border-slate-800 text-[10px] font-mono px-2.5 py-1 rounded-full shadow-lg flex items-center gap-2.5 text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>High (✓)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Review (⚠)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>Struck (✕)</span>
            </span>
          </div>
        )}
      </div>

      {/* Footer Info */}
      {caption && (
        <div className="px-4 py-2 bg-slate-900/90 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
          <span className="truncate">{caption}</span>
          <span className="text-slate-500 font-mono shrink-0 ml-2">
            {segments.length > 0 ? `${segments.length} Spatial Segments` : 'Visual Inspection'}
          </span>
        </div>
      )}
    </div>
  );
}
