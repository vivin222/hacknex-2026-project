"""
Command-line interface for the CRY NOVA Handwriting Digitizing Stack.
Enables local testing, ablation studies, and evaluation benchmarking.
"""

import sys
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import argparse
import json
from src.pipeline import process_handwriting
from src.models import PipelineConfig


def main():
    parser = argparse.ArgumentParser(
        description="CRY NOVA: Extreme Bad-Handwriting Digitizing Stack (HNX26EPS04)"
    )
    parser.add_argument("image", type=str, help="Path to handwriting image file")
    parser.add_argument("--no-prep", action="store_true", help="Ablation: Disable preprocessing")
    parser.add_argument("--no-vlm", action="store_true", help="Ablation: Disable VLM visual reasoning")
    parser.add_argument("--no-corr", action="store_true", help="Ablation: Disable LLM post-correction")
    parser.add_argument("--no-unc", action="store_true", help="Ablation: Disable uncertainty engine")
    parser.add_argument("--debug", action="store_true", help="Enable debug mode and render visual artifacts")
    parser.add_argument("--json", action="store_true", help="Output full raw JSON")
    parser.add_argument("--out-dir", type=str, default="output", help="Directory to save output files")

    args = parser.parse_args()

    config = PipelineConfig(
        use_preprocessing=not args.no_prep,
        use_vlm=not args.no_vlm,
        use_correction=not args.no_corr,
        use_uncertainty=not args.no_unc,
        debug_mode=args.debug
    )

    image_path = Path(args.image)
    print(f"\n=======================================================")
    print(f"CRY NOVA HANDWRITING ENGINE -> {image_path.name}")
    print(f"=======================================================")
    print(f"Configurations:")
    print(f"  • Preprocessing : {'ENABLED' if config.use_preprocessing else 'DISABLED (Ablation)'}")
    print(f"  • VLM Reasoning : {'ENABLED' if config.use_vlm else 'DISABLED (Ablation)'}")
    print(f"  • Post-Correction: {'ENABLED' if config.use_correction else 'DISABLED (Ablation)'}")
    print(f"  • Uncertainty   : {'ENABLED' if config.use_uncertainty else 'DISABLED (Ablation)'}")
    print(f"  • Debug Artifact: {'ENABLED' if config.debug_mode else 'DISABLED'}")
    print("-------------------------------------------------------")

    result = process_handwriting(image_path, config)

    if not result.success:
        print(f"[ERROR] Pipeline execution failed: {result.errorMessage}")
        sys.exit(1)

    if args.json:
        print(result.model_dump_json(indent=2))
        return

    print("\n[FINAL EXTRACTED TEXT]:")
    print("-------------------------------------------------------")
    print(result.text if result.text else "[EMPTY TEXT]")
    print("-------------------------------------------------------")

    print(f"\n[KEY METRICS]:")
    print(f"  • Overall Confidence   : {result.overallConfidence * 100:.1f}%")
    print(f"  • Processing Latency   : {result.processingInfo.processingTimeMs:.1f} ms")
    print(f"  • Total Segments       : {len(result.segments)}")
    print(f"  • Uncertain Regions    : {len(result.uncertainRegions)}")
    print(f"  • Margin Notes         : {len(result.marginNotes)}")
    print(f"  • Crossed-Out Items    : {len(result.crossedOutText)}")

    if result.marginNotes:
        print("\n[MARGIN NOTES DETECTED]:")
        for m in result.marginNotes:
            print(f"  -> {m.text} (conf: {m.confidence:.2f})")

    if result.crossedOutText:
        print("\n[CROSSED-OUT TEXT DETECTED]:")
        for x in result.crossedOutText:
            print(f"  -> [DELETED] {x.text}")

    if result.uncertainRegions:
        print("\n[UNCERTAIN REGIONS FLAGGED FOR REVIEW]:")
        for u in result.uncertainRegions:
            print(f"  -> \"{u.text}\" | Reason: {u.reason}")

    # Save output JSON
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / f"{image_path.stem}_result.json"
    with open(out_file, "w", encoding="utf-8") as f:
        f.write(result.model_dump_json(indent=2))
    print(f"\n[OUTPUT] Saved canonical structured JSON to: {out_file}")


if __name__ == "__main__":
    main()
