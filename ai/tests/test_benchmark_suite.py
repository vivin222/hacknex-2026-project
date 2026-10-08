"""
Automated Evaluation Suite for Team CRY NOVA (HackNex 2026).
Runs all 10 required handwriting categories, verifies schema conformity,
records Raw OCR baseline vs CRY NOVA output, and generates evaluation report for Vikash.
"""

import sys
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import json
import time
from src.pipeline import process_handwriting
from src.models import PipelineConfig, PipelineResult


def run_full_evaluation():
    samples_dir = PROJECT_ROOT / "tests" / "samples"
    output_dir = PROJECT_ROOT / "output" / "eval_results"
    output_dir.mkdir(parents=True, exist_ok=True)

    image_files = sorted(list(samples_dir.glob("*.png")))
    if not image_files:
        print(f"[ERROR] No benchmark samples found in {samples_dir}")
        return

    print("================================================================================")
    print("           TEAM CRY NOVA — BENCHMARK EVALUATION TEST SUITE (10 CATEGORIES)       ")
    print("================================================================================")
    print(f"Discovered {len(image_files)} benchmark images in {samples_dir}\n")

    summary_records = []
    config = PipelineConfig(debug_mode=True)

    for idx, img_path in enumerate(image_files, 1):
        print(f"[{idx:02d}/{len(image_files):02d}] Evaluating: {img_path.name} ...")
        t0 = time.perf_counter()

        result = process_handwriting(img_path, config)
        runtime = (time.perf_counter() - t0) * 1000

        # Assert schema validity
        assert isinstance(result, PipelineResult), "Output must conform to PipelineResult schema"
        assert result.success is True, f"Pipeline failed on {img_path.name}: {result.errorMessage}"
        assert isinstance(result.rawOcrText, str), "rawOcrText must be string"
        assert isinstance(result.overallConfidence, float), "overallConfidence must be float"

        # Compare baseline vs final
        raw_char_count = len(result.rawOcrText)
        final_char_count = len(result.text)

        summary_records.append({
            "sample": img_path.name,
            "success": result.success,
            "overall_confidence": round(result.overallConfidence, 4),
            "latency_ms": round(result.processingInfo.processingTimeMs, 1),
            "total_segments": len(result.segments),
            "uncertain_regions": len(result.uncertainRegions),
            "margin_notes": len(result.marginNotes),
            "crossed_out": len(result.crossedOutText),
            "raw_ocr_length": raw_char_count,
            "final_text_length": final_char_count,
            "applied_preprocessing": result.processingInfo.preprocessingApplied
        })

        # Save individual result for Vikash
        sample_out = output_dir / f"{img_path.stem}_eval.json"
        with open(sample_out, "w", encoding="utf-8") as f:
            f.write(result.model_dump_json(indent=2))

        print(f"       -> Conf: {result.overallConfidence * 100:.1f}% | Latency: {runtime:.1f}ms | "
              f"Uncertain: {len(result.uncertainRegions)} | Margins: {len(result.marginNotes)} | Struck: {len(result.crossedOutText)}")

    # Generate Markdown Summary Report for Vikash and Team
    report_path = PROJECT_ROOT / "output" / "EVALUATION_REPORT.md"
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("# CRY NOVA — Handwriting Engine Benchmark Evaluation\n\n")
        f.write("### HackNex 2026 — Problem HNX26EPS04\n\n")
        f.write("| Sample Category | Confidence | Latency | Segments | Uncertain | Margins | Struck-out | Status |\n")
        f.write("|---|---|---|---|---|---|---|---|\n")
        for r in summary_records:
            f.write(
                f"| `{r['sample']}` | {r['overall_confidence']*100:.1f}% | {r['latency_ms']}ms | "
                f"{r['total_segments']} | {r['uncertain_regions']} | {r['margin_notes']} | {r['crossed_out']} | PASS |\n"
            )

        f.write("\n\n## Ablation & Baseline Instructions for Vikash\n")
        f.write("1. **Baseline Raw OCR**: Stored untouched in each JSON under `.rawOcrText`\n")
        f.write("2. **CRY NOVA Final Output**: Available under `.text`\n")
        f.write("3. **Uncertainty Flagging**: Available under `.uncertainRegions`\n")
        f.write("4. **Crossed-out Items**: Isolated under `.crossedOutText`\n")
        f.write("5. **Margin Notes**: Isolated under `.marginNotes`\n")

    print("\n================================================================================")
    print(f"EVALUATION COMPLETE: All {len(summary_records)} samples passed schema and execution tests!")
    print(f"Report saved to: {report_path}")
    print("================================================================================")


if __name__ == "__main__":
    run_full_evaluation()
