"""
Uncertainty Engine for Bad-Handwriting Digitization.
Triangulates OCR model confidence, VLM visual disagreement, stroke ambiguity,
and physical deletions to determine when the system is not certain.
"""

from typing import List, Dict, Any, Optional, Tuple
import re

from src.models import Segment, UncertainRegion


class UncertaintyEngine:
    """
    Evaluates multiple orthogonal evidence signals to flag ambiguous, illegible,
    or conflicting handwriting segments. Avoids fabricating confidence metrics.
    """

    CONFIDENCE_THRESHOLD = 0.65

    def __init__(self, confidence_threshold: float = CONFIDENCE_THRESHOLD):
        self.confidence_threshold = confidence_threshold

    def evaluate(
        self,
        segments: List[Segment],
        vlm_data: Dict[str, Any],
        corrections: List[Dict[str, Any]],
        corrected_text: str
    ) -> Tuple[List[Segment], List[UncertainRegion], float]:
        """
        Synthesizes multi-source evidence and assigns honest uncertainty labels.

        Returns:
            updated_segments: Segments with uncertainty flags and explanatory reasons.
            uncertain_regions: Distinct list of highlighted regions for human review.
            overall_confidence: Arithmetic mean across non-deleted active segments.
        """
        uncertain_regions: List[UncertainRegion] = []
        updated_segments: List[Segment] = []

        # 1. Collect VLM discrepancy mappings
        vlm_discrepancies = {
            d.get("ocr_text", "").strip(): d
            for d in vlm_data.get("ocr_discrepancies", [])
        }

        vlm_uncertainties = {
            u.get("word", "").strip(): u
            for u in vlm_data.get("uncertain_regions", [])
        }

        for seg in segments:
            seg_copy = seg.model_copy()

            reasons: List[str] = []

            # Signal 1: Raw OCR Model Confidence
            if seg_copy.confidence < self.confidence_threshold:
                reasons.append(f"Low OCR model confidence ({seg_copy.confidence:.2f})")

            # Signal 2: OCR vs VLM Disagreement
            matching_disc = None
            for ocr_key, disc in vlm_discrepancies.items():
                if ocr_key in seg_copy.text:
                    matching_disc = disc
                    break

            if matching_disc:
                disc_reason = matching_disc.get("reason", "VLM reading conflicts with OCR")
                reasons.append(f"Visual discrepancy: {disc_reason}")
                # If there was a serious conflict, mark confidence as heuristic
                seg_copy.confidence = min(seg_copy.confidence, float(matching_disc.get("confidence", 0.70)))
                seg_copy.confidence_type = "heuristic"

            # Signal 3: VLM Explicit Uncertainty Detection
            for unc_word, unc_meta in vlm_uncertainties.items():
                if unc_word and unc_word.lower() in seg_copy.text.lower():
                    reasons.append(f"Visual ambiguity: {unc_meta.get('reason', 'Ambiguous character form')}")
                    seg_copy.confidence = min(seg_copy.confidence, 0.45)
                    seg_copy.confidence_type = "heuristic"

            # Signal 4: Crossed-Out Text
            if seg_copy.is_crossed_out:
                reasons.append("Physical pen strikethrough / cross-out line detected")
                seg_copy.confidence = min(seg_copy.confidence, 0.35)
                seg_copy.confidence_type = "heuristic"

            # Signal 5: Unresolved Special Characters or Replacement Glyphs
            if "\ufffd" in seg_copy.text or "[?]" in seg_copy.text or "[uncertain]" in seg_copy.text:
                reasons.append("Unresolved or corrupted character glyphs")
                seg_copy.confidence = min(seg_copy.confidence, 0.50)
                seg_copy.confidence_type = "heuristic"

            if reasons:
                seg_copy.uncertain = True
                seg_copy.reason = "; ".join(reasons)
                uncertain_regions.append(
                    UncertainRegion(
                        text=seg_copy.text,
                        bbox=seg_copy.bbox,
                        reason=seg_copy.reason,
                        suggested_alternatives=[]
                    )
                )

            updated_segments.append(seg_copy)

        # Calculate overall confidence across active (non-crossed out) segments
        active_segs = [s for s in updated_segments if not s.is_crossed_out]
        if active_segs:
            overall_conf = sum(s.confidence for s in active_segs) / len(active_segs)
        else:
            overall_conf = 0.0

        return updated_segments, uncertain_regions, round(overall_conf, 4)
