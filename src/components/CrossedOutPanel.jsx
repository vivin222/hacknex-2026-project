import React, { useState } from 'react';
import { Strikethrough, RotateCcw, Copy, Check, Scissors } from 'lucide-react';

/**
 * CrossedOutPanel Component
 * Displays detected strikethrough, scribble deletions, and revised words
 * kept completely distinct from the clean transcription.
 */
export default function CrossedOutPanel({
  crossedOutItems = [],
  onRestoreToEditor = null,
}) {
  const [copiedId, setCopiedId] = useState(null);

  if (!crossedOutItems || crossedOutItems.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center">
        <p className="text-xs text-slate-500">No crossed-out or retracted strokes detected.</p>
      </div>
    );
  }

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800/90 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Strikethrough className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Crossed-Out Text
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">
                {crossedOutItems.length} retracted
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Pen revisions detected and excluded from clean transcript
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
              className="p-3.5 bg-slate-950/60 border border-rose-950/60 rounded-xl hover:border-rose-500/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-rose-300/80 line-through bg-rose-950/40 px-2 py-0.5 rounded border border-rose-900/40">
                    [{textValue}]
                  </span>
                  {item.position && (
                    <span className="text-[10px] font-mono text-slate-500">
                      {item.position}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {onRestoreToEditor && (
                    <button
                      type="button"
                      onClick={() => onRestoreToEditor(textValue)}
                      className="p-1 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded transition-colors"
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

              {item.reason && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1.5">
                  <Scissors className="w-3 h-3 text-rose-400 shrink-0" />
                  <span>{item.reason}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
