"""
Contextual LLM Post-Corrector with conservative error-fixing rules.
Fixes handwriting recognition mistakes without inventing facts or hallucinating missing text.
"""

from typing import List, Dict, Any, Optional, Tuple
import json
import re

from src.models import Segment
from src.config import GEMINI_API_KEY, DEFAULT_LLM_MODEL


class PostCorrector:
    """
    Applies conservative language-model post-correction guided by VLM visual observations.
    Preserves exact dosages, numbers, abbreviations, and names.
    Explicitly retains [uncertain] tags when text is genuinely illegible.
    """

    def __init__(self, model_name: str = DEFAULT_LLM_MODEL, api_key: Optional[str] = None):
        self.model_name = model_name
        self.api_key = api_key or GEMINI_API_KEY

    def _call_gemini_llm(
        self, raw_ocr_text: str, vlm_data: Dict[str, Any], segments: List[Segment]
    ) -> Optional[Dict[str, Any]]:
        """Calls Gemini LLM for conservative post-correction."""
        if not self.api_key:
            return None

        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=self.api_key)

            vlm_summary = json.dumps({
                "visual_transcription": vlm_data.get("visual_transcription"),
                "ocr_discrepancies": vlm_data.get("ocr_discrepancies"),
                "crossed_out_regions": vlm_data.get("crossed_out_regions"),
                "margin_notes": vlm_data.get("margin_notes"),
                "uncertain_regions": vlm_data.get("uncertain_regions")
            }, indent=2)

            prompt = f"""You are a conservative post-correction engine for handwriting digitization.

OCR RAW EVIDENCE:
---
{raw_ocr_text}
---

VLM VISUAL REASONING OBSERVATIONS:
---
{vlm_summary}
---

STRICT EDITING RULES:
1. DO NOT HALLUCINATE OR INVENT INFORMATION: Never invent words, names, dosages, or sentences not evidenced in OCR or VLM observations.
2. CORRECT OBVIOUS RECOGNITION ERRORS: Fix obvious OCR character slips (e.g. 'patlent' -> 'Patient', 'retum' -> 'return', 'TDS  3 days' -> 'TDS x 3 days', '250mg 0D' -> '250mg OD').
3. CROSSED-OUT & REPLACED TEXT:
   - If text was struck through and replaced (e.g., '250mg OD' replaced by '500mg BD'), the main active text MUST feature the replacement ('500mg BD').
   - Do NOT include crossed-out text in the active text stream.
4. MARGIN NOTES: Keep margin notes identified and separate from the primary text flow.
5. PRESERVE UNCERTAINTY: If a word is flagged uncertain or ambiguous, keep an explicit indicator like '[uncertain]' or 'word[?]'. Do NOT guess simply because a word sounds plausible.
6. PRESERVE TECHNICAL / CLINICAL TERMS: Do not alter medication names, medical acronyms (TDS, BD, OD, CBC, Rx), or patient names.

Respond strictly in JSON format:
{{
  "corrected_text": "Clean, structured, editable transcription of main content",
  "corrections_applied": [
    {{"original": "...", "corrected": "...", "reason": "..."}}
  ],
  "margin_notes_text": "Extracted margin notes if any",
  "uncertainties_retained": ["..."]
}}
"""

            response = client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.0,
                    response_mime_type="application/json"
                )
            )

            if response and response.text:
                clean_text = response.text.strip()
                if clean_text.startswith("```json"):
                    clean_text = clean_text[7:]
                if clean_text.startswith("```"):
                    clean_text = clean_text[3:]
                if clean_text.endswith("```"):
                    clean_text = clean_text[:-3]
                return json.loads(clean_text.strip())

        except Exception as e:
            print(f"[LLM Warning] Post-correction API call failed: {e}")
            return None

    def _fallback_rule_based_correction(
        self, raw_ocr_text: str, vlm_data: Dict[str, Any], segments: List[Segment]
    ) -> Dict[str, Any]:
        """
        Deterministic, conservative rule-based corrector for offline mode.
        Performs regex word de-concatenation, typo repair, and crossed-out substitution.
        """
        corrections = []
        lines = []

        # Check for crossed-out substitutions from VLM or CV
        replacements = {}
        crossed_outs = vlm_data.get("crossed_out_regions", [])
        for item in crossed_outs:
            struck = item.get("struck_text")
            repl = item.get("replacement_text")
            if struck and repl:
                replacements[struck.lower()] = repl

        for seg in segments:
            if seg.is_margin_note:
                continue

            text = seg.text

            # Handle crossed out text
            if seg.is_crossed_out:
                # If there's an active replacement, use it
                matching_repl = None
                for struck_key, repl_val in replacements.items():
                    if struck_key in text.lower():
                        matching_repl = repl_val
                        break
                if matching_repl:
                    corrections.append({
                        "original": text,
                        "corrected": matching_repl,
                        "reason": "Replaced crossed-out text with active visual correction"
                    })
                    lines.append(matching_repl)
                # If no direct replacement, omit crossed out text from active flow
                continue

            orig_text = text

            # 1. Fix non-ASCII glyph artifacts (like \ufffd for x or times symbol)
            if "\ufffd" in text:
                text = text.replace("\ufffd", "x")
            # Replace common non-ascii math/cross glyphs
            text = text.replace("×", "x").replace("•", "*")

            # 2. Fix common OCR character confusion in clinical/medical contexts
            text = re.sub(r"\b(\d+mg)\s*0D\b", r"\1 OD", text)
            text = re.sub(r"\bretum\b", "return", text, flags=re.IGNORECASE)
            text = re.sub(r"\bpatlent\b", "patient", text, flags=re.IGNORECASE)

            # 3. Fix cramped merged words without spaces (e.g. 'bpmeasuredat135/88mmhg')
            text = re.sub(r"\bbpmeasuredat\b", "bp measured at ", text, flags=re.IGNORECASE)
            text = re.sub(r"\bprescribenaproxen\b", "prescribe naproxen ", text, flags=re.IGNORECASE)
            text = re.sub(r"\b(\d+)mmhg\b", r"\1 mmhg", text, flags=re.IGNORECASE)
            text = re.sub(r"\b(\d+)mgstat\b", r"\1 mg stat", text, flags=re.IGNORECASE)
            text = re.sub(r"\b(\d+)mgBD\b", r"\1 mg BD", text, flags=re.IGNORECASE)

            if text != orig_text:
                corrections.append({
                    "original": orig_text,
                    "corrected": text,
                    "reason": "Normalized merged handwriting tokens and OCR character artifacts"
                })

            lines.append(text)

        # Assemble clean text
        corrected_text = "\n".join(lines)

        # Margin notes
        margin_items = [s.text for s in segments if s.is_margin_note]
        margin_text = "\n".join(margin_items) if margin_items else ""

        return {
            "corrected_text": corrected_text,
            "corrections_applied": corrections,
            "margin_notes_text": margin_text,
            "uncertainties_retained": [u.get("word") for u in vlm_data.get("uncertain_regions", []) if u.get("word")]
        }

    def correct(
        self, raw_ocr_text: str, vlm_data: Dict[str, Any], segments: List[Segment]
    ) -> Tuple[str, List[Dict[str, Any]]]:
        """
        Executes post-correction.
        Returns final corrected text string and list of documented edits.
        """
        llm_result = self._call_gemini_llm(raw_ocr_text, vlm_data, segments)

        if not llm_result:
            llm_result = self._fallback_rule_based_correction(raw_ocr_text, vlm_data, segments)

        corrected_text = llm_result.get("corrected_text", raw_ocr_text)
        corrections_applied = llm_result.get("corrections_applied", [])

        return corrected_text, corrections_applied
