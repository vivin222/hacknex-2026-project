"""
Core Pipeline Orchestrator for CRY NOVA Extreme Bad-Handwriting Digitizing Stack.
Provides the stable entry point process_handwriting(image_path) with full ablation support.
"""

from typing import Union, Optional, Dict, Any, List
from pathlib import Path
import time
import json
import cv2
import numpy as np

from src.models import (
    PipelineResult,
    PipelineConfig,
    Segment,
    UncertainRegion,
    ProcessingInfo
)
from src.preprocessing.preprocessor import ImagePreprocessor
from src.ocr.htr_engine import HTREngine
from src.vlm.visual_reasoner import VisualReasoner
from src.correction.post_corrector import PostCorrector
from src.uncertainty.uncertainty_engine import UncertaintyEngine
from src.config import DEBUG_ARTIFACTS_DIR


class HandwritingPipeline:
    """
    Modular, ablation-ready pipeline orchestrator.
    Combines preprocessing, HTR, VLM visual reasoning, LLM post-correction,
    and multi-signal uncertainty detection.
    """

    def __init__(self):
        self.preprocessor = ImagePreprocessor()
        self.htr_engine = HTREngine()
        self.visual_reasoner = VisualReasoner()
        self.post_corrector = PostCorrector()
        self.uncertainty_engine = UncertaintyEngine()

    def _render_debug_visualization(
        self,
        original_img: np.ndarray,
        segments: List[Segment],
        output_path: Path
    ):
        """
        Renders bounding boxes color-coded by status:
        Green = confident, Yellow/Orange = uncertain, Red = crossed-out, Cyan = margin note.
        """
        vis = original_img.copy()
        if len(vis.shape) == 2:
            vis = cv2.cvtColor(vis, cv2.COLOR_GRAY2BGR)

        for s in segments:
            if not s.bbox:
                continue
            x1, y1, x2, y2 = s.bbox

            if s.is_crossed_out:
                color = (0, 0, 220)  # Red for struck-out
                label = f"[X] {s.text[:15]}"
            elif s.is_margin_note:
                color = (220, 180, 0)  # Cyan for margin note
                label = f"[M] {s.text[:15]}"
            elif s.uncertain:
                color = (0, 140, 255)  # Orange for uncertain
                label = f"[?] {s.text[:15]} ({s.confidence:.2f})"
            else:
                color = (0, 200, 0)  # Green for confident
                label = f"{s.text[:15]} ({s.confidence:.2f})"

            # Draw bbox
            cv2.rectangle(vis, (x1, y1), (x2, y2), color, 2)
            # Draw label banner
            cv2.putText(
                vis, label, (x1, max(15, y1 - 6)),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, color, 1, cv2.LINE_AA
            )

        output_path.parent.mkdir(parents=True, exist_ok=True)
        cv2.imwrite(str(output_path), vis)

    def process(
        self,
        image_path: Union[str, Path],
        config: Optional[PipelineConfig] = None
    ) -> PipelineResult:
        """
        Executes the handwriting digitizing pipeline with full ablation controls.
        """
        t0 = time.perf_counter()
        config = config or PipelineConfig()
        image_path = Path(image_path)

        if not image_path.exists():
            return PipelineResult(
                success=False,
                text="",
                segments=[],
                overallConfidence=0.0,
                uncertainRegions=[],
                marginNotes=[],
                crossedOutText=[],
                processingInfo=ProcessingInfo(
                    ocrUsed=False, vlmUsed=False, correctionUsed=False, uncertaintyEngineUsed=False
                ),
                rawOcrText="",
                vlmAnalysis=None,
                errorMessage=f"File not found: {image_path}"
            )

        # ---------------------------------------------------------
        # STAGE 1: IMAGE PREPROCESSING
        # ---------------------------------------------------------
        applied_filters: List[str] = []
        debug_artifacts: Dict[str, np.ndarray] = {}

        if config.use_preprocessing:
            original_img, ocr_input_img, applied_filters, debug_artifacts = self.preprocessor.process(image_path)
        else:
            original_img = self.preprocessor.load_image(image_path)
            ocr_input_img = original_img.copy()
            applied_filters = ["preprocessing_bypassed_ablation"]

        # ---------------------------------------------------------
        # ---------------------------------------------------------
        # STAGE 2: OCR / HTR RECOGNITION (MULTI-PASS STRATEGY)
        # ---------------------------------------------------------
        variants = self.preprocessor.generate_variants(ocr_input_img) if config.use_preprocessing else {}
        raw_ocr_text, segments, initial_conf, multi_pass_info = self.htr_engine.recognize_multi_pass(
            ocr_input_img, variants
        )

        # ---------------------------------------------------------
        # STAGE 3: VLM VISUAL REASONING (VISUAL EVIDENCE > OCR GUESS)
        # ---------------------------------------------------------
        vlm_data: Dict[str, Any] = {}
        if config.use_vlm:
            vlm_data, segments = self.visual_reasoner.reason(original_img, segments, raw_ocr_text)
        else:
            vlm_data = {"visual_observations": "VLM stage bypassed by ablation configuration"}

        # ---------------------------------------------------------
        # STAGE 4: CONTEXTUAL LLM POST-CORRECTION
        # ---------------------------------------------------------
        corrections_applied: List[Dict[str, Any]] = []
        if config.use_correction:
            final_text, corrections_applied = self.post_corrector.correct(raw_ocr_text, vlm_data, segments)
        else:
            final_text = raw_ocr_text

        # ---------------------------------------------------------
        # STAGE 5: UNCERTAINTY DETECTION ENGINE
        # ---------------------------------------------------------
        uncertain_regions: List[UncertainRegion] = []
        overall_conf = initial_conf

        if config.use_uncertainty:
            segments, uncertain_regions, overall_conf = self.uncertainty_engine.evaluate(
                segments, vlm_data, corrections_applied, final_text
            )
        else:
            overall_conf = initial_conf

        # Separate margin notes and crossed-out text for dedicated UI cards / review
        margin_notes = [s for s in segments if s.is_margin_note]
        crossed_out = [s for s in segments if s.is_crossed_out]

        # ---------------------------------------------------------
        # STAGE 6: DEBUG ARTIFACT GENERATION
        # ---------------------------------------------------------
        elapsed_ms = round((time.perf_counter() - t0) * 1000.0, 2)

        if config.debug_mode:
            debug_dir = Path(config.debug_output_dir)
            debug_vis_path = debug_dir / f"{image_path.stem}_annotated.png"
            self._render_debug_visualization(original_img, segments, debug_vis_path)

            # Save full debug trace json
            debug_trace = {
                "image": str(image_path),
                "runtime_ms": elapsed_ms,
                "applied_filters": applied_filters,
                "raw_ocr": raw_ocr_text,
                "vlm_data": vlm_data,
                "corrections": corrections_applied,
                "final_text": final_text,
                "uncertainty_count": len(uncertain_regions)
            }
            with open(debug_dir / f"{image_path.stem}_trace.json", "w", encoding="utf-8") as f:
                json.dump(debug_trace, f, indent=2)

        # ---------------------------------------------------------
        # CONSTRUCT CANONICAL RESULT
        # ---------------------------------------------------------
        return PipelineResult(
            success=True,
            text=final_text,
            segments=segments,
            overallConfidence=overall_conf,
            uncertainRegions=uncertain_regions,
            marginNotes=margin_notes,
            crossedOutText=crossed_out,
            processingInfo=ProcessingInfo(
                ocrUsed=True,
                vlmUsed=config.use_vlm,
                correctionUsed=config.use_correction,
                uncertaintyEngineUsed=config.use_uncertainty,
                preprocessingApplied=applied_filters,
                processingTimeMs=elapsed_ms,
                multiPassInfo=multi_pass_info
            ),
            rawOcrText=raw_ocr_text,
            vlmAnalysis=vlm_data.get("visual_observations"),
            errorMessage=None
        )


# Singleton instance
_pipeline_instance: Optional[HandwritingPipeline] = None


def get_pipeline() -> HandwritingPipeline:
    """Returns singleton HandwritingPipeline instance."""
    global _pipeline_instance
    if _pipeline_instance is None:
        _pipeline_instance = HandwritingPipeline()
    return _pipeline_instance


def process_handwriting(
    image_path: Union[str, Path],
    config: Optional[PipelineConfig] = None
) -> PipelineResult:
    """
    Canonical service entry point for Backend (Udhayan), Frontend (Shankar),
    and Benchmark Evaluation (Vikash).
    """
    pipeline = get_pipeline()
    return pipeline.process(image_path, config)
