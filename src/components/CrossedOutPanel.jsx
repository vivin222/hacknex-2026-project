import React, { useState } from 'react';
import { Strikethrough, RotateCcw, Copy, Check, Scissors, Crosshair } from 'lucide-react';

/**
 * CrossedOutPanel Component
 * Displays detected strikethroughs, deletions, and superseded directives
 * isolated cleanly from the active transcription body.
 * Theme: High-Contrast Red + Black
 */
export default function CrossedOutPanel({
  crossedOutItems = [],
  onRestoreToEditor = null,
  onSelectBbox = null,
}) {
  const [copiedId, setCopiedId] = useState(null);

  if (!crossedOutItems || crossedOutItems.length === 0) {
    return (
      <div className="bg-[#0c0c12] border border-red-950/60 rounded-xl p-4 text-center shadow-md">
        <p className="text-xs text-slate-400">No pen strikethroughs or retracted strokes detected.</p>
      </div>
    );
  }

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-[#0c0c12] border border-red-950/60 rounded-xl overflow-hidden shadow-xl">
      <div className="px-5 py-3.5 bg-[#08080d] border-b border-red-950/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-red-950/80 text-red-400 border border-red-900/40">
            <Scissors className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Revision & Strikethrough Detection</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-red-950/80 text-red-300 border border-red-900/50 font-bold">
                {crossedOutItems.length} retracted
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">
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
              className="p-3.5 bg-[#050508] border border-red-950/70 rounded-lg hover:border-red-700/60 transition-colors shadow-inner"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-red-400 line-through bg-red-950/80 px-2 py-0.5 rounded border border-red-900/50 font-bold">
                    [{textValue}]
                  </span>
                  {item.position && (
                    <span className="text-[10px] font-mono text-slate-400">
                      {item.position}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {item.bbox && onSelectBbox && (
                    <button
                      type="button"
                      onClick={() => onSelectBbox(item.bbox)}
                      className="p-1 text-red-400 hover:text-red-300 hover:bg-red-950/50 rounded transition-colors text-[10px] font-mono flex items-center gap-0.5"
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
                      className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                      title="Insert this retracted text into editor"
                      aria-label="Insert text"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleCopy(item.id, textValue)}
                    className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                    title="Copy retracted text"
                    aria-label="Copy text"
                  >
                    {isCopied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {item.replacement && (
                <div className="mt-2 text-xs flex items-center gap-1.5 text-slate-300 bg-[#08080d] p-2 rounded border border-red-950/60 font-mono">
                  <span className="text-red-500 font-bold">Active Superseding Text:</span>
                  <span className="font-bold text-white bg-red-950/60 px-1.5 py-0.5 rounded border border-red-900/40">
                    {item.replacement}
                  </span>
                </div>
              )}

              {item.reason && (
                <p className="text-[11px] text-slate-400 mt-2 font-mono">
                  Reason: {item.reason}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
