"""FastAPI Backend for CRY NOVA Extreme Bad-Handwriting Digitizing Stack (HNX26EPS04).

Member 3 — Udhayan — Backend/API Engineer
LAP 2 — BACKEND ONLY.
"""

import os
os.environ.setdefault("OMP_NUM_THREADS", "2")
os.environ.setdefault("OPENBLAS_NUM_THREADS", "2")
os.environ.setdefault("MKL_NUM_THREADS", "2")
os.environ.setdefault("VECLIB_MAXIMUM_THREADS", "2")
os.environ.setdefault("NUMEXPR_NUM_THREADS", "2")

import asyncio
import io
import logging
import sys
import tempfile
from pathlib import Path
from typing import Any, Dict, List, Optional

# Ensure both backend root and repo root are in sys.path
_backend_dir = Path(__file__).resolve().parent
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))
_repo_dir = _backend_dir.parent
if str(_repo_dir) not in sys.path:
    sys.path.insert(0, str(_repo_dir))

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, Request, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image, UnidentifiedImageError

try:
    from services.ai_service import process_image
except ImportError:
    from backend.services.ai_service import process_image

# Load environment configuration if available
load_dotenv()

# Configure server logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("cry_nova.backend")

# Application Settings
MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "10"))
MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024

SUPPORTED_MIME_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/bmp",
    "image/tiff",
}

SUPPORTED_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".bmp",
    ".tiff",
    ".tif",
}

# Parse CORS Origins - Explicitly include production Render URLs and localhost ports
DEFAULT_ALLOWED_ORIGINS = [
    "https://crynova-hacknex-frontend.onrender.com",
    "https://crynova-hacknex.onrender.com",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8080",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:8080",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

_raw_origins = os.getenv("ALLOWED_ORIGINS", "")
_custom_origins = [orig.strip() for orig in _raw_origins.split(",") if orig.strip()]
# Merge without duplicates, preserving order
allowed_origins: List[str] = list(dict.fromkeys(DEFAULT_ALLOWED_ORIGINS + _custom_origins))

# Initialize FastAPI application
app = FastAPI(
    title="CRY NOVA — Extreme Bad-Handwriting Digitizing Stack API",
    description=(
        "Backend API service for team CRY NOVA (HNX26EPS04). "
        "Handles image upload validation and routes to handwriting digitization pipeline."
    ),
    version="1.0.0",
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Safely catch unhandled exceptions without leaking stack traces or secrets."""
    logger.error(f"Unhandled exception during {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "detail": "An unexpected error occurred while processing the request.",
            "success": False,
        },
    )


@app.get("/api/health", summary="Service Health Check")
async def health_check() -> Dict[str, str]:
    """Health check endpoint.

    Returns:
        Status and service identity according to specification.
    """
    return {
        "status": "ok",
        "service": "cry-nova-backend",
    }


async def _handle_uploaded_image(upload: UploadFile) -> Dict[str, Any]:
    """Validate uploaded image file and route to real AI handwriting stack."""
    if not upload or not upload.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing image file in upload request.",
        )

    # 1. Validate file extension
    original_filename = upload.filename
    ext = Path(original_filename).suffix.lower()
    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Unsupported file extension '{ext}'. "
                f"Supported extensions: {', '.join(sorted(SUPPORTED_EXTENSIONS))}"
            ),
        )

    # 2. Validate MIME type if reported
    content_type = (upload.content_type or "").lower()
    if content_type and content_type not in SUPPORTED_MIME_TYPES and content_type != "application/octet-stream":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Unsupported content type '{content_type}'. "
                f"Supported types: {', '.join(sorted(SUPPORTED_MIME_TYPES))}"
            ),
        )

    # 3. Read content and validate file size
    try:
        content = await upload.read()
    except Exception as read_err:
        logger.error(f"Failed to read uploaded file: {read_err}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not read uploaded file content.",
        )

    file_size = len(content)
    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes).",
        )

    if file_size > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail=(
                f"File size ({file_size / (1024 * 1024):.2f}MB) exceeds "
                f"maximum allowed limit of {MAX_UPLOAD_SIZE_MB}MB."
            ),
        )

    # 4. Verify image integrity and non-corruption using Pillow
    try:
        with Image.open(io.BytesIO(content)) as img:
            img.verify()
    except (UnidentifiedImageError, OSError, Exception) as img_err:
        logger.warning(f"Corrupted or invalid image upload '{original_filename}': {img_err}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is corrupted or not a valid image format.",
        )

    # 5. Temporarily save image safely for adapter processing
    temp_file = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tf:
            tf.write(content)
            temp_file_path = tf.name
            temp_file = temp_file_path

        # 6. Delegate to the AI Service adapter in worker threadpool to keep FastAPI event loop free
        result = await asyncio.to_thread(process_image, temp_file_path, filename=original_filename)
        return result

    except HTTPException:
        raise
    except Exception as proc_err:
        logger.error(f"Error processing image {original_filename}: {proc_err}", exc_info=True)
        # Never crash the worker! Return graceful error payload
        return {
            "success": False,
            "filename": original_filename,
            "error": "Handwriting analysis encountered an error.",
            "detail": str(proc_err),
        }
    finally:
        # Safe cleanup of the temporary file
        if temp_file and os.path.exists(temp_file):
            try:
                os.remove(temp_file)
            except OSError as cleanup_err:
                logger.warning(f"Could not remove temp file {temp_file}: {cleanup_err}")


@app.post("/analyze", summary="Analyze Handwritten Document (HNX26EPS04 Core)")
async def analyze_document(
    file: Optional[UploadFile] = File(None, description="Handwritten document image file ('file' form field)"),
    image: Optional[UploadFile] = File(None, description="Handwritten document image file ('image' form field)"),
) -> Dict[str, Any]:
    """Primary analysis endpoint for HNX26EPS04.

    Accepts multipart/form-data with image under 'file' or 'image' field.
    Inspects actual image content, executes Vivin AI pipeline, and extracts
    claims, entities, measurements, timeline, conflicts, and provenance.
    """
    target_upload = file or image
    if not target_upload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing image file in request. Provide file in 'file' or 'image' field.",
        )
    return await _handle_uploaded_image(target_upload)


@app.post("/api/process", summary="Process Handwritten Image (Compatibility Route)")
async def process_handwritten_image(
    file: Optional[UploadFile] = File(None, description="Handwritten image file ('file' form field)"),
    image: Optional[UploadFile] = File(None, description="Handwritten image file ('image' form field)"),
) -> Dict[str, Any]:
    """Backward-compatible endpoint routing to the core analyzer."""
    target_upload = file or image
    if not target_upload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing image file in upload request.",
        )
    return await _handle_uploaded_image(target_upload)
