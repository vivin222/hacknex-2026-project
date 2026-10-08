"""
Comprehensive Benchmark Handwriting Dataset Generator.
Covers all 10 required evaluation categories:
1. Normal handwriting
2. Very messy handwriting
3. Cramped handwriting
4. Crossed-out text
5. Margin notes
6. Poor image quality (noise + shadows)
7. Skewed image (rotation tilt)
8. Numbers (dosages, blood pressure, lab values)
9. Technical words (pharmaceuticals, medical diagnoses)
10. Multilingual / mixed script simulation
"""

from pathlib import Path
import random
import numpy as np
import cv2


def create_textured_canvas(w: int, h: int, tint=(248, 246, 240)) -> np.ndarray:
    """Generates authentic textured paper background with lighting gradient."""
    canvas = np.full((h, w, 3), tint, dtype=np.uint8)
    noise = np.random.normal(0, 3, (h, w, 3)).astype(np.int16)
    canvas = np.clip(canvas.astype(np.int16) + noise, 0, 255).astype(np.uint8)

    # Lighting gradient across page
    X, Y = np.meshgrid(np.linspace(0, 1, w), np.linspace(0, 1, h))
    gradient = 1.0 - 0.12 * (X * 0.6 + Y * 0.4)
    canvas = np.clip(canvas.astype(np.float32) * gradient[:, :, np.newaxis], 0, 255).astype(np.uint8)
    return canvas


