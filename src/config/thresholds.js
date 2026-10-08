/**
 * Central Confidence & Flag Threshold Configuration (HNX26EPS04).
 * Team: CRY NOVA
 *
 * Defines single source of truth for confidence boundaries across the UI.
 * Distinct states:
 *  ✓ High Confidence (>= 0.75)
 *  ⚠ Needs Review    (0.50 - 0.74)
 *  ✕ Critical Low    (< 0.50)
 */

export const CONFIDENCE_THRESHOLDS = {
  HIGH_CONFIDENCE_MIN: 0.75,
  NEEDS_REVIEW_MAX: 0.75,
  CRITICAL_LOW: 0.50,
  MEDICATION_MIN: 0.80,
};

export function getConfidenceStatus(confidence, category = 'general') {
  const conf = typeof confidence === 'number' ? confidence : 0.5;
  const minRequired = (category === 'medication' || category === 'dosage')
    ? CONFIDENCE_THRESHOLDS.MEDICATION_MIN
    : CONFIDENCE_THRESHOLDS.HIGH_CONFIDENCE_MIN;

  if (conf >= minRequired) {
    return 'high_confidence';
  } else if (conf < CONFIDENCE_THRESHOLDS.CRITICAL_LOW) {
    return 'critical';
  } else {
    return 'needs_review';
  }
}

export function getConfidenceBadgeProps(confidence, category = 'general') {
  const status = getConfidenceStatus(confidence, category);

  switch (status) {
    case 'high_confidence':
      return {
        status: 'high_confidence',
        symbol: '✓',
        label: 'High Confidence',
        badgeClass: 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300',
        dotClass: 'bg-emerald-400',
      };
    case 'critical':
      return {
        status: 'critical',
        symbol: '✕',
        label: 'Low Confidence (Critical)',
        badgeClass: 'bg-rose-950/70 border-rose-500/50 text-rose-300',
        dotClass: 'bg-rose-400',
      };
    case 'needs_review':
    default:
      return {
        status: 'needs_review',
        symbol: '⚠',
        label: 'Needs Review',
        badgeClass: 'bg-amber-950/70 border-amber-500/50 text-amber-300',
        dotClass: 'bg-amber-400',
      };
  }
}
