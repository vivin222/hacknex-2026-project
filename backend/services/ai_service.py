"""AI Service Adapter for CRY NOVA Extreme Bad-Handwriting Digitizing Stack (HNX26EPS04).

LAP 2 - BACKEND INTEGRATION ADAPTER:
Vivin's AI engine (src.pipeline.process_handwriting) is not present in this workspace.
This module provides an adapter interface that:
1. Dynamically detects if Vivin's `src.pipeline` is available on the Python path.
2. If available, delegates to `process_handwriting(image_path)` and returns `result.model_dump()`.
3. If not available (current Lap 2 state), cleanly reports that the AI pipeline is not connected yet,
   preserving canonical response schema compatibility WITHOUT fabricating fake text or confidence scores.
"""

from __future__ import annotations

import logging
import os
import sys
from pathlib import Path
from typing import Any, Dict

logger = logging.getLogger("cry_nova.ai_service")

# Ensure repository root and backend directory are in sys.path so 'src.pipeline'
# can be discovered whether installed at workspace root or alongside backend.
_current_dir = Path(__file__).resolve().parent
_backend_root = _current_dir.parent
_repo_root = _backend_root.parent

for p in (_repo_root, _backend_root):
    str_p = str(p)
    if str_p not in sys.path:
        sys.path.insert(0, str_p)

# Dynamically verify if Vivin's AI pipeline is connected
try:
    from src.pipeline import process_handwriting  # type: ignore
    AI_PIPELINE_AVAILABLE = True
    logger.info("Vivin AI Pipeline (src.pipeline.process_handwriting) is CONNECTED.")
except ImportError:
    process_handwriting = None  # type: ignore
    AI_PIPELINE_AVAILABLE = False
    logger.info("Vivin AI Pipeline is NOT CONNECTED yet. Adapter operating in disconnected mode.")


def is_ai_connected() -> bool:
    """Return True if the real AI pipeline from src.pipeline is available."""
    return AI_PIPELINE_AVAILABLE and callable(process_handwriting)


def process_image(image_path: str) -> Dict[str, Any]:
    """Process an image using Vivin's AI pipeline or return explicit disconnected status.

    Args:
        image_path: Absolute or verified filesystem path to the uploaded image.

    Returns:
        Dict adhering to Vivin's canonical response contract.
    """
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found at path: {image_path}")

    # When Vivin's real AI engine is connected in Lap 3:
    if is_ai_connected():
        logger.info(f"Delegating {image_path} to Vivin's real AI pipeline...")
        result = process_handwriting(image_path)
        if hasattr(result, "model_dump"):
            return result.model_dump()
        elif isinstance(result, dict):
            return result
        return dict(result)

    # In current disconnected state (Lap 2):
    # NEVER fabricate handwriting text or confidence values.
    # Return an explicit integration status compatible with future structure.
    logger.info(f"Processing image {image_path} in disconnected mode (AI engine not connected yet).")
    return {
        "success": False,
        "status": "ai_pipeline_not_connected",
        "message": "AI pipeline not connected yet",
        "text": None,
        "segments": [],
        "overallConfidence": None,
        "uncertainRegions": [],
        "marginNotes": [],
        "crossedOutText": [],
        "rawOcrText": None,
        "processingInfo": {
            "ai_connected": False,
            "engine": "pending_lap3_integration",
            "source_image": os.path.basename(image_path),
            "note": "Awaiting src.pipeline.process_handwriting integration"
        }
    }
