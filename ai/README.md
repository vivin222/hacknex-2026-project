# Team CRY NOVA — Extreme Bad-Handwriting Digitizing Stack
### Problem Statement: HNX26EPS04 (HackNex 2026)
**Track:** Computer Vision & AI Engineering  
**Lead AI/ML Engineer (Member 1):** Vivin

---

## 🚀 Overview

Standard OCR/HTR engines are trained on clean, orderly text and collapse on extreme, messy handwriting (doctor prescriptions, cramped margins, crossed-out text, and faded ink).

**CRY NOVA** solves this through a multi-stage cognitive pipeline:
```
BAD HANDWRITING IMAGE
        │
        ▼
[1. Modular Preprocessing] (Illumination norm, CLAHE contrast, bilateral denoise, deskew)
        │
        ▼
[2. OCR / HTR Engine] (RapidOCR ONNX Runtime - verbatim extraction, bboxes, model confidence)
        │
        ▼
[3. VLM Visual Reasoning] (Original visual pixel inspection: Visual Evidence > OCR Guess)
        │
        ▼
[4. Contextual Post-Correction] (Conservative correction, replacements, no hallucination)
        │
        ▼
[5. Multi-Signal Uncertainty Engine] (Triangulates model conf, visual conflict, blur, strikethrough)
        │
        ▼
[6. Structured Editable Text & Output Contract]
```

**Winning Story:**
> *"CRY NOVA does not blindly guess terrible handwriting. It combines handwriting recognition, visual reasoning, and contextual correction, then explicitly flags uncertain regions."*

---

## 🛠️ Installation & Setup

### 1. Requirements
* Python 3.10 to 3.13
* Windows 10/11, Linux, or macOS

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Add your Gemini API key (optional for VLM/LLM cloud enhancement; pipeline runs offline via local CV heuristics if unset):
```env
GEMINI_API_KEY=your_api_key_here
```

---

## 💻 Quickstart (CLI)

Run the pipeline on any image:
```bash
python run_pipeline.py tests/samples/sample_doctor_prescription.png --debug
```

Output formatted JSON directly to stdout:
```bash
python run_pipeline.py tests/samples/sample_messy_scrawl.png --json
```

---

## 🔬 Ablation Experiments (For Vikash)

Vikash can toggle each pipeline stage via CLI flags to demonstrate the contribution of each component:

1. **OCR Only (Baseline):**
   ```bash
   python run_pipeline.py <image_path> --no-prep --no-vlm --no-corr --no-unc
   ```
2. **OCR + LLM:**
   ```bash
   python run_pipeline.py <image_path> --no-vlm --no-unc
   ```
3. **OCR + VLM:**
   ```bash
   python run_pipeline.py <image_path> --no-corr --no-unc
   ```
4. **OCR + VLM + LLM:**
   ```bash
   python run_pipeline.py <image_path> --no-unc
   ```
5. **Full CRY NOVA Pipeline (with Multi-Signal Uncertainty):**
   ```bash
   python run_pipeline.py <image_path> --debug
   ```

To run the automated 12-sample benchmark suite:
```bash
python tests/test_benchmark_suite.py
```
This generates `output/EVALUATION_REPORT.md` and detailed per-sample evaluation JSONs in `output/eval_results/`.

---

## 🔌 Team Integration Guide

### 1. For Udhayan (Backend / API Integration)
Import `process_handwriting` directly into your FastAPI/Flask route:

```python
from pathlib import Path
from src.pipeline import process_handwriting
from src.models import PipelineConfig

# In your API endpoint:
@app.post("/api/digitize")
async def digitize_handwriting(file: UploadFile):
    temp_path = save_upload(file)
    
    # Process image
    result = process_handwriting(temp_path, PipelineConfig(debug_mode=True))
    
    # Return structured dict or Pydantic JSON
    return result.model_dump()
```

### 2. For Shankar (Frontend UI Integration)
The API returns the following JSON structure:
```json
{
  "success": true,
  "text": "CITY GENERAL HOSPITAL - PRESCRIPTION\nDiag: Acute pharyngitis with fever\n500 mg BD...",
  "overallConfidence": 0.872,
  "segments": [
    {
      "text": "Diag: Acute pharyngitis with fever",
      "confidence": 0.94,
      "uncertain": false,
      "reason": null,
      "bbox": [232, 248, 685, 280],
      "is_crossed_out": false,
      "is_margin_note": false
    }
  ],
  "uncertainRegions": [
    {
      "text": "Paracetamol 650mg TDS [?] 3 days",
      "bbox": [231, 335, 794, 372],
      "reason": "Visual discrepancy: OCR glyph ambiguity",
      "suggested_alternatives": ["x 3 days"]
    }
  ],
  "marginNotes": [
    {
      "text": "* Note: Check CBC if fever persists",
      "confidence": 0.88,
      "bbox": [40, 368, 223, 438]
    }
  ],
  "crossedOutText": [
    {
      "text": "250mg OD",
      "confidence": 0.35,
      "reason": "Physical pen strikethrough detected"
    }
  ],
  "rawOcrText": "...",
  "processingInfo": {
    "ocrUsed": true,
    "vlmUsed": true,
    "correctionUsed": true,
    "uncertaintyEngineUsed": true,
    "preprocessingApplied": ["smart_resize", "normalize_illumination", "clahe_contrast_enhancement", "bilateral_denoise"],
    "processingTimeMs": 3161.1
  }
}
```

UI Highlights:
* Render `result.text` in the main editable text box.
* Highlight `result.uncertainRegions` in orange with hover tooltips displaying the `reason`.
* Render `result.marginNotes` in a dedicated **"Margin Notes"** side panel.
* Render `result.crossedOutText` in a **"Deleted / Struck-Through"** review badge.
* Display `debug_artifacts/<image_stem>_annotated.png` in the visual verification tab!

### 3. For Vikash (Evaluation & Baseline Benchmark)
* `result.rawOcrText`: Untouched raw baseline OCR (for Character Error Rate / Word Error Rate comparisons).
* `result.text`: CRY NOVA final corrected output.
* `result.uncertainRegions`: True positive / False positive analysis of illegible text detection.
* `EVALUATION_REPORT.md`: Comprehensive breakdown across all benchmark categories.

---

## 🔒 Security
* No API keys or credentials committed to the repository.
* All secrets are configured strictly through `.env` and excluded via `.gitignore`.
