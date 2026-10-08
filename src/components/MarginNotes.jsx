import React, { useState } from 'react';
import { Bookmark, Copy, Check, Plus, Compass, Crosshair } from 'lucide-react';

/**
 * MarginNotes Component
 * Displays peripheral marginalia, vertical annotations, and header notes
 * isolated cleanly from the primary transcription body.
 * Locked Color: AI Cyan (#06B6D4)
 */
export default function MarginNotes({
  notes = [],
  onAppendToEditor = null,
  onSelectBbox = null,
}) {
  const [copiedId, setCopiedId] = useState(null);

  if (!notes || notes.length === 0) {
    return (
      <div className="bg-[#FAF6EE] border border-[#D8CEBC] rounded-xl p-4 text-center shadow-xs">
        <p className="text-xs text-[#737373]">No peripheral margin notes detected.</p>
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
          <div className="p-1.5 rounded-lg bg-cyan-50 text-[#0891B2] border border-cyan-200">
            <Bookmark className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#171717] flex items-center gap-2">
              <span>Margin Notes & Annotations</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-100 text-[#0891B2] border border-cyan-300 font-bold">
                {notes.length} isolated
              </span>
            </h4>
            <p className="text-[11px] text-[#525252]">
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
              className="p-3.5 bg-[#FFFFFF] border border-cyan-200 rounded-lg hover:border-[#06B6D4] transition-colors shadow-2xs"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#0891B2] bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200 font-semibold">
                  <Compass className="w-3 h-3 text-[#06B6D4]" />
                  {note.position || 'Margin Annotation'}
                </span>

                <div className="flex items-center gap-1">
                  {note.bbox && onSelectBbox && (
                    <button
                      type="button"
                      onClick={() => onSelectBbox(note.bbox)}
                      className="p-1 text-[#2563EB] hover:bg-blue-50 rounded transition-colors text-[10px] font-mono flex items-center gap-0.5"
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
                      className="p-1 text-[#737373] hover:text-[#0891B2] hover:bg-[#EAE3D2] rounded transition-colors"
                      title="Append this note to the main document"
                      aria-label="Append to document"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleCopy(note.id, noteText)}
                    className="p-1 text-[#737373] hover:text-[#171717] hover:bg-[#EAE3D2] rounded transition-colors"
                    title="Copy note text"
                    aria-label="Copy note"
                  >
                    {isCopied ? (
                      <Check className="w-3.5 h-3.5 text-[#059669]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <p className="text-xs text-[#171717] font-mono pl-2 border-l-2 border-[#06B6D4] leading-relaxed">
                {noteText}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
