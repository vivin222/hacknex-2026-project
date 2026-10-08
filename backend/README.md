# CRY NOVA — Backend API Service (HNX26EPS04)

**Project:** Extreme Bad-Handwriting Digitizing Stack  
**Team Member:** Member 3 — Udhayan (Backend / API Engineer)  
**Status:** LAP 2 — Backend Only (AI Integration Pending Lap 3)  

---

## 1. Overview

This is the FastAPI backend service for team **CRY NOVA** (`HNX26EPS04`). It serves as the bridge between the frontend (Shankar) and the handwriting digitization AI pipeline (Vivin).

### Architecture Flow:
```
Browser / Shankar Frontend
         ↓
POST /api/process (multipart/form-data)
         ↓
Udhayan FastAPI Backend
         ↓
Vivin AI Pipeline (src.pipeline.process_handwriting)
         ↓
JSON Result (Canonical Contract)
         ↓
Frontend
```

In the current phase (**LAP 2**), Vivin's AI pipeline is not yet present in this workspace. The backend implements a robust integration adapter that reports an explicit integration status while adhering to the canonical response contract.

---

## 2. Project Structure

```
backend/
├── main.py              # FastAPI application, routes, validations, CORS, and error handling
├── requirements.txt     # Python dependencies
├── .env.example         # Environment configuration template
├── .gitignore           # Git ignore rules for secrets, virtual environments, and caches
├── services/
│   ├── __init__.py      # Services package marker
│   └── ai_service.py    # Integration adapter for Vivin's AI pipeline
└── README.md            # Backend documentation
```

---

## 3. Installation

Ensure Python 3.10+ is installed.

```bash
# Navigate to the backend directory
cd backend

# (Optional) Create and activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install required dependencies
pip install -r requirements.txt
```

---

## 4. Run Command

Start the backend server using `uvicorn`:

```bash
uvicorn main:app --reload --port 8000
```

Alternatively:
```bash
python -m uvicorn main:app --reload --port 8000
```

Server will be available at:
- **Base URL:** `http://localhost:8000`
- **Interactive Swagger Docs:** `http://localhost:8000/docs`
- **Alternative ReDoc:** `http://localhost:8000/redoc`

---

## 5. API Endpoints

### 5.1 GET `/api/health`
Health check endpoint used by frontend and deployment health probes.

- **Method:** `GET`
- **Response Format:** `application/json`
- **Status Code:** `200 OK`
- **Response Body:**
```json
{
  "status": "ok",
  "service": "cry-nova-backend"
}
```

---

### 5.2 POST `/api/process`
Main image ingestion endpoint for bad-handwriting digitization.

- **Method:** `POST`
- **Content-Type:** `multipart/form-data`
- **Form Field:** `image` (binary file upload)
- **Supported Formats:** JPEG, PNG, WEBP, BMP, TIFF (`.jpg`, `.jpeg`, `.png`, `.webp`, `.bmp`, `.tiff`, `.tif`)
- **Default Size Limit:** 10MB (configurable via `MAX_UPLOAD_SIZE_MB` in `.env`)

#### Current Disconnected Response (Lap 2):
Because Vivin's real AI engine is not present, the backend explicitly indicates the integration status and does **NOT** fabricate fake text or confidence scores:
```json
{
  "success": false,
  "status": "ai_pipeline_not_connected",
  "message": "AI pipeline not connected yet",
  "text": null,
  "segments": [],
  "overallConfidence": null,
  "uncertainRegions": [],
  "marginNotes": [],
  "crossedOutText": [],
  "rawOcrText": null,
  "processingInfo": {
    "ai_connected": false,
    "engine": "pending_lap3_integration",
    "source_image": "sample_handwriting.png",
    "note": "Awaiting src.pipeline.process_handwriting integration"
  }
}
```

#### Connected State Response Contract (Lap 3+):
Once Vivin connects `src.pipeline.process_handwriting`, the endpoint seamlessly returns the canonical structure:
```json
{
  "success": true,
  "text": "...",
  "segments": [],
  "overallConfidence": 0.0,
  "uncertainRegions": [],
  "marginNotes": [],
  "crossedOutText": [],
  "rawOcrText": "",
  "processingInfo": {}
}
```

---

## 6. Upload Validations & Error Handling

All invalid requests return clean JSON error payloads without leaking server stack traces:

| Scenario | HTTP Status | Detail Message |
| :--- | :--- | :--- |
| Missing file | `400 Bad Request` | Missing image file in upload request |
| Unsupported extension | `400 Bad Request` | Unsupported file extension '.xyz'. Supported extensions: ... |
| Unsupported content-type | `400 Bad Request` | Unsupported content type '...'. Supported types: ... |
| Empty file (0 bytes) | `400 Bad Request` | Uploaded file is empty (0 bytes). |
| Oversized upload (>10MB) | `413 Payload Too Large` | File size exceeds maximum allowed limit of 10MB. |
| Corrupted / non-image data | `400 Bad Request` | Uploaded file is corrupted or not a valid image format. |
| Server error | `500 Internal Server Error` | Clean generic message; stack trace safely logged to server console. |

---

## 7. AI Service Adapter & Future Connection

Located at [services/ai_service.py](file:///C:/Users/user/.gemini/antigravity/scratch/backend/services/ai_service.py).

### How Vivin's Pipeline Will Be Connected Later (Lap 3):
1. Place Vivin's AI pipeline code under `src/pipeline.py` (either at repo root or inside backend).
2. The AI service adapter automatically attempts to import:
   ```python
   from src.pipeline import process_handwriting
   ```
3. When `process_handwriting` is present, `process_image` delegates execution:
   ```python
   result = process_handwriting(image_path)
   return result.model_dump()
   ```
4. **No changes to the frontend API contract are required.**
