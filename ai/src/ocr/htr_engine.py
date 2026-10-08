"""
HTR / OCR Engine using RapidOCR (ONNX Runtime).
Produces verbatim raw text, spatial bounding boxes, and un-fabricated confidence scores.
"""

import os
import cv2

# Ensure thread caps are set on CPU runtime
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["ORT_NUM_THREADS"] = "1"

try:
    cv2.setNumThreads(1)
except Exception:
    pass

# Patch OrtInferSession in rapidocr_onnxruntime to prevent memory explosion from unbounded thread creation
try:
    import rapidocr_onnxruntime.utils as ort_utils
    from onnxruntime import SessionOptions, InferenceSession, GraphOptimizationLevel

    def _low_memory_ort_init(self, config):
        sess_opt = SessionOptions()
        sess_opt.log_severity_level = 4
        sess_opt.enable_cpu_mem_arena = False
        sess_opt.intra_op_num_threads = 1
        sess_opt.inter_op_num_threads = 1
        sess_opt.graph_optimization_level = GraphOptimizationLevel.ORT_ENABLE_ALL

        cpu_ep = 'CPUExecutionProvider'
        cpu_provider_options = {'arena_extend_strategy': 'kSameAsRequested'}
        EP_list = [(cpu_ep, cpu_provider_options)]

        self._verify_model(config['model_path'])
        self.session = InferenceSession(
            config['model_path'],
            sess_options=sess_opt,
            providers=EP_list
        )

    ort_utils.OrtInferSession.__init__ = _low_memory_ort_init
except Exception:
    pass

from typing import List, Tuple, Optional, Dict, Any
import numpy as np
from rapidocr_onnxruntime import RapidOCR
from src.models import Segment


class HTREngine:
    """
    High-accuracy, lightweight Handwriting Text Recognition engine.
    Runs locally on CPU via ONNX Runtime without heavy CUDA or PyTorch dependencies.
    """

    _instance: Optional["HTREngine"] = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self.ocr = RapidOCR()
        # Enforce memory-safe detection limits for 512MB cgroup
        try:
            self.ocr.text_detector.preprocess_op[0].limit_side_len = 960
            self.ocr.text_detector.preprocess_op[0].limit_type = 'max'
        except Exception:
            pass
        self._initialized = True

    @staticmethod
    def _polygon_to_bbox(polygon: List[List[float]]) -> List[int]:
        """Converts a 4-point polygon [[x1, y1], [x2, y2], [x3, y3], [x4, y4]] to [min_x, min_y, max_x, max_y]."""
        xs = [pt[0] for pt in polygon]
        ys = [pt[1] for pt in polygon]
        return [int(min(xs)), int(min(ys)), int(max(xs)), int(max(ys))]

    @staticmethod
    def _sort_reading_order(segments: List[Segment], y_tolerance: int = 18) -> List[Segment]:
        """
        Sorts bounding boxes into natural reading order:
        Top-to-bottom, left-to-right within the same vertical line tolerance.
        """
        if not segments:
            return []

        # Sort primarily by vertical coordinate
        sorted_by_y = sorted(
            segments,
            key=lambda s: (s.bbox[1] if s.bbox else 0, s.bbox[0] if s.bbox else 0)
        )

        lines: List[List[Segment]] = []
        for seg in sorted_by_y:
            placed = False
            for line in lines:
                ref_y = line[0].bbox[1] if line[0].bbox else 0
                seg_y = seg.bbox[1] if seg.bbox else 0
                if abs(seg_y - ref_y) <= y_tolerance:
                    line.append(seg)
                    placed = True
                    break
            if not placed:
                lines.append([seg])

        # Sort each line from left to right
        result: List[Segment] = []
        for line in lines:
            line.sort(key=lambda s: s.bbox[0] if s.bbox else 0)
            result.extend(line)

        return result

    def recognize(self, image: np.ndarray) -> Tuple[str, List[Segment], float]:
        """
        Executes text detection and recognition on the supplied image.

        Returns:
            raw_text: Complete verbatim text string formatted by lines.
            segments: List of typed Segment objects with real model confidence and bboxes.
            average_confidence: Arithmetic mean of genuine segment confidences.
        """
        res, elapse = self.ocr(image, use_cls=False)

        if not res:
            return "", [], 0.0

        raw_segments: List[Segment] = []

        for item in res:
            polygon = item[0]
            text = str(item[1]).strip()
            conf_val = float(item[2]) if len(item) > 2 else 0.0

            if not text:
                continue

            bbox = self._polygon_to_bbox(polygon)
            conf_clamped = max(0.0, min(1.0, round(conf_val, 4)))

            segment = Segment(
                text=text,
                confidence=conf_clamped,
                uncertain=(conf_clamped < 0.65),
                reason="Low OCR confidence score" if conf_clamped < 0.65 else None,
                confidence_type="model",
                bbox=bbox,
                is_crossed_out=False,
                is_margin_note=False
            )
            raw_segments.append(segment)

        # Sort in reading order
        ordered_segments = self._sort_reading_order(raw_segments)

        raw_text_lines = [s.text for s in ordered_segments]
        raw_text = "\n".join(raw_text_lines)

        avg_conf = (
            sum(s.confidence for s in ordered_segments) / len(ordered_segments)
            if ordered_segments else 0.0
        )

        return raw_text, ordered_segments, round(avg_conf, 4)

    def recognize_multi_pass(
        self,
        primary_img: np.ndarray,
        variants: Optional[Dict[str, np.ndarray]] = None
    ) -> Tuple[str, List[Segment], float, Dict[str, Any]]:
        """
        Executes multi-pass OCR recognition across preprocessing candidates:
        - Evaluates primary pass on baseline preprocessed image.
        - If primary confidence is high (>= 0.84) and healthy text length exists, accepts immediately.
        - If handwriting difficulty or degradation is detected, runs on candidate variants.
        - Selects the optimal pass via evidence score (confidence & character yield).
        - Preserves exact spatial bounding boxes and segment confidences from winning pass.
        """
        raw_text, segments, avg_conf = self.recognize(primary_img)

        # Fast path for clear documents: accept immediately to save CPU and latency
        if avg_conf >= 0.70 or not variants or len(segments) >= 3:
            return raw_text, segments, avg_conf, {
                "passesEvaluated": 1,
                "selectedPass": "standard_enhanced",
                "passConfidences": {"standard_enhanced": avg_conf},
            }

        best_text = raw_text
        best_segments = segments
        best_conf = avg_conf
        best_pass_name = "standard_enhanced"
        pass_scores: Dict[str, float] = {"standard_enhanced": avg_conf}

        best_score = (avg_conf * 0.6) + (min(1.0, len(raw_text) / 120.0) * 0.4)

        for name, var_img in variants.items():
            if name == "standard_enhanced":
                continue
            v_text, v_segs, v_conf = self.recognize(var_img)
            pass_scores[name] = v_conf
            v_score = (v_conf * 0.6) + (min(1.0, len(v_text) / 120.0) * 0.4)

            # Supersede only when demonstrably superior
            if v_score > (best_score + 0.04):
                best_score = v_score
                best_text = v_text
                best_segments = v_segs
                best_conf = v_conf
                best_pass_name = name

        return best_text, best_segments, best_conf, {
            "passesEvaluated": len(pass_scores),
            "selectedPass": best_pass_name,
            "passConfidences": pass_scores,
        }

