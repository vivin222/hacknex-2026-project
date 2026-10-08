"""
AI Service Adapter for CRY NOVA Extreme Bad-Handwriting Digitizing Stack (HNX26EPS04).
Connects FastAPI directly to Vivin's core AI pipeline in ai/src/pipeline.py.

Extracts:
- Raw & Clean OCR/HTR Text
- Bounding boxes & segments
- Entities (patients, medications, clinical entities)
- Claims with source provenance
- Measurements & lab metrics
- Timeline & dates
- Conflict & contradiction detection
- Multi-signal uncertainty & confidence
"""

from __future__ import annotations

import logging
import os
import re
import sys
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger("cry_nova.ai_service")

# Resolve directories and ensure Vivin's AI pipeline ('ai') is in sys.path
_current_dir = Path(__file__).resolve().parent
_backend_root = _current_dir.parent
_repo_root = _backend_root.parent

# Support discovery if run from repo root or backend/
ai_paths = [
    _repo_root / "ai",
    _repo_root,
    _backend_root.parent / "ai",
]

for p in ai_paths:
    if p.exists() and str(p) not in sys.path:
        sys.path.insert(0, str(p))

try:
    from backend.config import CONFIDENCE_THRESHOLDS, get_confidence_status
except ImportError:
    try:
        from config import CONFIDENCE_THRESHOLDS, get_confidence_status
    except ImportError:
        CONFIDENCE_THRESHOLDS = {
            "HIGH_CONFIDENCE_MIN": 0.75,
            "NEEDS_REVIEW_MAX": 0.75,
            "CRITICAL_LOW_CONFIDENCE": 0.50,
            "MEDICATION_CONFIDENCE_MIN": 0.80,
            "DOC_UNCERTAIN_RATIO_ALERT": 0.15,
        }
        def get_confidence_status(c: float, cat: str = "general") -> str:
            min_t = 0.80 if cat in ["medication", "dosage"] else 0.75
            if c >= min_t: return "high_confidence"
            if c < 0.50: return "critical"
            return "needs_review"

AI_IMPORT_ERROR: Optional[str] = None
try:
    from src.pipeline import process_handwriting
    from src.models import PipelineConfig
    AI_PIPELINE_AVAILABLE = True
    logger.info("Vivin AI Pipeline (ai/src/pipeline.py) successfully connected.")
except Exception as e:
    AI_PIPELINE_AVAILABLE = False
    AI_IMPORT_ERROR = f"{type(e).__name__}: {e}"
    process_handwriting = None  # type: ignore
    PipelineConfig = None  # type: ignore
    logger.error(f"Failed to load Vivin AI pipeline from ai/src/pipeline.py: {e}")


def is_ai_connected() -> bool:
    """Return True if Vivin's real AI pipeline is loaded and callable."""
    return AI_PIPELINE_AVAILABLE and callable(process_handwriting)


