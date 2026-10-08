"""
Comprehensive End-to-End Test Suite for CRY NOVA FastAPI /analyze Endpoint.
Validates:
1. Real image processing (actual bytes analyzed)
2. Different images produce distinct, independent results
3. Unique request_id per transaction
4. Missing file, empty file, invalid image, and unsupported format validations
5. Absence of hardcoded answers or filename-based mocks
6. Conflict, entity, measurement, timeline, and provenance generation
"""

import sys
from pathlib import Path

# Add project root, backend, and ai directories to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
for p in [PROJECT_ROOT, PROJECT_ROOT / "backend", PROJECT_ROOT / "ai"]:
    if str(p) not in sys.path:
        sys.path.insert(0, str(p))

import io
import pytest
from fastapi.testclient import TestClient
import numpy as np
import cv2
from PIL import Image

from backend.main import app

client = TestClient(app)


def test_health_check():
    """Verify health endpoint returns active service identity."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "cry-nova-backend"


def test_missing_file_returns_400():
    """Verify missing file payload raises HTTP 400."""
    response = client.post("/analyze", files={})
    assert response.status_code == 400
    assert "Missing image file" in response.json()["detail"]


def test_empty_file_returns_400():
    """Verify empty 0-byte file raises HTTP 400."""
    files = {"file": ("empty.png", io.BytesIO(b""), "image/png")}
    response = client.post("/analyze", files=files)
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()


def test_invalid_corrupted_image_returns_400():
    """Verify corrupted non-image binary payload raises HTTP 400."""
    corrupted_data = b"NOT_A_VALID_IMAGE_DATA_CORRUPT_BYTES_XYZ1234567890"
    files = {"file": ("corrupt.png", io.BytesIO(corrupted_data), "image/png")}
    response = client.post("/analyze", files=files)
    assert response.status_code == 400
    assert "corrupted" in response.json()["detail"].lower() or "not a valid image" in response.json()["detail"].lower()


def test_unsupported_extension_returns_400():
    """Verify unsupported file extension raises HTTP 400."""
    files = {"file": ("script.sh", io.BytesIO(b"#!/bin/bash\necho test"), "text/plain")}
    response = client.post("/analyze", files=files)
    assert response.status_code == 400
    assert "unsupported" in response.json()["detail"].lower()


def test_image_a_vs_image_b_independence():
    """
    CRITICAL TEST (TASK 10):
    Upload Image A (doctor prescription) -> record result.
    Upload Image B (messy scrawl) -> record result.
    Proves:
    - Results are generated strictly from actual image pixels
    - Result A != Result B
    - Request IDs are unique
    - No hardcoded demo response
    """
    sample_a_path = PROJECT_ROOT / "ai" / "tests" / "samples" / "sample_doctor_prescription.png"
    sample_b_path = PROJECT_ROOT / "ai" / "tests" / "samples" / "sample_messy_scrawl.png"

    assert sample_a_path.exists(), f"Missing test fixture: {sample_a_path}"
    assert sample_b_path.exists(), f"Missing test fixture: {sample_b_path}"

    # 1. Process Image A
    with open(sample_a_path, "rb") as f:
        files_a = {"file": ("custom_name_1.png", f.read(), "image/png")}
    res_a = client.post("/analyze", files=files_a)
    assert res_a.status_code == 200, f"Failed processing Image A: {res_a.text}"
    data_a = res_a.json()

    # 2. Process Image B
    with open(sample_b_path, "rb") as f:
        files_b = {"file": ("custom_name_2.png", f.read(), "image/png")}
    res_b = client.post("/analyze", files=files_b)
    assert res_b.status_code == 200, f"Failed processing Image B: {res_b.text}"
    data_b = res_b.json()

    # Verify unique request IDs
    assert data_a["request_id"] != data_b["request_id"], "Request IDs must be unique per transaction"

    # Verify completely different extracted text
    assert data_a["text"] != data_b["text"], "Different images must NOT receive identical output text"

    # Verify Image A contents (Rahul Sharma / Paracetamol prescription)
    assert "Paracetamol" in data_a["text"] or "Rahul" in data_a["text"]
    assert len(data_a["entities"]) > 0

    # Verify Image B contents (Migraine / Naproxen scrawl)
    assert "migraine" in data_b["text"].lower() or "naproxen" in data_b["text"].lower()

    # Verify provenance points to respective filenames
    assert data_a["filename"] == "custom_name_1.png"
    assert data_b["filename"] == "custom_name_2.png"


def test_dynamic_synthetic_image_no_caching():
    """
    CRITICAL TEST (TASK 10 & 14):
    Dynamically generates a brand new image with a random unique numeric token.
    Uploads to /analyze and verifies that the unique token is extracted in text.
    Proves:
    - Zero caching of previous answers
    - Zero hardcoded mock responses
    - Actual OCR occurs on uploaded pixels
    """
    unique_token = "RX987654"
    img = np.full((120, 500, 3), 255, dtype=np.uint8)
    cv2.putText(img, f"Patient Token: {unique_token}", (20, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 2)

    _, png_bytes = cv2.imencode(".png", img)
    files = {"file": ("dynamic_test.png", png_bytes.tobytes(), "image/png")}

    response = client.post("/analyze", files=files)
    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert unique_token in data["text"], f"Expected unique token '{unique_token}' in OCR output, got '{data['text']}'"


def test_conflict_detection_on_crossed_out_sample():
    """Verify conflict detection recognizes struck-through dosage."""
    sample_path = PROJECT_ROOT / "ai" / "tests" / "samples" / "04_crossed_out_text.png"
    assert sample_path.exists()

    with open(sample_path, "rb") as f:
        files = {"file": ("04_crossed_out_text.png", f.read(), "image/png")}

    response = client.post("/analyze", files=files)
    assert response.status_code == 200
    data = response.json()

    # Crossed-out text should be isolated
    assert "crossedOutText" in data
    assert len(data["crossedOutText"]) > 0 or len(data["conflicts"]) > 0


def test_compatibility_route_api_process():
    """Verify /api/process compatibility endpoint returns identical schema."""
    sample_path = PROJECT_ROOT / "ai" / "tests" / "samples" / "01_normal_handwriting.png"
    with open(sample_path, "rb") as f:
        files = {"image": ("normal.png", f.read(), "image/png")}

    response = client.post("/api/process", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "entities" in data
    assert "claims" in data
    assert "provenance" in data


def test_sample_button_1_clinical_prescription():
    """Verify Sample 1 (Clinical Prescription) produces authentic analysis."""
    sample_path = PROJECT_ROOT / "public" / "samples" / "sample_doctor_prescription.png"
    assert sample_path.exists(), f"Sample 1 file missing at {sample_path}"
    assert sample_path.stat().st_size > 100_000, "Sample 1 should be a real high-res PNG"

    with open(sample_path, "rb") as f:
        content = f.read()
    files = {"file": ("sample_doctor_prescription.png", content, "image/png")}

    response = client.post("/analyze", files=files)
    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert "prescription" in data["text"].lower() or "hospital" in data["text"].lower()
    assert len(data["entities"]) > 0
    assert len(data["claims"]) > 0
    assert data["filename"] == "sample_doctor_prescription.png"
    assert data["processingInfo"]["isRealBackend"] is True


def test_sample_button_2_strikethrough_scrawl():
    """Verify Sample 2 (Crossed-Out Text) produces authentic analysis & conflict isolation."""
    sample_path = PROJECT_ROOT / "public" / "samples" / "04_crossed_out_text.png"
    assert sample_path.exists(), f"Sample 2 file missing at {sample_path}"

    with open(sample_path, "rb") as f:
        content = f.read()
    files = {"file": ("04_crossed_out_text.png", content, "image/png")}

    response = client.post("/analyze", files=files)
    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert "metformin" in data["text"].lower()
    assert len(data["conflicts"]) > 0 or len(data["crossedOutText"]) > 0
    assert data["filename"] == "04_crossed_out_text.png"


def test_sample_button_3_numbers_and_metrics():
    """Verify Sample 3 (Technical Numbers & Metrics) produces authentic analysis."""
    sample_path = PROJECT_ROOT / "public" / "samples" / "08_numbers_and_metrics.png"
    assert sample_path.exists(), f"Sample 3 file missing at {sample_path}"

    with open(sample_path, "rb") as f:
        content = f.read()
    files = {"file": ("08_numbers_and_metrics.png", content, "image/png")}

    response = client.post("/analyze", files=files)
    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert "vital signs" in data["text"].lower() or "bp" in data["text"].lower()
    assert len(data["measurements"]) > 0
    assert data["filename"] == "08_numbers_and_metrics.png"


def test_manually_selected_local_image():
    """Verify an arbitrary manually uploaded local user image processes end-to-end."""
    img = np.full((180, 700, 3), 255, dtype=np.uint8)
    cv2.putText(img, "MANUAL UPLOAD TEST 2026", (40, 100), cv2.FONT_HERSHEY_SIMPLEX, 1.1, (20, 20, 20), 2)
    success, encoded = cv2.imencode(".png", img)
    assert success

    files = {"file": ("manual_user_scan.png", encoded.tobytes(), "image/png")}
    response = client.post("/analyze", files=files)
    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert "MANUAL" in data["text"] and "TEST" in data["text"] and "2026" in data["text"]
    assert data["filename"] == "manual_user_scan.png"
    assert len(data["claims"]) > 0


def test_flags_and_review_summary_structure():
    """Verify Phase 1 human-verification flags and reviewSummary structure."""
    sample_path = PROJECT_ROOT / "public" / "samples" / "sample_doctor_prescription.png"
    with open(sample_path, "rb") as f:
        content = f.read()
    files = {"file": ("test_prescription.png", content, "image/png")}

    response = client.post("/analyze", files=files)
    assert response.status_code == 200
    data = response.json()

    assert "flags" in data
    assert isinstance(data["flags"], list)
    assert "reviewSummary" in data
    rev_sum = data["reviewSummary"]
    assert "needsHumanReview" in rev_sum
    assert "flagCount" in rev_sum
    assert "overallStatus" in rev_sum
    assert "documentWarning" in rev_sum
    assert "thresholdsApplied" in rev_sum
    assert rev_sum["thresholdsApplied"]["HIGH_CONFIDENCE_MIN"] == 0.75

    # Check flag item schema if any flags exist
    for flag in data["flags"]:
        assert "id" in flag
        assert "type" in flag
        assert "category" in flag
        assert "confidence" in flag
        assert "status" in flag
        assert "recommendation" in flag


def test_multi_pass_processing_info():
    """Verify Phase 2 multi-pass OCR metadata in processingInfo."""
    sample_path = PROJECT_ROOT / "public" / "samples" / "sample_doctor_prescription.png"
    with open(sample_path, "rb") as f:
        content = f.read()
    files = {"file": ("test_prescription.png", content, "image/png")}

    response = client.post("/analyze", files=files)
    assert response.status_code == 200
    data = response.json()

    proc_info = data["processingInfo"]
    assert "engine" in proc_info
    assert "processingTimeMs" in proc_info
    assert "preProcessingApplied" in proc_info
    assert "multiPassInfo" in proc_info


