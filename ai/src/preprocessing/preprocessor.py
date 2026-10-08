"""
Modular Image Preprocessor for Handwriting and Document Enhancement.
Preserves the original image while producing optimized inputs for HTR/OCR.
"""

from typing import Tuple, List, Dict, Optional, Union
from pathlib import Path
import cv2
import numpy as np


class ImagePreprocessor:
    """
    Applies selective, modular image enhancement operations to improve
    character contrast, eliminate shadows, correct page tilt, and reduce paper grain.
    """

    def __init__(self):
        pass

    @staticmethod
    def load_image(image_input: Union[str, Path, np.ndarray]) -> np.ndarray:
        """Loads image safely from path or validates existing numpy array."""
        if isinstance(image_input, (str, Path)):
            path = Path(image_input)
            if not path.exists():
                raise FileNotFoundError(f"Image not found at path: {path}")
            # cv2.imread on Windows handles UTF-8 paths poorly; use imdecode
            with open(path, "rb") as f:
                file_bytes = np.frombuffer(f.read(), dtype=np.uint8)
            img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
            if img is None:
                raise ValueError(f"Failed to decode image at path: {path}")
            return img
        elif isinstance(image_input, np.ndarray):
            return image_input.copy()
        else:
            raise TypeError(f"Unsupported image input type: {type(image_input)}")

    @staticmethod
    def smart_resize(img: np.ndarray, min_dim: int = 900, max_dim: int = 1600) -> Tuple[np.ndarray, float]:
        """
        Scales low-resolution handwriting to improve stroke visibility,
        and scales down oversized captures to optimize latency and memory.
        Returns resized image and the scale factor applied.
        """
        h, w = img.shape[:2]
        shortest = min(h, w)
        longest = max(h, w)

        scale = 1.0
        if shortest < min_dim:
            scale = min_dim / float(shortest)
        elif longest > max_dim:
            scale = max_dim / float(longest)

        if abs(scale - 1.0) > 0.05:
            new_w = int(w * scale)
            new_h = int(h * scale)
            interp = cv2.INTER_CUBIC if scale > 1.0 else cv2.INTER_AREA
            resized = cv2.resize(img, (new_w, new_h), interpolation=interp)
            return resized, scale
        return img, 1.0

    @staticmethod
    def normalize_illumination(img: np.ndarray) -> np.ndarray:
        """
        Removes uneven page lighting, mobile camera shadows, and gradients
        using morphological background approximation.
        """
        if len(img.shape) == 3:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        else:
            gray = img.copy()

        # Large morphological kernel to estimate background illumination
        kernel_size = max(25, int(min(gray.shape) / 30) | 1)
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (kernel_size, kernel_size))
        background = cv2.morphologyEx(gray, cv2.MORPH_DILATE, kernel)
        background = cv2.medianBlur(background, 21)

        # Normalize gray image by estimated background
        norm = np.clip((gray.astype(np.float32) / (background.astype(np.float32) + 1e-5)) * 255.0, 0, 255).astype(np.uint8)
        return norm

    @staticmethod
    def enhance_contrast_clahe(img: np.ndarray, clip_limit: float = 2.0, tile_size: int = 8) -> np.ndarray:
        """
        Contrast Limited Adaptive Histogram Equalization (CLAHE).
        Enhances faint ballpoint pen strokes and pencil scrawls without blowing out noise.
        """
        if len(img.shape) == 3:
            img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=(tile_size, tile_size))
        return clahe.apply(img)

    @staticmethod
    def denoise_bilateral(img: np.ndarray, d: int = 5, sigma_color: float = 40.0, sigma_space: float = 40.0) -> np.ndarray:
        """
        Bilateral filtering smooths scanner/sensor noise and paper texture
        while strictly preserving high-frequency handwriting stroke boundaries.
        """
        return cv2.bilateralFilter(img, d=d, sigmaColor=sigma_color, sigmaSpace=sigma_space)

    @staticmethod
    def estimate_and_deskew(img: np.ndarray, max_angle: float = 30.0) -> Tuple[np.ndarray, float]:
        """
        Estimates skew angle via text contour orientations and straightens lines.
        Only applies correction if skew is between 0.8 and max_angle degrees.
        """
        if len(img.shape) == 3:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        else:
            gray = img

        # Detect high-contrast stroke edges
        edges = cv2.Canny(gray, 50, 150, apertureSize=3)
        lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=100, minLineLength=80, maxLineGap=10)

        if lines is None or len(lines) < 4:
            return img, 0.0

        angles = []
        for line in lines:
            pts = line.reshape(-1)
            if len(pts) >= 4:
                x1, y1, x2, y2 = pts[0], pts[1], pts[2], pts[3]
                if x2 != x1:
                    angle = np.degrees(np.arctan2(y2 - y1, x2 - x1))
                    # Only keep near-horizontal text lines
                    if -max_angle <= angle <= max_angle:
                        angles.append(angle)

        if not angles:
            return img, 0.0

        median_angle = float(np.median(angles))
        if abs(median_angle) < 0.7:
            return img, 0.0  # Angle too small to bother rotating

        # Rotate around image center
        h, w = img.shape[:2]
        center = (w // 2, h // 2)
        rot_mat = cv2.getRotationMatrix2D(center, median_angle, 1.0)
        deskewed = cv2.warpAffine(img, rot_mat, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        return deskewed, median_angle

    def process(
        self,
        image_input: Union[str, Path, np.ndarray],
        enabled_ops: Optional[List[str]] = None,
        store_artifacts: bool = False
    ) -> Tuple[np.ndarray, np.ndarray, List[str], Dict[str, np.ndarray]]:
        """
        Executes the selective preprocessing chain.

        Returns:
            original_image: Preserved untouched RGB/BGR image for VLM.
            preprocessed_image: Enhanced image for OCR/HTR engine.
            applied_operations: List of operation names actually applied.
            debug_artifacts: Dictionary mapping step names to intermediate visual arrays.
        """
        original = self.load_image(image_input)
        debug_artifacts: Dict[str, np.ndarray] = {"0_original": original.copy()} if store_artifacts else {}
        applied_ops: List[str] = []

        if enabled_ops is None:
            # Default production sequence tailored for messy handwriting
            enabled_ops = ["smart_resize", "illumination_norm", "clahe", "bilateral_denoise", "deskew"]

        current = original.copy()

        # Step 1: Smart Resize
        if "smart_resize" in enabled_ops:
            current, scale = self.smart_resize(current)
            if scale != 1.0:
                applied_ops.append(f"smart_resize(scale={scale:.2f})")
                if store_artifacts:
                    debug_artifacts["1_resized"] = current.copy()

        # Step 2: Illumination Normalization
        if "illumination_norm" in enabled_ops:
            current = self.normalize_illumination(current)
            applied_ops.append("normalize_illumination")
            if store_artifacts:
                debug_artifacts["2_illum_norm"] = current.copy()
        elif len(current.shape) == 3:
            current = cv2.cvtColor(current, cv2.COLOR_BGR2GRAY)

        # Step 3: Contrast Enhancement (CLAHE)
        if "clahe" in enabled_ops:
            current = self.enhance_contrast_clahe(current)
            applied_ops.append("clahe_contrast_enhancement")
            if store_artifacts:
                debug_artifacts["3_clahe"] = current.copy()

        # Step 4: Bilateral Denoising
        if "bilateral_denoise" in enabled_ops:
            current = self.denoise_bilateral(current)
            applied_ops.append("bilateral_denoise")
            if store_artifacts:
                debug_artifacts["4_denoised"] = current.copy()

        # Step 5: Deskew
        if "deskew" in enabled_ops:
            current, angle = self.estimate_and_deskew(current)
            if abs(angle) >= 0.7:
                applied_ops.append(f"deskew(angle={angle:.1f}deg)")
                if store_artifacts:
                    debug_artifacts["5_deskewed"] = current.copy()

        if store_artifacts:
            debug_artifacts["final_preprocessed"] = current.copy()
        return original, current, applied_ops, debug_artifacts

    @staticmethod
    def sharpen(img: np.ndarray, amount: float = 1.2) -> np.ndarray:
        """
        Unsharp masking filter to crispen faint cursive strokes.
        """
        if len(img.shape) == 3:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        else:
            gray = img
        blurred = cv2.GaussianBlur(gray, (0, 0), 2.0)
        sharpened = cv2.addWeighted(gray, 1.0 + amount, blurred, -amount, 0)
        return sharpened

    @staticmethod
    def adaptive_threshold(img: np.ndarray) -> np.ndarray:
        """
        Gaussian adaptive thresholding to separate ink strokes from textured or stained paper.
        """
        if len(img.shape) == 3:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        else:
            gray = img
        return cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 21, 10
        )

    def generate_variants(self, base_preprocessed: np.ndarray) -> Dict[str, np.ndarray]:
        """
        Generates candidate preprocessing variants for multi-pass OCR comparison.
        Kept lean to minimize RAM overhead on low-memory environments.
        """
        return {
            "standard_enhanced": base_preprocessed,
            "sharpened_contrast": self.sharpen(base_preprocessed, amount=1.2),
        }