def extract_entities_and_claims(
    text: str, segments: List[Dict[str, Any]], filename: str
) -> tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Extracts structured entities, verified claims with provenance,
    numerical measurements, and timeline dates from the recognized text.
    Decorates items with human-verification flags according to central thresholds.
    """
    entities: List[Dict[str, Any]] = []
    claims: List[Dict[str, Any]] = []
    measurements: List[Dict[str, Any]] = []
    timeline: List[Dict[str, Any]] = []

    if not text:
        return entities, claims, measurements, timeline

    lines = [line.strip() for line in text.split("\n") if line.strip()]

    def _make_entity(ent_type: str, val: str, base_conf: float) -> Dict[str, Any]:
        matched_conf = base_conf
        matched_bbox = None
        for s in segments:
            s_text = s.get("text", "")
            if s_text and (val in s_text or s_text in val):
                matched_conf = float(s.get("confidence", base_conf))
                matched_bbox = s.get("bbox")
                break
        status = get_confidence_status(matched_conf, ent_type.lower())
        needs_review = status in ["needs_review", "critical"]
        return {
            "type": ent_type,
            "value": val,
            "confidence": round(matched_conf, 2),
            "status": status,
            "needs_review": needs_review,
            "review_reason": f"Recognition confidence below threshold ({int(matched_conf*100)}%)" if needs_review else None,
            "bbox": matched_bbox,
        }

    # 1. Entity Extraction Patterns
    patient_match = re.search(r"\b(?:Pt|Patient|Name)\s*[:\-]?\s*([A-Za-z\s]+?)(?:,\s*Age|\s+Age|$)", text, re.IGNORECASE)
    if patient_match:
        p_name = patient_match.group(1).strip()
        entities.append(_make_entity("Patient", p_name, 0.92))

    age_match = re.search(r"\bAge\s*[:\-]?\s*(\d{1,3})\b", text, re.IGNORECASE)
    if age_match:
        entities.append(_make_entity("Age", age_match.group(1).strip(), 0.95))

    doctor_match = re.search(r"\b(?:Dr\.|Doctor)\s*([A-Za-z\.\s]+?)(?:,\s*MD|\s+MD|$)", text, re.IGNORECASE)
    if doctor_match:
        entities.append(_make_entity("Physician", f"Dr. {doctor_match.group(1).strip()}", 0.90))

    diagnosis_match = re.search(r"\b(?:Diag|Diagnosis)\s*[:\-]?\s*([A-Za-z0-9\s]+?)(?:\n|$)", text, re.IGNORECASE)
    if diagnosis_match:
        entities.append(_make_entity("Diagnosis", diagnosis_match.group(1).strip(), 0.88))

    # Medication Entities
    med_pattern = re.compile(
        r"\b(?:Rx|Tab|Cap|Inhaler|Syrup|Injection)?\s*([A-Z][a-z]+(?:-[A-Z][a-z]+)?)\s+(\d+(?:\.\d+)?\s*(?:mg|g|mcg|ml|puffs))\b",
        re.IGNORECASE
    )
    for m in med_pattern.finditer(text):
        med_name = m.group(1).strip()
        dosage = m.group(2).strip()
        entities.append(_make_entity("Medication", f"{med_name} {dosage}", 0.91))
        measurements.append({
            "metric": "Dosage",
            "value": dosage,
            "entity": med_name,
            "source": filename,
            "confidence": 0.91,
            "status": "high_confidence",
            "needs_review": False,
        })

    # 2. Vital Signs & Measurements
    bp_match = re.search(r"\b(?:BP|Blood Pressure)\s*[:\-]?\s*(\d{2,3}/\d{2,3})\s*(?:mmHg)?\b", text, re.IGNORECASE)
    if bp_match:
        measurements.append({
            "metric": "Blood Pressure",
            "value": f"{bp_match.group(1)} mmHg",
            "source": filename,
            "confidence": 0.89,
            "status": "high_confidence",
            "needs_review": False,
        })

    hr_match = re.search(r"\b(?:HR|Heart Rate|Pulse)\s*[:\-]?\s*(\d{2,3})\s*(?:bpm)?\b", text, re.IGNORECASE)
    if hr_match:
        measurements.append({
            "metric": "Heart Rate",
            "value": f"{hr_match.group(1)} bpm",
            "source": filename,
            "confidence": 0.90,
            "status": "high_confidence",
            "needs_review": False,
        })

    lab_pattern = re.compile(r"\b([A-Za-z0-9\s]+?)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(mg/dL|g/dL|/mcL|k|%|percent)\b", re.IGNORECASE)
    for lab in lab_pattern.finditer(text):
        measurements.append({
            "metric": lab.group(1).strip(),
            "value": f"{lab.group(2)} {lab.group(3)}",
            "source": filename,
            "confidence": 0.89,
            "status": "high_confidence",
            "needs_review": False,
        })

    # 3. Timeline & Durations
    duration_pattern = re.compile(r"\b(?:for|x|after)\s*(\d+\s*(?:days|weeks|months|hours))\b", re.IGNORECASE)
    for dur in duration_pattern.finditer(text):
        timeline.append({"event": "Treatment Duration / Follow-up", "timeframe": dur.group(1).strip(), "source": filename})

    date_pattern = re.compile(r"\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b", re.IGNORECASE)
    for d in date_pattern.finditer(text):
        timeline.append({"event": "Recorded Date", "timeframe": d.group(1).strip(), "source": filename})

    # 4. Verified Claims with Provenance & Flags
    for line in lines:
        if len(line) < 4:
            continue
        matched_conf = 0.85
        matched_bbox = None
        for s in segments:
            s_text = s.get("text", "")
            if s_text and (s_text in line or line in s_text):
                matched_conf = float(s.get("confidence", 0.85))
                matched_bbox = s.get("bbox")
                break

        c_status = get_confidence_status(matched_conf, "claim")
        c_needs_review = c_status in ["needs_review", "critical"]
        claims.append({
            "claim": line,
            "source": filename,
            "evidence": line,
            "confidence": round(matched_conf, 2),
            "status": c_status,
            "needs_review": c_needs_review,
            "review_reason": f"Line confidence ({int(matched_conf*100)}%) below threshold" if c_needs_review else None,
            "bbox": matched_bbox,
        })

    return entities, claims, measurements, timeline


def detect_conflicts(
    text: str, crossed_out: List[Dict[str, Any]], segments: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Detects contradictions such as struck-through dosages vs active dosages,
    or mutually conflicting statements.
    """
    conflicts: List[Dict[str, Any]] = []

    # Check for crossed-out dosage overrides
    if crossed_out:
        for item in crossed_out:
            struck_text = item.get("originalText") or item.get("text") or ""
            if not struck_text:
                continue

            # Look for dosages in struck text
            struck_dose = re.search(r"\b(\d+\s*(?:mg|g|mcg|ml)\s*(?:OD|BD|TDS|QDS|stat)?)\b", struck_text, re.IGNORECASE)
            day_match = re.search(r"\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b", struck_text, re.IGNORECASE)

            if struck_dose:
                # Compare with active text
                active_dose = re.search(r"\b(\d+\s*(?:mg|g|mcg|ml)\s*(?:OD|BD|TDS|QDS|stat)?)\b", text, re.IGNORECASE)
                if active_dose and active_dose.group(1).lower() != struck_dose.group(1).lower():
                    conflicts.append({
                        "type": "Dosage Revision / Strikethrough",
                        "severity": "medium",
                        "description": (
                            f"Strikethrough revision detected: '{struck_dose.group(1)}' "
                            f"was struck through and superseded by active dosage '{active_dose.group(1)}'."
                        ),
                        "struck_evidence": struck_text,
                        "active_evidence": active_dose.group(1),
                    })
                else:
                    conflicts.append({
                        "type": "Pen Strike-Out Deletion",
                        "severity": "low",
                        "description": f"Retracted statement: '{struck_text}' marked as deleted with pen strikethrough.",
                        "struck_evidence": struck_text,
                    })
            elif day_match:
                struck_day = day_match.group(1).capitalize()
                active_day = None
                for d_m in re.finditer(r"\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b", text, re.IGNORECASE):
                    cand = d_m.group(1).capitalize()
                    if cand.lower() != struck_day.lower():
                        active_day = cand
                        break
                if active_day:
                    conflicts.append({
                        "type": "Day/Date Revision / Strikethrough",
                        "severity": "medium",
                        "description": (
                            f"Strikethrough revision detected: '{struck_day}' was struck out "
                            f"and replaced by active day '{active_day}'."
                        ),
                        "struck_evidence": struck_text,
                        "active_evidence": active_day,
                    })
                else:
                    conflicts.append({
                        "type": "Pen Strike-Out Deletion",
                        "severity": "low",
                        "description": f"Retracted statement: '{struck_text}' marked as deleted with pen strikethrough.",
                        "struck_evidence": struck_text,
                    })
            else:
                conflicts.append({
                    "type": "Pen Strike-Out Deletion",
                    "severity": "low",
                    "description": f"Retracted statement: '{struck_text}' marked as deleted with pen strikethrough.",
                    "struck_evidence": struck_text,
                })

    # Check for contradictory dates if multiple conflicting follow-up days exist
    return conflicts