def generate_benchmark_suite(output_dir: Path):
    output_dir.mkdir(parents=True, exist_ok=True)
    ink_blue = (120, 40, 25)
    ink_black = (45, 45, 45)
    ink_red = (35, 35, 185)

    # 1. Normal Handwriting
    c1 = create_textured_canvas(850, 400)
    lines_1 = [
        "Patient follow up visit notes",
        "No complaints of chest pain or cough",
        "Continue current regular medications",
        "Return for blood check next month"
    ]
    y = 80
    for line in lines_1:
        cv2.putText(c1, line, (80, y), cv2.FONT_HERSHEY_SIMPLEX, 0.75, ink_blue, 2, cv2.LINE_AA)
        y += 65
    cv2.imwrite(str(output_dir / "01_normal_handwriting.png"), c1)

    # 2. Very Messy Handwriting
    c2 = create_textured_canvas(850, 420)
    lines_2 = [
        "Severe acute migraine and nausea",
        "Advised bed rest in quiet dark room",
        "Tab Sumatriptan 50mg PRN for headache",
        "Refer to neurologist if no relief"
    ]
    y = 80
    for line in lines_2:
        cv2.putText(c2, line, (60, y), cv2.FONT_HERSHEY_SCRIPT_COMPLEX, 0.75, ink_blue, 2, cv2.LINE_AA)
        y += 75
    cv2.imwrite(str(output_dir / "02_very_messy_handwriting.png"), c2)

    # 3. Cramped Handwriting
    c3 = create_textured_canvas(850, 380)
    lines_3 = [
        "ptcomplaintsoffatigueandweakness",
        "hbleveltestedat10.4g/dllowiron",
        "prescribefferrousascorbate100mgOD",
        "repeatCBCaftersixweeks"
    ]
    y = 70
    for line in lines_3:
        cv2.putText(c3, line, (60, y), cv2.FONT_HERSHEY_SCRIPT_SIMPLEX, 0.75, ink_black, 2, cv2.LINE_AA)
        y += 60
    cv2.imwrite(str(output_dir / "03_cramped_handwriting.png"), c3)

    # 4. Crossed-Out Text & Active Replacement
    c4 = create_textured_canvas(900, 420)
    cv2.putText(c4, "Rx: Metformin 1000mg BD after food", (120, 110), cv2.FONT_HERSHEY_SIMPLEX, 0.75, ink_blue, 2, cv2.LINE_AA)
    # Struck out dosage: "1000mg BD"
    cv2.line(c4, (330, 105), (550, 105), ink_red, 3, cv2.LINE_AA)
    cv2.line(c4, (325, 112), (545, 100), ink_red, 2, cv2.LINE_AA)
    # Active replacement above
    cv2.putText(c4, "500mg BD", (360, 75), cv2.FONT_HERSHEY_SIMPLEX, 0.75, ink_blue, 2, cv2.LINE_AA)
    cv2.putText(c4, "Monitor fasting blood glucose weekly", (120, 200), cv2.FONT_HERSHEY_SIMPLEX, 0.75, ink_blue, 2, cv2.LINE_AA)
    cv2.putText(c4, "Target HbA1c below 6.5 percent", (120, 280), cv2.FONT_HERSHEY_SIMPLEX, 0.75, ink_blue, 2, cv2.LINE_AA)
    cv2.imwrite(str(output_dir / "04_crossed_out_text.png"), c4)

    # 5. Margin Notes
    c5 = create_textured_canvas(950, 450)
    # Body text
    cv2.putText(c5, "Diagnosis: Bronchial asthma exacerbation", (260, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.75, ink_blue, 2, cv2.LINE_AA)
    cv2.putText(c5, "Inhaler Budecort 200mcg two puffs BD", (260, 200), cv2.FONT_HERSHEY_SIMPLEX, 0.75, ink_blue, 2, cv2.LINE_AA)
    cv2.putText(c5, "Review peak flow meter readings daily", (260, 280), cv2.FONT_HERSHEY_SIMPLEX, 0.75, ink_blue, 2, cv2.LINE_AA)
    # Margin notes on the left
    cv2.putText(c5, "* Note: Check SpO2", (30, 160), cv2.FONT_HERSHEY_SIMPLEX, 0.60, ink_red, 2, cv2.LINE_AA)
    cv2.putText(c5, "  if coughing worsens", (30, 195), cv2.FONT_HERSHEY_SIMPLEX, 0.60, ink_red, 2, cv2.LINE_AA)
    cv2.imwrite(str(output_dir / "05_margin_notes.png"), c5)

    # 6. Poor Image Quality (Heavy noise, shadow, blur)
    c6 = create_textured_canvas(850, 400)
    cv2.putText(c6, "Emergency triage assessment record", (80, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.75, ink_black, 2, cv2.LINE_AA)
    cv2.putText(c6, "Patient alert and oriented x 3", (80, 180), cv2.FONT_HERSHEY_SIMPLEX, 0.75, ink_black, 2, cv2.LINE_AA)
    cv2.putText(c6, "Administer IV Normal Saline 500ml", (80, 260), cv2.FONT_HERSHEY_SIMPLEX, 0.75, ink_black, 2, cv2.LINE_AA)
    # Add dark mobile camera shadow corner
    h, w = c6.shape[:2]
    Y, X = np.ogrid[:h, :w]
    dist_from_corner = np.sqrt(X**2 + Y**2)
    shadow_mask = np.clip(dist_from_corner / (np.sqrt(w**2 + h**2) * 0.7), 0.35, 1.0)
    c6 = np.clip(c6.astype(np.float32) * shadow_mask[:, :, np.newaxis], 0, 255).astype(np.uint8)
    # Add gaussian blur & noise
    c6 = cv2.GaussianBlur(c6, (3, 3), 0.8)
    sensor_noise = np.random.normal(0, 12, c6.shape).astype(np.int16)
    c6 = np.clip(c6.astype(np.int16) + sensor_noise, 0, 255).astype(np.uint8)
    cv2.imwrite(str(output_dir / "06_poor_image_quality.png"), c6)

    # 7. Skewed Image (Rotated tilt)
    c7 = create_textured_canvas(850, 400)
    cv2.putText(c7, "Orthopedic consult evaluation", (80, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.75, ink_blue, 2, cv2.LINE_AA)
    cv2.putText(c7, "Right knee osteoarthritis grade 2", (80, 180), cv2.FONT_HERSHEY_SIMPLEX, 0.75, ink_blue, 2, cv2.LINE_AA)
    cv2.putText(c7, "Physiotherapy quad strengthening exercises", (80, 260), cv2.FONT_HERSHEY_SIMPLEX, 0.75, ink_blue, 2, cv2.LINE_AA)
    # Rotate 5.5 degrees
    center = (c7.shape[1] // 2, c7.shape[0] // 2)
    rot_mat = cv2.getRotationMatrix2D(center, 5.5, 1.0)
    c7 = cv2.warpAffine(c7, rot_mat, (c7.shape[1], c7.shape[0]), borderValue=(248, 246, 240))
    cv2.imwrite(str(output_dir / "07_skewed_image.png"), c7)

    # 8. Numbers & Lab Metrics
    c8 = create_textured_canvas(850, 400)
    lines_8 = [
        "Vital Signs: BP 128/84 mmHg, HR 76 bpm",
        "Lab: Hb 13.8 g/dL, WBC 7400 /mcL, Platelets 240k",
        "Serum Creatinine 0.9 mg/dL, eGFR 95 mL/min",
        "Dosage: Atorvastatin 20mg tab at bedtime"
    ]
    y = 80
    for line in lines_8:
        cv2.putText(c8, line, (60, y), cv2.FONT_HERSHEY_SIMPLEX, 0.75, ink_black, 2, cv2.LINE_AA)
        y += 70
    cv2.imwrite(str(output_dir / "08_numbers_and_metrics.png"), c8)

    # 9. Technical Words & Pharmacology
    c9 = create_textured_canvas(850, 400)
    lines_9 = [
        "Rx: Amoxicillin-Clavulanate 625mg PO TDS",
        "Pantoprazole 40mg tab ante cibum OD",
        "Ondansetron 4mg tab sublingual PRN for emesis",
        "Hydroxyzine 25mg tab for allergic pruritus"
    ]
    y = 80
    for line in lines_9:
        cv2.putText(c9, line, (50, y), cv2.FONT_HERSHEY_SIMPLEX, 0.75, ink_blue, 2, cv2.LINE_AA)
        y += 70
    cv2.imwrite(str(output_dir / "09_technical_words.png"), c9)

    # 10. Mixed Script & Code-Switched Multilingual (English + Latin/Indic terms)
    c10 = create_textured_canvas(850, 400)
    lines_10 = [
        "Patient Consultation: Kaal Vali / Joint Pain",
        "Complaints of severe muttu vali (knee discomfort)",
        "Paracetamol 650mg TDS x 3 days podavum",
        "Next review adutha thingal / Monday in OPD"
    ]
    y = 80
    for line in lines_10:
        cv2.putText(c10, line, (50, y), cv2.FONT_HERSHEY_SIMPLEX, 0.75, ink_blue, 2, cv2.LINE_AA)
        y += 70
    cv2.imwrite(str(output_dir / "10_mixed_script_codeswitch.png"), c10)

    print(f"Generated 10 benchmark evaluation samples in: {output_dir}")


if __name__ == "__main__":
    generate_benchmark_suite(Path("tests/samples"))
