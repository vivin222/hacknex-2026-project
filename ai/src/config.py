"""
Global configuration loader for CRY NOVA.
Reads environment variables safely without leaking secrets.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root if present
PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env")

# API Keys (Loaded strictly from environment)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()

# Default Model Selection
DEFAULT_VLM_MODEL = os.getenv("DEFAULT_VLM_MODEL", "gemini-2.5-flash")
DEFAULT_LLM_MODEL = os.getenv("DEFAULT_LLM_MODEL", "gemini-2.5-flash")

# Default Pipeline Feature Toggles
ENABLE_PREPROCESSING = os.getenv("ENABLE_PREPROCESSING", "true").lower() in ("true", "1", "yes")
ENABLE_VLM = os.getenv("ENABLE_VLM", "true").lower() in ("true", "1", "yes")
ENABLE_LLM_CORRECTION = os.getenv("ENABLE_LLM_CORRECTION", "true").lower() in ("true", "1", "yes")
ENABLE_UNCERTAINTY = os.getenv("ENABLE_UNCERTAINTY", "true").lower() in ("true", "1", "yes")
DEBUG_MODE = os.getenv("DEBUG_MODE", "false").lower() in ("true", "1", "yes")

# Directories
DEBUG_ARTIFACTS_DIR = PROJECT_ROOT / "debug_artifacts"
OUTPUT_DIR = PROJECT_ROOT / "output"
TEST_SAMPLES_DIR = PROJECT_ROOT / "tests" / "samples"

for directory in [DEBUG_ARTIFACTS_DIR, OUTPUT_DIR, TEST_SAMPLES_DIR]:
    directory.mkdir(parents=True, exist_ok=True)


def is_vlm_available() -> bool:
    """Returns True if a live VLM API key is configured."""
    return bool(GEMINI_API_KEY or OPENAI_API_KEY)
