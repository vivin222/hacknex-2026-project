"""
Phase 1 MVP Test Runner:
IMAGE -> PREPROCESS -> OCR/HTR -> TEXT
Validates raw OCR output and confidence extraction.
"""

import sys
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import json
from src.preprocessing.preprocessor import ImagePreprocessor
from src.ocr.htr_engine import HTREngine


def run_mvp(image_path: str, output_dir: str = "output"):
    image_path = Path(image_path)
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"\n==========================================")
    print(f"RUNNING MVP PIPELINE ON: {image_path.name}")
    print(f"==========================================")

    # 1. Modular Preprocessing
    preprocessor = ImagePreprocessor()
    original, preprocessed, applied_ops, debug_artifacts = preprocessor.process(image_path)
    print(f"[PREPROCESS] Applied filters: {applied_ops}")

    # 2. OCR / HTR Engine
    htr = HTREngine()
    raw_text, segments, avg_conf = htr.recognize(preprocessed)

    print(f"\n[OCR EXTRACTED TEXT]:")
    print("------------------------------------------")
    print(raw_text if raw_text else "[NO TEXT DETECTED]")
    print("------------------------------------------")
    print(f"[METRICS] Segments Detected: {len(segments)}")
    print(f"[METRICS] Average Confidence: {avg_conf:.4f}")

    # Save raw OCR result separately as specified in Phase 1 & Phase 13
    raw_result_data = {
        "image_file": image_path.name,
        "raw_text": raw_text,
        "average_confidence": avg_conf,
        "segments": [
            {
                "text": s.text,
                "confidence": s.confidence,
                "bbox": s.bbox,
                "uncertain": s.uncertain
            }
            for s in segments
        ],
        "preprocessing_applied": applied_ops
    }

    out_json = output_dir / f"{image_path.stem}_raw_ocr.json"
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(raw_result_data, f, indent=2)

    print(f"[OUTPUT] Saved raw baseline OCR to: {out_json}")
    return raw_result_data


if __name__ == "__main__":
    sample_file = "tests/samples/sample_doctor_prescription.png"
    run_mvp(sample_file)