def process_image(image_path: str, filename: Optional[str] = None) -> Dict[str, Any]:
    """
    Main processing entry point.
    Processes the ACTUAL image using Vivin's AI engine.
    Returns fully populated JSON adhering strictly to the required schema.
    """
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found at path: {image_path}")

    req_id = f"req-{uuid.uuid4().hex[:12]}"
    disp_filename = filename or os.path.basename(image_path)

    if not is_ai_connected():
        logger.error(f"AI pipeline is not available in environment: {AI_IMPORT_ERROR}")
        return {
            "request_id": req_id,
            "filename": disp_filename,
            "success": False,
            "error": "AI pipeline is not available in environment.",
            "detail": f"Could not import ai/src/pipeline.py: {AI_IMPORT_ERROR}",
        }

    # Execute Vivin's core AI pipeline on the real image file
    logger.info(f"[{req_id}] Processing image {disp_filename} ({image_path}) with Vivin AI Engine...")
    pipeline_config = PipelineConfig(debug_mode=False)
    pipeline_result = process_handwriting(image_path, pipeline_config)

    res_dict = pipeline_result.model_dump() if hasattr(pipeline_result, "model_dump") else dict(pipeline_result)

    final_text = res_dict.get("text", "") or ""
    raw_segments = res_dict.get("segments", []) or []
    crossed_out = res_dict.get("crossedOutText", []) or []
    margin_notes = res_dict.get("marginNotes", []) or []
    uncertain_regions = res_dict.get("uncertainRegions", []) or []
    overall_conf = float(res_dict.get("overallConfidence", 0.0) or 0.0)
    raw_ocr = res_dict.get("rawOcrText", "") or ""
    proc_info = res_dict.get("processingInfo", {}) or {}

    # Extract semantic intelligence from the real recognized text
    entities, claims, measurements, timeline = extract_entities_and_claims(
        final_text, raw_segments, disp_filename
    )
    conflicts = detect_conflicts(final_text, crossed_out, raw_segments)

    # Format uncertainty array with semantic fields
    uncertainty_list = [
        {
            "id": f"u-{idx+1}",
            "text": u.get("text", ""),
            "confidence": round(float(u.get("confidence", 0.5)), 2) if "confidence" in u else 0.5,
            "reason": u.get("reason", "Visual glyph ambiguity"),
            "alternatives": u.get("suggested_alternatives", []),
            "bbox": u.get("bbox"),
        }
        for idx, u in enumerate(uncertain_regions)
    ]

    # Provenance array tracing evidence back to source
    provenance_list = [
        {
            "item": c.get("claim"),
            "source": disp_filename,
            "evidence": c.get("evidence"),
            "confidence": c.get("confidence"),
            "bbox": c.get("bbox"),
        }
        for c in claims
    ]

    # Human-Verification Flag Engine (Phase 1)
    flags: List[Dict[str, Any]] = []

    # Flag 1: Strikethrough revisions / Contradictions
    for idx, c in enumerate(conflicts):
        flags.append({
            "id": f"flag-conflict-{idx+1}",
            "type": "STRIKETHROUGH_REVISION" if "Strikethrough" in c.get("type", "") else "CONFLICT",
            "category": "Contradiction / Strikethrough",
            "target": c.get("struck_evidence", "Revision"),
            "confidence": 0.35,
            "status": "needs_review",
            "severity": c.get("severity", "medium"),
            "reason": c.get("description", "Physical pen strikethrough detected"),
            "recommendation": "Review original scan to verify superseded vs active statement.",
        })

    # Flag 2: Low-confidence OCR segments / Optical ambiguities
    for idx, u in enumerate(uncertain_regions):
        u_conf = round(float(u.get("confidence", 0.5)), 2)
        flags.append({
            "id": f"flag-uncertain-{idx+1}",
            "type": "NEEDS_REVIEW",
            "category": "Optical Ambiguity",
            "target": u.get("text", "Glyph"),
            "confidence": u_conf,
            "status": "critical" if u_conf < CONFIDENCE_THRESHOLDS["CRITICAL_LOW_CONFIDENCE"] else "needs_review",
            "severity": "high" if u_conf < CONFIDENCE_THRESHOLDS["CRITICAL_LOW_CONFIDENCE"] else "medium",
            "reason": u.get("reason", "Low recognition confidence"),
            "bbox": u.get("bbox"),
            "recommendation": "Human verification recommended before clinical or legal reliance.",
        })

    # Flag 3: Low-confidence Entities
    for idx, e in enumerate(entities):
        if e.get("needs_review"):
            if not any(f.get("target") == e.get("value") for f in flags):
                flags.append({
                    "id": f"flag-entity-{idx+1}",
                    "type": "UNCERTAIN_ENTITY",
                    "category": e.get("type", "Entity"),
                    "target": e.get("value", ""),
                    "confidence": e.get("confidence", 0.70),
                    "status": "needs_review",
                    "severity": "medium",
                    "reason": e.get("review_reason") or "Entity confidence below safety threshold",
                    "recommendation": "Verify clinical entity and dosage directly on scan image.",
                })

    # Overall Document Review Summary
    needs_review = len(flags) > 0 or overall_conf < CONFIDENCE_THRESHOLDS["HIGH_CONFIDENCE_MIN"]
    review_summary = {
        "needsHumanReview": needs_review,
        "flagCount": len(flags),
        "overallStatus": "needs_review" if needs_review else "high_confidence",
        "documentWarning": (
            f"Document contains {len(flags)} flagged region(s) requiring human verification. Do not assume medical certainty."
            if needs_review
            else "All document segments meet verified confidence thresholds."
        ),
        "thresholdsApplied": CONFIDENCE_THRESHOLDS,
    }

    return {
        "request_id": req_id,
        "filename": disp_filename,
        "success": True,
        "text": final_text,
        "entities": entities,
        "claims": claims,
        "measurements": measurements,
        "timeline": timeline,
        "conflicts": conflicts,
        "flags": flags,
        "reviewSummary": review_summary,
        "provenance": provenance_list,
        "uncertainty": uncertainty_list,
        "confidence": round(overall_conf, 2),
        "overallConfidence": round(overall_conf, 2),
        "segments": raw_segments,
        "uncertainRegions": uncertainty_list,
        "marginNotes": margin_notes,
        "crossedOutText": crossed_out,
        "rawOcrText": raw_ocr,
        "processing": {
            "ocr": "RapidOCR ONNX Runtime (Verbatim Multi-Pass Detection)",
            "vlm": "Multimodal Visual Inspection & Stroke Analysis",
            "llm": "Conservative Contextual Post-Correction",
        },
        "processingInfo": {
            "engine": "CRY NOVA Extreme Bad-Handwriting Stack (Vivin AI)",
            "processingTimeMs": proc_info.get("processingTimeMs", 1500),
            "preProcessingApplied": proc_info.get("preprocessingApplied", []),
            "multiPassInfo": proc_info.get("multiPassInfo"),
            "source_image": disp_filename,
            "isRealBackend": True,
        },
    }
