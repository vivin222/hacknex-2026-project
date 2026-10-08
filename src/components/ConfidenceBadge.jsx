import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react';

/**
 * Visual confidence indicator badge with threshold color grading
 * High (>= 85%): Emerald
 * Medium (70% - 84%): Amber
 * Low (< 70%): Rose
 */
export default function ConfidenceBadge({ confidence = 0, size = 'md', showLabel = true }) {
  const percentage = Math.round(confidence * 100);

  let tone = {
    bg: 'bg-emerald-950/60',
    border: 'border-emerald-500/40',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
    label: 'High Confidence',
    Icon: ShieldCheck,
  };

  if (confidence < 0.70) {
    tone = {
      bg: 'bg-rose-950/60',
      border: 'border-rose-500/40',
      text: 'text-rose-400',
      dot: 'bg-rose-400',
      label: 'Low Legibility',
      Icon: ShieldAlert,
    };
  } else if (confidence < 0.85) {
    tone = {
      bg: 'bg-amber-950/60',
      border: 'border-amber-500/40',
      text: 'text-amber-400',
      dot: 'bg-amber-400',
      label: 'Moderate — Review Needed',
      Icon: AlertTriangle,
    };
  }

  const { Icon } = tone;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2.5 font-semibold',
  }[size] || 'text-xs px-2.5 py-1 gap-2';

  return (
    <div
      className={`inline-flex items-center rounded-full border ${tone.bg} ${tone.border} ${tone.text} ${sizeClasses} shadow-sm backdrop-blur-sm`}
      title={`Calculated OCR Confidence: ${percentage}%`}
    >
      <Icon className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
      <span className="font-mono font-bold tracking-tight">{percentage}%</span>
      {showLabel && (
        <span className="text-slate-300 font-normal border-l border-slate-700/60 pl-1.5 ml-0.5 hidden sm:inline">
          {tone.label}
        </span>
      )}
    </div>
  );
}
