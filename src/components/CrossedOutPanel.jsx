import React, { useState } from 'react';
import { Strikethrough, RotateCcw, Copy, Check, Scissors, Crosshair } from 'lucide-react';

/**
 * CrossedOutPanel Component (Phase 15 — Revision Detection)
 * Displays detected strikethroughs, deletions, and superseded directives
 * isolated cleanly from the active transcription body.
 * Locked Color: Retraction Red (#DC2626)
 */
export default function CrossedOutPanel({
  crossedOutItems = [],
  onRestoreToEditor = null,
  onSelectBbox = null,
}) {
  const [copiedId, setCopiedId] = useState(null);

  if (!crossedOutItems || crossedOutItems.length === 0) {
    return (
      <div className="bg-[#FAF6EE] border border-[#D8CEBC] rounded-xl p-4 text-center shadow-xs">
        <p className="text-xs text-[#737373]">No pen strikethroughs or retracted strokes detected.</p>
      </div>
    );
  }

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-[#FAF6EE] border border-[#D8CEBC] rounded-xl overflow-hidden shadow-xs">
      <div className="px-5 py-3.5 bg-[#FAF6EE] border-b border-[#D8CEBC] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-red-50 text-[#DC2626] border border-red-200">
            <Scissors className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#171717] flex items-center gap-2">
              <span>Revision & Strikethrough Detection</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-red-100 text-[#DC2626] border border-red-300 font-bold">
                {crossedOutItems.length} retracted
              </span>
            </h4>
            <p className="text-[11px] text-[#525252]">
              Pen revisions detected and excluded from the active transcription
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {crossedOutItems.map((item) => {
          const isCopied = copiedId === item.id;
          const textValue = item.originalText || item.text || '';

          return (
            <div
              key={item.id}
              className="p-3.5 bg-[#FFFFFF] border border-red-200 rounded-lg hover:border-[#DC2626] transition-colors shadow-2xs"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-[#DC2626] line-through bg-red-50 px-2 py-0.5 rounded border border-red-200 font-bold">
                    [{textValue}]
                  </span>
                  {item.position && (
                    <span className="text-[10px] font-mono text-[#737373]">
                      {item.position}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {item.bbox && onSelectBbox && (
                    <button
                      type="button"
                      onClick={() => onSelectBbox(item.bbox)}
                      className="p-1 text-[#2563EB] hover:bg-blue-50 rounded transition-colors text-[10px] font-mono flex items-center gap-0.5"
                      title="Locate on document scan"
                    >
                      <Crosshair className="w-3 h-3" />
                      Locate
                    </button>
                  )}
                  {onRestoreToEditor && (
                    <button
                      type="button"
                      onClick={() => onRestoreToEditor(textValue)}
                      className="p-1 text-[#737373] hover:text-[#171717] hover:bg-[#EAE3D2] rounded transition-colors"
                      title="Insert this retracted text into editor"
                      aria-label="Insert text"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleCopy(item.id, textValue)}
                    className="p-1 text-[#737373] hover:text-[#171717] hover:bg-[#EAE3D2] rounded transition-colors"
                    title="Copy retracted text"
                    aria-label="Copy text"
                  >
                    {isCopied ? (
                      <Check className="w-3.5 h-3.5 text-[#059669]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {item.reason && (
                <p className="text-xs text-[#525252]">
                  <span className="font-semibold text-[#171717]">Detection: </span>
                  {item.reason}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
