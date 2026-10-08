import React, { useState } from 'react';
import { Bookmark, Copy, Check, Plus, Compass } from 'lucide-react';

/**
 * MarginNotes Component
 * Displays peripheral marginalia, vertical annotations, and header notes
 * isolated from the primary transcription body.
 */
export default function MarginNotes({
  notes = [],
  onAppendToEditor = null,
}) {
  const [copiedId, setCopiedId] = useState(null);

  if (!notes || notes.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center">
        <p className="text-xs text-slate-500">No peripheral margin notes detected.</p>
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
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Bookmark className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Margin Notes
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/20">
                {notes.length} isolated
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Spatial marginalia separated from main transcription
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
              className="p-3.5 bg-slate-950/60 border border-sky-950/60 rounded-xl hover:border-sky-500/40 transition-colors"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-sky-300 bg-sky-950/50 px-2 py-0.5 rounded border border-sky-800/40">
                  <Compass className="w-3 h-3 text-sky-400" />
                  {note.position || 'Margin Annotation'}
                </span>

                <div className="flex items-center gap-1">
                  {onAppendToEditor && (
                    <button
                      type="button"
                      onClick={() => onAppendToEditor(noteText)}
                      className="p-1 text-slate-400 hover:text-sky-300 hover:bg-slate-800 rounded transition-colors"
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

              <p className="text-xs text-slate-200 font-mono pl-2 border-l-2 border-sky-500/50 leading-relaxed">
                {noteText}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
