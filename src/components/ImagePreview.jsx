import React, { useState, useRef } from 'react';
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
 * ImagePreview Component (Phase 8 — Document Viewer)
 * Interactive workspace for authentic handwriting inspection:
 * - Zoom controls (+ / - / fit / 100% reset)
 * - Enhanced Inverted/High-Contrast mode for deciphering faint ink
 * - SVG Bounding Box Overlays aligned to native coordinates
 * - Locked Colors:
 *   - Confident text: Primary Blue (#2563EB)
 *   - Low-confidence / uncertain: Human Review Amber (#D97706)
 *   - Crossed-out / retracted: Retraction Red (#DC2626)
 *   - Marginalia / layout: AI Cyan (#06B6D4)
 * - Click-to-locate: Clicking evidence immediately highlights source bounding box
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
  const handleFitToScreen = () => setZoom(0.85);

  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    setNaturalSize({ width: naturalWidth, height: naturalHeight });
  };

  // Helper to check if two bboxes match
  const isBboxMatch = (b1, b2) => {
    if (!b1 || !b2 || b1.length < 4 || b2.length < 4) return false;
    return (
      Math.abs(b1[0] - b2[0]) < 12 &&
      Math.abs(b1[1] - b2[1]) < 12 &&
      Math.abs(b1[2] - b2[2]) < 12 &&
      Math.abs(b1[3] - b2[3]) < 12
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF6EE] border border-[#D8CEBC] rounded-xl overflow-hidden shadow-xs">
      {/* Header Inspection Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#FAF6EE] border-b border-[#D8CEBC] gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <Eye className="w-4 h-4 text-[#2563EB] shrink-0" />
          <span className="text-xs font-bold tracking-wider uppercase text-[#171717] truncate">
            {title}
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#EAE3D2] text-[#525252] hidden sm:inline border border-[#D8CEBC]">
            Document Evidence
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
                ? 'bg-blue-50 text-[#2563EB] border border-blue-200'
                : 'text-[#737373] hover:text-[#171717] hover:bg-[#EAE3D2]'
            }`}
            title="Toggle OCR Bounding Box Overlays"
            aria-label="Toggle Bounding Boxes"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium hidden md:inline">Boxes</span>
          </button>

          {/* Contrast Mode Toggle */}
          <button
            type="button"
            onClick={() => setContrastMode(!contrastMode)}
            className={`p-1.5 rounded text-xs transition-colors ${
              contrastMode
                ? 'bg-amber-100 text-[#D97706] border border-amber-300'
                : 'text-[#737373] hover:text-[#171717] hover:bg-[#EAE3D2]'
            }`}
            title="Toggle High-Contrast / Faint Ink Enhancement"
            aria-label="Toggle High-Contrast"
          >
            <Sun className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-[#D8CEBC] mx-1" />

          {/* Zoom Out */}
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
            className="p-1.5 text-[#737373] hover:text-[#171717] hover:bg-[#EAE3D2] rounded disabled:opacity-30 transition-colors"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          {/* Zoom Label */}
          <span className="font-mono text-[11px] text-[#171717] font-semibold px-1 min-w-[4ch] text-center">
            {Math.round(zoom * 100)}%
          </span>

          {/* Zoom In */}
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoom >= 4}
            className="p-1.5 text-[#737373] hover:text-[#171717] hover:bg-[#EAE3D2] rounded disabled:opacity-30 transition-colors"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          {/* Fit to Screen */}
          <button
            type="button"
            onClick={handleFitToScreen}
            className="p-1.5 text-[#737373] hover:text-[#171717] hover:bg-[#EAE3D2] rounded transition-colors"
            title="Fit to Screen"
            aria-label="Fit to Screen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* Reset 100% */}
          <button
            type="button"
            onClick={handleResetZoom}
            className="p-1.5 text-[#737373] hover:text-[#171717] hover:bg-[#EAE3D2] rounded transition-colors"
            title="Reset to 100%"
            aria-label="Reset View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Interactive Document Desk Canvas */}
      <div className="relative flex-1 overflow-auto bg-[#F5F0E6] p-4 min-h-[380px] flex items-center justify-center select-none shadow-inner">
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
              className={`max-w-full max-h-[580px] rounded object-contain shadow-md transition-all duration-200 border border-[#D8CEBC] ${
                contrastMode
                  ? 'contrast-[220%] brightness-95 grayscale'
                  : ''
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

                  // Locked Colors:
                  let strokeColor = '#2563EB'; // Primary Blue for confident text
                  let fillColor = 'rgba(37, 99, 235, 0.08)';
                  let strokeDash = undefined;

                  if (seg.is_crossed_out) {
                    strokeColor = '#DC2626'; // Retraction Red
                    fillColor = 'rgba(220, 38, 38, 0.20)';
                  } else if (seg.is_margin_note) {
                    strokeColor = '#06B6D4'; // AI Cyan for margin notes
                    strokeDash = '6 3';
                    fillColor = 'rgba(6, 182, 212, 0.12)';
                  } else if (seg.uncertain || (seg.confidence && seg.confidence < 0.75)) {
                    strokeColor = '#D97706'; // Human Review Amber
                    strokeDash = '5 3';
                    fillColor = 'rgba(217, 119, 6, 0.18)';
                  }

                  if (isTargeted) {
                    strokeColor = '#06B6D4'; // Highlight Cyan target
                    fillColor = 'rgba(6, 182, 212, 0.35)';
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
                        rx={2}
                        className="transition-all duration-150"
                      />

                      {/* Strikethrough line indicator for struck strokes */}
                      {seg.is_crossed_out && (
                        <line
                          x1={x1}
                          y1={y1 + h / 2}
                          x2={x2}
                          y2={y1 + h / 2}
                          stroke="#DC2626"
                          strokeWidth={2.5}
                        />
                      )}

                      {/* Flag Label Banner on hover or if targeted */}
                      {(isHovered || isTargeted) && (
                        <g>
                          <rect
                            x={x1}
                            y={Math.max(0, y1 - 22)}
                            width={Math.min(w + 30, 240)}
                            height={20}
                            fill="#171717"
                            stroke={strokeColor}
                            strokeWidth={1}
                            rx={3}
                            opacity={0.95}
                          />
                          <text
                            x={x1 + 5}
                            y={Math.max(14, y1 - 7)}
                            fill="#FAF6EE"
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
          <div className="text-center p-8 text-[#A39986]">
            <p className="text-sm">No document loaded</p>
          </div>
        )}

        {/* Enhanced Contrast Indicator Tag */}
        {contrastMode && (
          <div className="absolute bottom-3 left-3 bg-[#D97706] text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded shadow">
            INK CONTRAST ENHANCED
          </div>
        )}

        {/* Locked Color Legend Pill */}
        {showOverlays && segments.length > 0 && (
          <div className="absolute bottom-3 right-3 bg-[#FAF6EE]/95 border border-[#D8CEBC] text-[10px] font-mono px-2.5 py-1 rounded-full shadow-xs flex items-center gap-2.5 text-[#171717]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
              <span>Evidence (✓)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#06B6D4]" />
              <span>AI / Margin</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#D97706]" />
              <span>Review (⚠)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
              <span>Struck (✕)</span>
            </span>
          </div>
        )}
      </div>

      {/* Footer Info */}
      {caption && (
        <div className="px-4 py-2 bg-[#FAF6EE] border-t border-[#D8CEBC] text-[11px] text-[#525252] flex items-center justify-between">
          <span className="truncate">{caption}</span>
          <span className="text-[#737373] font-mono shrink-0 ml-2">
            {segments.length > 0 ? `${segments.length} Bounding Regions` : 'Optical Scan'}
          </span>
        </div>
      )}
    </div>
  );
}
