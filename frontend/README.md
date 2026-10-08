# CRY NOVA — Frontend UI Stack (HNX26EPS04)

**Project:** Extreme Bad-Handwriting Digitizing Stack  
**Team:** CRY NOVA  
**Team Member:** Member 2 — Vikash (Frontend / UI Engineer)  
**Status:** LAP 3 / LAP 4 — Frontend Integration & Verification  
**Repository Branch:** `vikash-frontend`

---

## 1. Overview

This is the interactive frontend application for team **CRY NOVA** (`HNX26EPS04`). Built with React 19, Vite 8, and Tailwind CSS, it provides a high-fidelity visual workspace to upload challenging handwriting, inspect optical uncertainty, edit digitized transcripts, and export verified text.

### End-to-End Pipeline Architecture:
```
User / Browser (Vikash Frontend)
       │
       ▼ [1. Image Upload & Validation] (PNG, JPG, WEBP, BMP, TIFF ≤ 10MB)
       │
       ▼ [2. HTTP POST /api/process (multipart/form-data: image)]
Udhayan FastAPI Backend (:8000)
       │
       ▼ [3. AI Pipeline HTR + VLM + LLM]
Vivin AI Engine (RapidOCR + Gemini VLM + Multi-Signal Uncertainty)
       │
       ▼ [4. Canonical JSON Response Contract]
Vikash Frontend UI
       │
       ├─ Left Pane: Original Unaltered Scan (with Zoom & Contrast Enhancement)
       ├─ Right Pane: Clean Editable Document Editor (Word count, Copy, Reset, Export)
       ├─ Core Auditing: Flagged Uncertain Regions with Root-Cause Reasons & 1-Click Fix
       ├─ Peripheral Cards: Isolated Margin Notes (with Append) & Crossed-Out Strikethroughs
       └─ Telemetry: Real-time Backend Health Detection (:8000) vs Isolated Mock Mode
```

---

## 2. Component Architecture

```
frontend/
├── src/
│   ├── components/
│   │   ├── Header.jsx          # Team branding, workflow stepper & backend telemetry (:8000)
│   │   ├── UploadPanel.jsx     # Dropzone, file browser, validations & 3 benchmark presets
│   │   ├── ImagePreview.jsx    # Non-destructive inspection canvas, zoom, contrast filter
│   │   ├── ProcessingState.jsx # Stepped execution indicator & transparent pipeline status
│   │   ├── ResultsPanel.jsx    # Side-by-side workspace: original scan vs editable transcript
│   │   ├── ConfidenceBadge.jsx # Color-graded confidence meter (High, Moderate, Low)
│   │   ├── UncertaintyPanel.jsx# Flagged low-confidence segments, reasons & alternatives
│   │   ├── MarginNotes.jsx     # Isolated marginalia with 1-click append to document
│   │   └── CrossedOutPanel.jsx # Detected pen strikethroughs with restore to document
│   ├── services/
│   │   └── api.js              # Dedicated API service adapter (Mock + Real Backend)
│   ├── utils/
│   │   └── sampleImages.js     # Authentic SVG manuscript vectors for instant demo benchmarks
│   ├── App.jsx                 # Application state machine (Upload, Processing, Results, Error)
│   ├── main.jsx                # React 19 application entry point
│   └── index.css               # Theme tokens, scrollbar styling & paper texture
├── index.html                  # HTML entry point with fonts
├── package.json                # Dependencies and build scripts
├── vite.config.ts              # Vite configuration with React & Tailwind plugins
└── README.md                   # Frontend documentation
```

---

## 3. Quickstart

### Prerequisites
- Node.js 18+ (tested on Node v24)
- npm 9+

### Installation & Run
```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The application runs at:
- **Local URL:** `http://localhost:5173/` or `http://127.0.0.1:5173/`

### Production Build
```bash
npm run build
```
Generates production assets in `dist/` in under 2 seconds.

---

## 4. API Service Contract & Integration

Located at `src/services/api.js`.

### 4.1 Backend Endpoints
- **Health Check:** `GET http://localhost:8000/api/health`
  - Polled dynamically by `Header.jsx`. Shows `Backend: Online (:8000)` or `Engine: Mock Mode (Isolated)`.
- **Image Processing:** `POST http://localhost:8000/api/process`
  - Accepts `multipart/form-data` with field `image=<file>`.
  - Seamlessly routes to Udhayan's FastAPI backend and Vivin's AI pipeline.

### 4.2 Canonical JSON Contract
```json
{
  "success": true,
  "text": "Final clean, structured, editable transcribed text",
  "segments": [],
  "overallConfidence": 0.84,
  "uncertainRegions": [
    {
      "id": "u-1",
      "text": "Propranolol 40mg",
      "confidence": 0.52,
      "reason": "Visual ambiguity in cursive ligature & dosage numeral",
      "alternatives": ["Propranolol 10mg", "Propranolol 40mg"]
    }
  ],
  "marginNotes": [
    {
      "id": "m-1",
      "text": "BP 138/86 mmHg @ 09:15 AM",
      "position": "Top-Right Margin",
      "confidence": 0.91
    }
  ],
  "crossedOutText": [
    {
      "id": "c-1",
      "originalText": "Amitriptyline 25mg at bedtime",
      "reason": "Horizontal strike-out stroke across pharmaceutical entry",
      "confidence": 0.89
    }
  ],
  "rawOcrText": "Patnt exbts recurrng...",
  "processingInfo": {
    "engine": "CRY NOVA Dual-Stage OCR",
    "processingTimeMs": 1420,
    "preProcessingApplied": ["Adaptive Otsu Binarization", "Deskew Rectification (-2.4°)"]
  }
}
```

---

## 5. Built-in Benchmark Presets

For rapid hackathon demonstration without requiring external files:
1. **Clinical Prescription & Doctor Note:** Illegible medical cursive, dosage numerals, and strike-through pharmaceutical revisions.
2. **Archival Expedition Field Journal (1912):** Iron-gall ink fading, moisture damage, and elevation marginalia.
3. **Engineering Architecture Scrawl:** Fast whiteboard shorthand, ruled lines, and crossed-out design notes.

---

## 6. Security & Safety

- No `.env` or credentials committed.
- Node modules excluded via `.gitignore`.
- Non-destructive image inspection preserves original scan fidelity.
