"""
Vision-Language Model (VLM) Visual Reasoning Engine.
Inspects original visual strokes to challenge and audit OCR hypotheses.
Core principle: VISUAL EVIDENCE > OCR GUESS.
"""

from typing import List, Dict, Any, Optional, Tuple
import json
import re
import cv2
import numpy as np
from PIL import Image
import io

from src.models import Segment, UncertainRegion
from src.config import GEMINI_API_KEY, DEFAULT_VLM_MODEL
from src.vlm.cv_visual_inspector import CVVisualInspector


class VisualReasoner:
    """
    Combines Multimodal LLM visual analysis with CV stroke heuristics
    to verify OCR hypotheses against the raw handwriting pixels.
    """

    def __init__(self, model_name: str = DEFAULT_VLM_MODEL, api_key: Optional[str] = None):
        self.model_name = model_name
        self.api_key = api_key or GEMINI_API_KEY
        self.cv_inspector = CVVisualInspector()

    def _call_gemini_vlm(self, image_np: np.ndarray, raw_ocr_text: str) -> Optional[Dict[str, Any]]:
        """Invokes Google Gemini VLM with the original image and raw OCR."""
        if not self.api_key:
            return None

        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=self.api_key)

            # Convert numpy BGR to PIL RGB image
            rgb_img = cv2.cvtColor(image_np, cv2.COLOR_BGR2RGB) if len(image_np.shape) == 3 else image_np
            pil_img = Image.fromarray(rgb_img)

            prompt = f"""You are an elite forensic handwriting analyst and paleographer evaluating difficult, cramped, messy handwriting.

ATTACHED: Original image containing messy handwriting.
SUPPORTING EVIDENCE (from local OCR engine, which may contain errors, hallucinate letters, miss strikethroughs, or scramble margins):
---
{raw_ocr_text}
---

CRITICAL RULES:
1. VISUAL EVIDENCE > OCR GUESS. The OCR is merely noisy evidence, NOT ground truth. Look closely at the actual pen strokes.
2. CROSSED-OUT TEXT: Look for horizontal or diagonal pen strokes crossing out words. If a word is crossed out and an active replacement is written nearby (e.g. above or beside it), identify both.
3. MARGIN NOTES: Distinguish between the main body flow and text written in margins, banners, or headers.
4. UNCERTAINTY & ILLEGIBILITY: If handwriting is genuinely illegible or ambiguous, DO NOT GUESS OR INVENT WORDS. Flag the exact word/character as uncertain with possible alternatives.
5. PRESERVE DOMAIN TERMS: Preserve exact drug names, dosages, medical metrics, numbers, abbreviations, and names.

You MUST respond strictly with a valid JSON object with the following schema:
{{
  "visual_transcription": "Complete corrected transcription based on direct visual evidence, using [uncertain] for unreadable parts and excluding crossed-out text from the active text stream",
  "ocr_discrepancies": [
    {{"ocr_text": "...", "visual_reading": "...", "confidence": 0.95, "reason": "Pen stroke clearly shows '...' rather than OCR's '...'"}}
  ],
  "crossed_out_regions": [
    {{"struck_text": "...", "replacement_text": "...", "confidence": 0.92}}
  ],
  "margin_notes": [
    {{"text": "...", "location": "left_margin", "confidence": 0.90}}
  ],
  "uncertain_regions": [
    {{"word": "...", "reason": "Ambiguous stroke shape or smudge", "alternatives": ["alt1", "alt2"]}}
  ],
  "visual_observations": "Concise summary of stroke dynamics, ink contrast, and document layout."
}}
"""

            response = client.models.generate_content(
                model=self.model_name,
                contents=[pil_img, prompt],
                config=types.GenerateContentConfig(
                    temperature=0.1,
                    response_mime_type="application/json"
                )
            )

            if response and response.text:
                clean_text = response.text.strip()
                # Strip markdown code blocks if wrapped
                if clean_text.startswith("```json"):
                    clean_text = clean_text[7:]
                if clean_text.startswith("```"):
                    clean_text = clean_text[3:]
                if clean_text.endswith("```"):
                    clean_text = clean_text[:-3]
                return json.loads(clean_text.strip())

        except Exception as e:
            print(f"[VLM Warning] Gemini API call skipped or encountered error: {e}")
            return None

    def _fallback_heuristic_reasoning(
        self, image: np.ndarray, segments: List[Segment], raw_ocr_text: str
    ) -> Dict[str, Any]:
        """
        Offline fallback performing deterministic CV inspection and lexical analysis
        when external VLM APIs are not configured.
        """
        # Run CV strikethrough detector
        inspected_segments = self.cv_inspector.detect_crossed_out_segments(image, segments)
        # Run CV margin note detector
        inspected_segments = self.cv_inspector.detect_margin_notes(image, inspected_segments)
        # Run sharpness inspection
        blur_regions = self.cv_inspector.inspect_visual_sharpness(image, inspected_segments)

        crossed_out = [
            {"struck_text": s.text, "replacement_text": None, "confidence": 0.85}
            for s in inspected_segments if s.is_crossed_out
        ]

        margins = [
            {"text": s.text, "location": "left_margin", "confidence": 0.88}
            for s in inspected_segments if s.is_margin_note
        ]

        # Detect obvious character scrambles or missing spaces (e.g. 'bpmeasuredat135')
        discrepancies = []
        for s in inspected_segments:
            # Check for non-ascii artifacts
            if any(ord(c) > 127 for c in s.text):
                cleaned = re.sub(r"[^\x00-\x7F]+", " ", s.text).strip()
                discrepancies.append({
                    "ocr_text": s.text,
                    "visual_reading": cleaned,
                    "confidence": 0.82,
                    "reason": "Non-ASCII garbled OCR artifacts filtered"
                })

        uncertain_list = []
        for r in blur_regions:
            uncertain_list.append({
                "word": r.text,
                "reason": r.reason,
                "alternatives": []
            })

        for s in inspected_segments:
            if s.uncertain and not s.is_crossed_out:
                uncertain_list.append({
                    "word": s.text,
                    "reason": s.reason or "Low recognition confidence",
                    "alternatives": []
                })

        # Build clean visual transcription excluding crossed-out text and isolating margin notes
        active_lines = [
            s.text for s in inspected_segments
            if not s.is_crossed_out and not s.is_margin_note
        ]
        visual_transcription = "\n".join(active_lines)

        return {
            "visual_transcription": visual_transcription,
            "ocr_discrepancies": discrepancies,
            "crossed_out_regions": crossed_out,
            "margin_notes": margins,
            "uncertain_regions": uncertain_list,
            "visual_observations": "Heuristic CV stroke and layout analysis (offline mode).",
            "is_heuristic_fallback": True
        }

    def reason(
        self, original_image: np.ndarray, segments: List[Segment], raw_ocr_text: str
    ) -> Tuple[Dict[str, Any], List[Segment]]:
        """
        Main entry point for VLM visual reasoning.
        Inspects original image, merges findings into segment tags, and extracts visual evidence.
        """
        # 1. Attempt Multimodal VLM
        vlm_data = self._call_gemini_vlm(original_image, raw_ocr_text)

        # 2. If VLM not available or failed, execute offline CV heuristics
        if not vlm_data:
            vlm_data = self._fallback_heuristic_reasoning(original_image, segments, raw_ocr_text)
            return vlm_data, segments

        # 3. If live VLM succeeded, reconcile with segments
        crossed_texts = {c.get("struck_text", "").lower() for c in vlm_data.get("crossed_out_regions", [])}
        margin_texts = {m.get("text", "").lower() for m in vlm_data.get("margin_notes", [])}

        for seg in segments:
            seg_lower = seg.text.lower()
            # Mark crossed-out if matched by VLM
            if any(struck in seg_lower for struck in crossed_texts if struck):
                seg.is_crossed_out = True
                seg.uncertain = True
                seg.reason = "VLM identified segment as crossed-out/deleted"

            # Mark margin notes
            if any(m_txt in seg_lower for m_txt in margin_texts if m_txt):
                seg.is_margin_note = True

        return vlm_data, segments
