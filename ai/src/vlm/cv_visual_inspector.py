"""
Computer Vision Visual Inspector for Local Stroke and Layout Analysis.
Detects physical strikethroughs (crossed-out text), margin notes, and blur/smudges.
Serves as local offline visual reasoning and complements multimodal VLM.
"""

from typing import List, Tuple, Dict, Any, Optional
import cv2
import numpy as np
from src.models import Segment, UncertainRegion


class CVVisualInspector:
    """
    Performs deterministic computer vision analysis directly on the original image
    to find physical strikethrough lines, marginal layout outliers, and ink smudges.
    """

    def __init__(self):
        pass

    @staticmethod
    def detect_crossed_out_segments(image: np.ndarray, segments: List[Segment]) -> List[Segment]:
        """
        Analyzes the pixel region of each segment to detect continuous horizontal
        or slanted pen strokes cutting through the vertical center of the text.
        """
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()

        h_img, w_img = gray.shape[:2]

        for seg in segments:
            if not seg.bbox:
                continue

            x1, y1, x2, y2 = seg.bbox
            # Clamp coordinates
            x1 = max(0, min(w_img - 1, x1))
            y1 = max(0, min(h_img - 1, y1))
            x2 = max(x1 + 1, min(w_img, x2))
            y2 = max(y1 + 1, min(h_img, y2))

            crop = gray[y1:y2, x1:x2]
            ch, cw = crop.shape[:2]

            if cw < 25 or ch < 12:
                continue

            # Invert crop so ink is white, background is black
            _, bin_crop = cv2.threshold(crop, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

            # Focus on the middle vertical band (35% to 65% height) where strikethroughs run
            mid_y1 = int(ch * 0.35)
            mid_y2 = int(ch * 0.65)
            mid_band = bin_crop[mid_y1:mid_y2, :]
            if mid_band.shape[0] < 3:
                continue

            # Strikethrough detection: Look for a continuous straight line that cuts across the word
            edges = cv2.Canny(mid_band, 50, 150)
            # Strikethrough must span at least 70% of the text width or be >= 90 pixels long
            min_strikethrough_len = max(90, int(cw * 0.70))
            lines = cv2.HoughLinesP(
                edges, 1, np.pi / 180,
                threshold=40,
                minLineLength=min_strikethrough_len,
                maxLineGap=8
            )

            has_strikethrough = False
            if lines is not None:
                for line in lines:
                    pts = line.reshape(-1)
                    if len(pts) >= 4:
                        lx1, ly1, lx2, ly2 = pts[0], pts[1], pts[2], pts[3]
                        dx = abs(lx2 - lx1)
                        dy = abs(ly2 - ly1)
                        # Line must be predominantly horizontal (slope < 0.25) and span a wide horizontal run
                        if dx >= min_strikethrough_len and dy < (dx * 0.25):
                            has_strikethrough = True
                            break

            if has_strikethrough:
                seg.is_crossed_out = True
                seg.uncertain = True
                seg.reason = "Visual strikethrough / cross-out stroke detected over text"

        return segments

    @staticmethod
    def detect_margin_notes(image: np.ndarray, segments: List[Segment]) -> List[Segment]:
        """
        Analyzes spatial coordinates relative to the central document flow.
        Segments located in the left margin or outlying horizontal positions are tagged as marginalia.
        """
        if len(segments) < 2:
            return segments

        img_w = image.shape[1] if len(image.shape) >= 2 else 1000

        # Compute left coordinate distribution of main text lines
        left_coords = [s.bbox[0] for s in segments if s.bbox and not s.is_crossed_out]
        if not left_coords:
            return segments

        # Median left indentation of body content
        median_left = np.median(left_coords)

        for seg in segments:
            if not seg.bbox:
                continue

            x1, y1, x2, y2 = seg.bbox
            width = x2 - x1

            # Condition 1: Positioned far into the left margin (e.g. left margin note)
            is_far_left = (x1 < median_left - 80) and (x1 < img_w * 0.25)
            # Condition 2: Explicit prefix marking margin notes like '*' or 'Note:'
            has_note_prefix = seg.text.strip().startswith(("*", "Note:", "NB:", "P.S."))

            if is_far_left or has_note_prefix:
                seg.is_margin_note = True

        return segments

    @staticmethod
    def inspect_visual_sharpness(image: np.ndarray, segments: List[Segment]) -> List[UncertainRegion]:
        """
        Measures ink stroke blurriness (Laplacian variance) and contrast degradation.
        Flags regions that suffer from severe visual degradation.
        """
        uncertain_regions: List[UncertainRegion] = []
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image

        for seg in segments:
            if not seg.bbox or seg.is_crossed_out:
                continue

            x1, y1, x2, y2 = seg.bbox
            crop = gray[y1:y2, x1:x2]
            if crop.size < 50:
                continue

            laplacian_var = cv2.Laplacian(crop, cv2.CV_64F).var()
            # Low variance indicates severe blur / faded ink
            if laplacian_var < 45.0:
                seg.uncertain = True
                seg.reason = seg.reason or "Faint or blurred ink strokes"
                uncertain_regions.append(
                    UncertainRegion(
                        text=seg.text,
                        bbox=seg.bbox,
                        reason=f"Severe stroke blur (Laplacian variance {laplacian_var:.1f})",
                        suggested_alternatives=[]
                    )
                )

        return uncertain_regions
