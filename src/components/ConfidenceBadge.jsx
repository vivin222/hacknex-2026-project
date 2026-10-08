import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react';

/**
 * Visual confidence indicator badge (High-Contrast Red + Black Theme)
 * High (>= 85%): Emerald Green
 * Medium (70% - 84%): Amber Review
 * Low (< 70%): Critical Red
 */
export default function ConfidenceBadge({ confidence = 0, size = 'md', showLabel = true }) {
  const percentage = Math.round(confidence * 100);

  let tone = {
    bg: 'bg-emerald-950/70',
    border: 'border-emerald-700/60',
    text: 'text-emerald-400',
    label: 'High Confidence',
    Icon: ShieldCheck,
  };

  if (confidence < 0.70) {
    tone = {
      bg: 'bg-red-950/80',
      border: 'border-red-700/60',
      text: 'text-red-400',
      label: 'Critical Ambiguity',
      Icon: ShieldAlert,
    };
  } else if (confidence < 0.85) {
    tone = {
      bg: 'bg-amber-950/80',
      border: 'border-amber-700/60',
      text: 'text-amber-400',
      label: 'Needs Human Review',
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
      className={`inline-flex items-center rounded-full border ${tone.bg} ${tone.border} ${tone.text} ${sizeClasses} shadow-sm font-mono`}
      title={`Calculated OCR Confidence: ${percentage}%`}
    >
      <Icon className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
      <span className="font-bold tracking-tight">{percentage}%</span>
      {showLabel && (
        <span className="font-sans font-medium border-l border-current/20 pl-1.5 ml-0.5 hidden sm:inline text-xs">
          {tone.label}
        </span>
      )}
    </div>
  );
}
