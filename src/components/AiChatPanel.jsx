import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  HelpCircle,
  Crosshair,
  RotateCcw,
  Bot,
  User,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Scissors,
  Activity,
  Calendar,
  FileText,
  Pill,
  ArrowRight
} from 'lucide-react';
import { answerDocumentQuery, SUGGESTED_QUESTIONS } from '../services/aiQueryEngine';

/**
 * AiChatPanel Component (Phase 8 - Instant AI Response System)
 * Allows users and judges to interact with the digitized manuscript:
 * - Ask natural language questions about the document
 * - One-click suggested research prompts
 * - Progressive streaming text simulation for fluid UX
 * - Discloses OBSERVED, INFERRED, and UNCERTAIN statements
 * - Clickable citation coordinates linking directly to original handwriting scan
 */
export default function AiChatPanel({
  resultData,
  onSelectBbox = () => {},
}) {
  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      question: null,
      answerText:
        'CRY NOVA Document Intelligence is ready. Ask any question about this manuscript, or select a research prompt below to examine extracted entities, revisions, or uncertainty.',
      bullets: [],
      sourceSummary: 'Core Semantic Knowledge Engine',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendQuestion = (questionText) => {
    const q = (questionText || inputQuery).trim();
    if (!q || isTyping) return;

    setInputQuery('');
    const userMsgId = `user-${Date.now()}`;
    const userMsg = {
      id: userMsgId,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // Compute deterministic grounded response
    const evaluation = answerDocumentQuery(q, resultData);

    // Fast progressive simulation (250ms delay for realism)
    setTimeout(() => {
      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        question: q,
        answerText: evaluation.answerText,
        bullets: evaluation.bullets || [],
        sourceSummary: evaluation.sourceSummary,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 280);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'ai',
        question: null,
        answerText:
          'Intelligence buffer cleared. Select a query prompt below or ask a specific question about the document.',
        bullets: [],
        sourceSummary: 'Core Semantic Knowledge Engine',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
              Instant AI Document Intelligence
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40">
                Grounding v2
              </span>
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClearHistory}
            className="text-[11px] font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-800 transition-colors"
            title="Clear interaction history"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* Suggested Chips Carousel */}
      <div className="px-3 py-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-xs">
        <span className="text-[10px] font-mono uppercase text-slate-400 shrink-0 font-semibold mr-1">
          Quick Prompts:
        </span>
        {SUGGESTED_QUESTIONS.map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => handleSendQuestion(chip.query)}
            disabled={isTyping}
            className="shrink-0 text-[11px] font-mono px-2.5 py-1 rounded-full bg-slate-800 hover:bg-cyan-950 hover:text-cyan-300 hover:border-cyan-500/40 text-slate-300 border border-slate-700/70 transition-all flex items-center gap-1.5 disabled:opacity-40"
          >
            <span>{chip.label}</span>
          </button>
        ))}
      </div>

      {/* Chat Messages Stream */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[380px] bg-slate-950/40 text-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === 'user' ? 'items-end' : 'items-start'
            } space-y-1`}
          >
            {/* Sender Label */}
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono px-1">
              {msg.sender === 'user' ? (
                <>
                  <span>You</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </>
              ) : (
                <>
                  <Bot className="w-3 h-3 text-cyan-400" />
                  <span className="text-cyan-400 font-semibold">CRY NOVA AI</span>
                  <span>•</span>
                  <span className="text-slate-400">{msg.sourceSummary || 'Grounded Engine'}</span>
                </>
              )}
            </div>

            {/* Bubble Content */}
            <div
              className={`max-w-[92%] rounded-xl p-3 leading-relaxed shadow ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white font-medium rounded-tr-none'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none space-y-2.5'
              }`}
            >
              {msg.sender === 'user' ? (
                <p>{msg.text}</p>
              ) : (
                <>
                  <p className="text-slate-100 font-sans">{msg.answerText}</p>

                  {/* Grounded Bullets with Citations */}
                  {msg.bullets && msg.bullets.length > 0 && (
                    <div className="space-y-2 pt-1 border-t border-slate-800/80">
                      {msg.bullets.map((b, bIdx) => (
                        <div
                          key={bIdx}
                          className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 flex flex-col gap-1 text-[11px]"
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.2 rounded border ${
                                  b.badgeClass || 'bg-slate-800 text-slate-300 border-slate-700'
                                }`}
                              >
                                {b.type}
                              </span>
                              <span className="font-semibold text-slate-200">{b.title}</span>
                            </div>

                            {b.bbox && (
                              <button
                                type="button"
                                onClick={() => onSelectBbox(b.bbox)}
                                className="inline-flex items-center gap-1 text-[10px] font-mono text-cyan-400 hover:text-cyan-300 hover:underline transition-colors shrink-0"
                                title="Highlight source region on document scan"
                              >
                                <Crosshair className="w-2.5 h-2.5" />
                                <span>Locate on Scan</span>
                              </button>
                            )}
                          </div>

                          <p className="text-slate-300 font-sans">{b.detail}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs pl-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Analyzing handwriting evidence...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendQuestion();
        }}
        className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
      >
        <label htmlFor="ai-doc-query-input" className="sr-only">
          Ask a question about this document
        </label>
        <input
          id="ai-doc-query-input"
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask a question about this document (e.g. 'What was crossed out?')..."
          disabled={isTyping}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/70 focus:ring-1 focus:ring-cyan-500/30 transition-colors"
        />

        <button
          type="submit"
          disabled={!inputQuery.trim() || isTyping}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-medium text-xs shadow transition-colors shrink-0"
          title="Send Question"
          aria-label="Send Question"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Ask AI</span>
        </button>
      </form>
    </div>
  );
}
