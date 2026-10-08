"""
Data models and schemas for the CRY NOVA Handwriting Digitization Stack.
Designed for strict type safety, serialization, and clean team integration.
"""

from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field


class Segment(BaseModel):
    """
    Represents an atomic recognized text segment (word or line)
    with spatial coordinates, confidence, and uncertainty annotations.
    """
    text: str = Field(..., description="Recognized or corrected text for this segment")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score from 0.0 to 1.0")
    uncertain: bool = Field(default=False, description="True if this segment is flagged as ambiguous or low-confidence")
    reason: Optional[str] = Field(default=None, description="Explanation for uncertainty if flagged")
    confidence_type: Literal["model", "heuristic", "unavailable"] = Field(
        default="model", description="Origin of confidence metric (model-reported vs heuristic rule)"
    )
    bbox: Optional[List[int]] = Field(
        default=None, description="Bounding box [x1, y1, x2, y2] in original image coordinates"
    )
    is_crossed_out: bool = Field(default=False, description="True if visual strikethrough/cross-out was detected")
    is_margin_note: bool = Field(default=False, description="True if segment is in marginal area outside main content")


class UncertainRegion(BaseModel):
    """
    Specific region highlighted for human verification or secondary inspection.
    """
    text: str = Field(..., description="Ambiguous text or character")
    bbox: Optional[List[int]] = Field(default=None, description="Coordinates of uncertain region")
    reason: str = Field(..., description="Detailed rationale (e.g., severe scrawl, stroke overlap, smudge)")
    suggested_alternatives: List[str] = Field(
        default_factory=list, description="Possible readings or plausible interpretations"
    )


class ProcessingInfo(BaseModel):
    """
    Metadata recording execution path, enabled ablation components, and runtime metrics.
    """
    ocrUsed: bool = Field(default=True, description="Whether base OCR/HTR was executed")
    vlmUsed: bool = Field(default=False, description="Whether VLM visual inspection was executed")
    correctionUsed: bool = Field(default=False, description="Whether contextual LLM post-correction was applied")
    uncertaintyEngineUsed: bool = Field(default=True, description="Whether multi-evidence uncertainty logic was run")
    preprocessingApplied: List[str] = Field(
        default_factory=list, description="Ordered list of image preprocessors applied"
    )
    processingTimeMs: float = Field(default=0.0, description="Total pipeline execution duration in milliseconds")
    multiPassInfo: Optional[Dict[str, Any]] = Field(default=None, description="Multi-pass recognition candidate evaluation metadata")


class PipelineConfig(BaseModel):
    """
    Configuration flags to support full ablation studies (Phase 12)
    and runtime environment customization.
    """
    use_preprocessing: bool = Field(default=True, description="Toggle image enhancement and deskew")
    use_vlm: bool = Field(default=True, description="Toggle Vision-Language Model visual reasoning")
    use_correction: bool = Field(default=True, description="Toggle LLM contextual post-correction")
    use_uncertainty: bool = Field(default=True, description="Toggle uncertainty detection engine")
    vlm_model: str = Field(default="gemini-2.5-flash", description="Model name for VLM reasoning")
    debug_mode: bool = Field(default=False, description="Save intermediate visual and text artifacts for debugging")
    debug_output_dir: str = Field(default="debug_artifacts", description="Directory to store debug artifacts")


class PipelineResult(BaseModel):
    """
    Canonical output contract returned by process_handwriting(image_path).
    Directly consumable by Backend (Udhayan), Frontend (Shankar), and Eval (Vikash).
    """
    success: bool = Field(..., description="True if pipeline completed without fatal error")
    text: str = Field(..., description="Final clean, structured, editable transcribed text")
    segments: List[Segment] = Field(default_factory=list, description="Granular recognized segments")
    overallConfidence: float = Field(..., ge=0.0, le=1.0, description="Aggregated confidence score across valid text")
    uncertainRegions: List[UncertainRegion] = Field(
        default_factory=list, description="Regions requiring human-in-the-loop review"
    )
    marginNotes: List[Segment] = Field(
        default_factory=list, description="Extracted marginalia separated from main flow"
    )
    crossedOutText: List[Segment] = Field(
        default_factory=list, description="Segments detected as deleted/struck-through"
    )
    processingInfo: ProcessingInfo = Field(..., description="Execution tracing and ablation flags")
    rawOcrText: str = Field(..., description="Raw baseline OCR output preserved untouched for evaluation")
    vlmAnalysis: Optional[str] = Field(
        default=None, description="Visual observations and anomaly breakdown from VLM"
    )
    errorMessage: Optional[str] = Field(default=None, description="Error diagnostics if success is False")
