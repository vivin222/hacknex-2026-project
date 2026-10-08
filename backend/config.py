"""
Central Configuration for CRY NOVA Extreme Bad-Handwriting Digitizing Stack (HNX26EPS04).
Member 1 & 3 — Core AI & Backend Configuration.

Defines thresholds in one single, easily configurable location.
"""

from typing import Dict, Any

# ==============================================================================
# CONFIDENCE & HUMAN VERIFICATION THRESHOLDS
# ==============================================================================

CONFIDENCE_THRESHOLDS: Dict[str, float] = {
    # High Confidence Minimum: Results >= 0.75 are considered reliable (✓)
    "HIGH_CONFIDENCE_MIN": 0.75,

    # Needs Review Cutoff: Results < 0.75 must be explicitly flagged for human inspection (⚠)
    "NEEDS_REVIEW_MAX": 0.75,

    # Critical Low Confidence: Results < 0.50 are severe optical ambiguities (✕ / ⚠)
    "CRITICAL_LOW_CONFIDENCE": 0.50,

    # Medication / Dosage Minimum: Medical terms require higher standard of certainty
    "MEDICATION_CONFIDENCE_MIN": 0.80,

    # Document Level Uncertainty Ratio: If > 15% of segments are uncertain, flag entire document
    "DOC_UNCERTAIN_RATIO_ALERT": 0.15,
}


def get_confidence_status(confidence: float, category: str = "general") -> str:
    """
    Returns 'high_confidence' (✓), 'needs_review' (⚠), or 'critical' (✕)
    based on calibrated thresholds.
    """
    if category == "medication" or category == "dosage":
        min_thresh = CONFIDENCE_THRESHOLDS["MEDICATION_CONFIDENCE_MIN"]
    else:
        min_thresh = CONFIDENCE_THRESHOLDS["HIGH_CONFIDENCE_MIN"]

    critical_thresh = CONFIDENCE_THRESHOLDS["CRITICAL_LOW_CONFIDENCE"]

    if confidence >= min_thresh:
        return "high_confidence"
    elif confidence < critical_thresh:
        return "critical"
    else:
        return "needs_review"
