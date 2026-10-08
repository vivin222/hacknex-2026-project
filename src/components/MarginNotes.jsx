import React, { useState } from 'react';
import { Bookmark, Copy, Check, Plus, Compass, Crosshair } from 'lucide-react';

/**
 * MarginNotes Component
 * Displays peripheral marginalia, vertical annotations, and header notes
 * isolated cleanly from the primary transcription body.
 * Theme: High-Contrast Red + Black with Cyan AI Accents
 */
export default function MarginNotes({
  notes = [],
  onAppendToEditor = null,
  onSelectBbox = null,
}) {
  const [copiedId, setCopiedId] = useState(null);

  if (!notes || notes.length === 0) {
    return (
      <div className="bg-[#0c0c12] border border-red-950/60 rounded-xl p-4 text-center shadow-md">
        <p className="text-xs text-slate-400">No peripheral margin notes detected.</p>
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
          <div className="p-1.5 rounded-lg bg-cyan-950/80 text-cyan-400 border border-cyan-800/40">
            <Bookmark className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Margin Notes & Annotations</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/50 font-bold">
                {notes.length} isolated
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Spatial peripheral notes separated from the main transcription body
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {notes.map((note) => {
          const isCopied = copiedId === note.id;
          const noteText = note.text || note.originalText || '';

          return (
            <div
              key={note.id}
              className="p-3.5 bg-[#050508] border border-cyan-950/60 rounded-lg hover:border-cyan-700/60 transition-colors shadow-inner"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-900/40 font-semibold">
                  <Compass className="w-3 h-3 text-cyan-400" />
                  {note.position || 'Margin Annotation'}
                </span>

                <div className="flex items-center gap-1">
                  {note.bbox && onSelectBbox && (
                    <button
                      type="button"
                      onClick={() => onSelectBbox(note.bbox)}
                      className="p-1 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/50 rounded transition-colors text-[10px] font-mono flex items-center gap-0.5"
                      title="Locate on document scan"
                    >
                      <Crosshair className="w-3 h-3" />
                      Locate
                    </button>
                  )}
                  {onAppendToEditor && (
                    <button
                      type="button"
                      onClick={() => onAppendToEditor(noteText)}
                      className="p-1 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition-colors"
                      title="Append this note to the main document"
                      aria-label="Append to document"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleCopy(note.id, noteText)}
                    className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                    title="Copy note text"
                    aria-label="Copy note"
                  >
                    {isCopied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="p-2.5 bg-[#09090e] rounded border border-red-950/40 text-xs text-slate-200 font-mono leading-relaxed">
                {noteText}
              </div>

              {note.confidence && (
                <div className="mt-2 text-[10px] font-mono text-slate-500">
                  Confidence: {Math.round(note.confidence * 100)}%
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
