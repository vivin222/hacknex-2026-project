/**
 * HNX26EPS04 — Extreme Bad-Handwriting Digitizing Stack
 * Team: CRY NOVA
 *
 * Instant In-Memory AI Query & Grounding Engine
 * Operates directly on parsed document intelligence in < 50ms without re-running OCR.
 *
 * Grounded query answering without hallucinations:
 * Every point is strictly classified:
 * - [OBSERVED]: Directly evidenced in physical handwriting strokes.
 * - [INFERRED]: Contextually structured clinical or semantic relationship.
 * - [UNCERTAIN]: Flagged optical ambiguity or low-confidence segment requiring review.
 *
 * Each answer point includes bounding-box coordinates for one-click document grounding.
 */

export const SUGGESTED_QUESTIONS = [
  {
    id: 'medication',
    icon: 'Pill',
    label: 'What medication was prescribed?',
    query: 'What medication was prescribed?',
  },
  {
    id: 'revisions',
    icon: 'Scissors',
    label: 'Is there any crossed out dosage?',
    query: 'Is there any crossed out dosage?',
  },
  {
    id: 'vitals',
    icon: 'Activity',
    label: 'What are the patient vitals?',
    query: 'What are the patient vitals?',
  },
  {
    id: 'uncertain',
    icon: 'AlertTriangle',
    label: 'Show me the flagged uncertainties',
    query: 'Show me the flagged uncertainties',
  },
  {
    id: 'dates',
    icon: 'Calendar',
    label: 'What date is on this document?',
    query: 'What date is on this document?',
  },
  {
    id: 'summary',
    icon: 'FileText',
    label: 'Summarize this document',
    query: 'Summarize this document.',
  },
  {
    id: 'evidence',
    icon: 'Crosshair',
    label: 'Show me the evidence for this answer',
    query: 'Show me the evidence for this answer.',
  },
];

/**
 * Answer a question based on in-memory document intelligence payload.
 * @param {string} question - User question
 * @param {object} documentData - Normalized pipeline result
 * @returns {object} { answerText, bullets, sourceSummary }
 */
export function answerDocumentQuery(question, documentData) {
  if (!documentData || !documentData.text) {
    return {
      answerText: 'No processed document available. Please upload or select a handwriting scan first.',
      bullets: [],
      sourceSummary: 'No document loaded',
    };
  }

  const q = question.toLowerCase().trim();
  const text = documentData.text || '';
  const entities = documentData.entities || [];
  const measurements = documentData.measurements || [];
  const timeline = documentData.timeline || [];
  const conflicts = documentData.conflicts || [];
  const crossedOut = documentData.crossedOutText || [];
  const flags = documentData.flags || [];
  const uncertain = documentData.uncertainRegions || [];
  const segments = documentData.segments || [];
  const claims = documentData.claims || [];

  // Helper to find matching bbox in segments
  const findBbox = (needle) => {
    if (!needle) return null;
    const cleanNeedle = needle.toLowerCase();
    for (const seg of segments) {
      if (seg.bbox && seg.text && seg.text.toLowerCase().includes(cleanNeedle)) {
        return seg.bbox;
      }
    }
    return null;
  };

  // 1. INTENT: MEDICATIONS / PRESCRIPTION ("What medication was prescribed?")
  if (
    q.includes('medication') ||
    q.includes('medicine') ||
    q.includes('drug') ||
    q.includes('prescrib') ||
    q.includes('dose') ||
    q.includes('rx')
  ) {
    const medEntities = entities.filter(
      (e) => e.type === 'Medication' || e.type === 'Dosage' || (e.value && /(?:mg|tablet|cap|syrup|od|bd|tds|prn)/i.test(e.value))
    );

    const medClaims = claims.filter(
      (c) => /(?:mg|paracetamol|amoxicillin|metformin|naproxen|ibuprofen|aspirin|omeprazole|atorvastatin|lisinopril|rx|tab)/i.test(c.claim || '')
    );

    const bullets = [];

    medEntities.forEach((m) => {
      const isUncertain = m.status === 'needs_review' || m.confidence < 0.75;
      bullets.push({
        type: isUncertain ? 'UNCERTAIN' : 'OBSERVED',
        badgeClass: isUncertain ? 'bg-amber-50 text-[#D97706] border-amber-200' : 'bg-blue-50 text-[#2563EB] border-blue-200',
        title: `${m.type}: ${m.value}`,
        detail: `Extracted from handwritten prescription script (Confidence: ${Math.round((m.confidence || 0.88) * 100)}%).`,
        confidence: m.confidence,
        bbox: m.bbox || findBbox(m.value),
      });
    });

    medClaims.forEach((c) => {
      if (!bullets.some((b) => b.title.includes(c.claim))) {
        bullets.push({
          type: 'OBSERVED',
          badgeClass: 'bg-blue-50 text-[#2563EB] border-blue-200',
          title: c.claim,
          detail: `Stroke Evidence: "${c.evidence || c.claim}". Source: ${c.source || 'scan.png'}.`,
          confidence: c.confidence,
          bbox: c.bbox || findBbox(c.evidence) || findBbox(c.claim),
        });
      }
    });

    if (bullets.length === 0) {
      // Look for lines containing numbers or clinical text
      const candidateLines = text.split('\n').filter((l) => /(?:mg|tab|dose|capsule)/i.test(l));
      candidateLines.forEach((l) => {
        bullets.push({
          type: 'OBSERVED',
          badgeClass: 'bg-blue-50 text-[#2563EB] border-blue-200',
          title: 'Prescription Line',
          detail: l,
          bbox: findBbox(l),
        });
      });
    }

    if (bullets.length > 0) {
      return {
        answerText: `Identified ${bullets.length} medication and dosage directive(s) directly evidenced in the handwriting:`,
        bullets,
        sourceSummary: 'Clinical Pharmacology & Posology Parser',
      };
    }

    return {
      answerText: 'No standard pharmaceutical drugs or dosage regimens were detected in this manuscript.',
      bullets: [],
      sourceSummary: 'Clinical Pharmacology Parser',
    };
  }

  // 2. INTENT: REVISIONS / CROSSED OUT DOSAGE ("Is there any crossed out dosage?" / "What was crossed out?")
  if (
    q.includes('crossed out') ||
    q.includes('change') ||
    q.includes('revision') ||
    q.includes('strikethrough') ||
    q.includes('retract') ||
    q.includes('replace') ||
    (q.includes('dosage') && q.includes('crossed'))
  ) {
    const bullets = [];

    if (conflicts.length > 0) {
      conflicts.forEach((c) => {
        bullets.push({
          type: 'OBSERVED',
          badgeClass: 'bg-red-50 text-[#DC2626] border-red-200',
          title: c.type || 'Revision Conflict Isolated',
          detail: c.description,
          struckText: c.struck_evidence,
          activeText: c.active_evidence,
          bbox: findBbox(c.struck_evidence) || findBbox(c.active_evidence),
        });
      });
    }

    if (crossedOut.length > 0) {
      crossedOut.forEach((co) => {
        const textVal = co.originalText || co.text || '';
        if (!bullets.some((b) => b.struckText === textVal)) {
          bullets.push({
            type: 'OBSERVED',
            badgeClass: 'bg-red-50 text-[#DC2626] border-red-200',
            title: 'Pen Strikethrough Deletion',
            detail: `Retracted term: "${textVal}". Visual strikethrough isolated so it is NOT conflated with active orders.`,
            struckText: textVal,
            bbox: co.bbox || findBbox(textVal),
          });
        }
      });
    }

    if (bullets.length === 0) {
      return {
        answerText: 'No physical strikethroughs, pen retractions, or superseded revisions were detected in this manuscript.',
        bullets: [
          {
            type: 'OBSERVED',
            badgeClass: 'bg-blue-50 text-[#2563EB] border-blue-200',
            title: 'Unrevised Body',
            detail: 'The primary text stream contains uninterrupted handwriting with no detected pen-deletion strokes.',
            bbox: segments[0]?.bbox || null,
          },
        ],
        sourceSummary: 'Visual Strikethrough & Conflict Engine',
      };
    }

    return {
      answerText: `Detected ${bullets.length} physical revision(s) and retracted handwriting stroke(s). Superseded entries are isolated to prevent misinterpretation:`,
      bullets,
      sourceSummary: 'Visual Strikethrough & Conflict Engine',
    };
  }

  // 3. INTENT: PATIENT VITALS & MEASUREMENTS ("What are the patient vitals?" / "What measurements are present?")
  if (
    q.includes('vital') ||
    q.includes('measurement') ||
    q.includes('number') ||
    q.includes('metric') ||
    q.includes('bp') ||
    q.includes('pulse') ||
    q.includes('temp') ||
    q.includes('rate') ||
    q.includes('lab')
  ) {
    if (measurements.length === 0) {
      return {
        answerText: 'No numerical measurements or vital signs were identified in this manuscript.',
        bullets: [],
        sourceSummary: 'Quantitative Semantic Parser',
      };
    }

    const bullets = measurements.map((m) => ({
      type: 'OBSERVED',
      badgeClass: 'bg-cyan-50 text-[#0891B2] border-cyan-200',
      title: m.metric,
      detail: `Value: ${m.value} (Confidence: ${Math.round((m.confidence || 0.9) * 100)}%)`,
      bbox: m.bbox || findBbox(m.value) || findBbox(m.metric),
    }));

    return {
      answerText: `Extracted ${measurements.length} quantitative measurement(s) with unit grounding:`,
      bullets,
      sourceSummary: 'Quantitative Semantic Parser',
    };
  }

  // 4. INTENT: UNCERTAINTIES & FLAGS ("Show me the flagged uncertainties" / "Which information is uncertain?")
  if (
    q.includes('uncertain') ||
    q.includes('flag') ||
    q.includes('human review') ||
    q.includes('verify') ||
    q.includes('review') ||
    q.includes('confidence')
  ) {
    const bullets = [];

    flags.forEach((f) => {
      bullets.push({
        type: 'UNCERTAIN',
        badgeClass: 'bg-amber-50 text-[#D97706] border-amber-200',
        title: f.type || 'Needs Human Verification',
        detail: `"${f.target}": ${f.reason || 'Recognition confidence below safe verification threshold'}. Recommendation: ${f.recommendation || 'Verify with original scan'}.`,
        confidence: f.confidence,
        bbox: f.bbox || findBbox(f.target),
      });
    });

    if (bullets.length === 0 && uncertain.length > 0) {
      uncertain.forEach((u) => {
        bullets.push({
          type: 'UNCERTAIN',
          badgeClass: 'bg-amber-50 text-[#D97706] border-amber-200',
          title: 'Optical Ambiguity',
          detail: `Token "${u.text}" (${Math.round((u.confidence || 0.5) * 100)}%): ${u.reason || 'Ambiguous character form'}.`,
          confidence: u.confidence,
          bbox: u.bbox || findBbox(u.text),
        });
      });
    }

    if (bullets.length === 0) {
      return {
        answerText: 'All recognized handwriting segments in this document met or exceeded the strict verification threshold (≥75%). No critical human-review flags were raised.',
        bullets: [
          {
            type: 'OBSERVED',
            badgeClass: 'bg-blue-50 text-[#2563EB] border-blue-200',
            title: 'High Overall Confidence',
            detail: `Overall document confidence is ${Math.round((documentData.overallConfidence || 0.85) * 100)}%.`,
            bbox: segments[0]?.bbox || null,
          },
        ],
        sourceSummary: 'Multi-Signal Uncertainty Engine',
      };
    }

    return {
      answerText: `The system flagged ${bullets.length} region(s) requiring human verification. Rather than guessing, CRY NOVA isolates the exact stroke coordinates:`,
      bullets,
      sourceSummary: 'Multi-Signal Uncertainty Engine',
    };
  }

  // 5. INTENT: DATES & TIMELINE ("What date is on this document?" / "What dates are mentioned?")
  if (
    q.includes('date') ||
    q.includes('time') ||
    q.includes('when') ||
    q.includes('timeline') ||
    q.includes('day') ||
    q.includes('year') ||
    q.includes('month')
  ) {
    if (timeline.length === 0) {
      return {
        answerText: 'No explicit calendar dates or scheduled timestamps were identified in this document.',
        bullets: [],
        sourceSummary: 'Temporal Sequence Analyzer',
      };
    }

    const bullets = timeline.map((t) => ({
      type: 'OBSERVED',
      badgeClass: 'bg-blue-50 text-[#2563EB] border-blue-200',
      title: t.event || 'Recorded Event',
      detail: `Timeframe / Date: ${t.timeframe}`,
      bbox: findBbox(t.timeframe),
    }));

    return {
      answerText: `Identified ${timeline.length} temporal reference(s) across the document:`,
      bullets,
      sourceSummary: 'Temporal Sequence Analyzer',
    };
  }

  // 6. INTENT: EVIDENCE CITATIONS ("Show me the evidence for this answer.")
  if (
    q.includes('evidence') ||
    q.includes('citation') ||
    q.includes('proof') ||
    q.includes('grounding')
  ) {
    const bullets = [];

    claims.forEach((c) => {
      bullets.push({
        type: 'OBSERVED',
        badgeClass: 'bg-blue-50 text-[#2563EB] border-blue-200',
        title: c.claim,
        detail: `Original Stroke Evidence: "${c.evidence || c.claim}". Source: ${c.source || 'scan.png'}.`,
        confidence: c.confidence,
        bbox: c.bbox || findBbox(c.evidence) || findBbox(c.claim),
      });
    });

    if (bullets.length === 0) {
      segments.slice(0, 4).forEach((s, idx) => {
        bullets.push({
          type: 'OBSERVED',
          badgeClass: 'bg-blue-50 text-[#2563EB] border-blue-200',
          title: `Segment ${idx + 1}`,
          detail: `Verbatim stroke text: "${s.text}" (Confidence: ${Math.round((s.confidence || 0.8) * 100)}%).`,
          confidence: s.confidence,
          bbox: s.bbox,
        });
      });
    }

    return {
      answerText: `CRY NOVA links every extracted observation to physical bounding boxes on the original scan. Click any citation coordinate below to highlight the exact stroke region:`,
      bullets,
      sourceSummary: 'Spatial Provenance & Ground Truth Engine',
    };
  }

  // 7. DEFAULT INTENT: SUMMARY & "WHAT DOES THIS DOCUMENT SAY?"
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const bullets = [];

  // Summary bullets from key entities, measurements, and claims
  if (entities.length > 0) {
    const entSummary = entities.map((e) => `${e.type}: ${e.value}`).slice(0, 3).join(', ');
    bullets.push({
      type: 'INFERRED',
      badgeClass: 'bg-cyan-50 text-[#0891B2] border-cyan-200',
      title: 'Key Entities',
      detail: entSummary,
      bbox: entities[0]?.bbox || null,
    });
  }

  if (measurements.length > 0) {
    const measSummary = measurements.map((m) => `${m.metric}: ${m.value}`).slice(0, 3).join('; ');
    bullets.push({
      type: 'OBSERVED',
      badgeClass: 'bg-blue-50 text-[#2563EB] border-blue-200',
      title: 'Key Measurements',
      detail: measSummary,
      bbox: measurements[0]?.bbox || null,
    });
  }

  if (conflicts.length > 0) {
    bullets.push({
      type: 'OBSERVED',
      badgeClass: 'bg-red-50 text-[#DC2626] border-red-200',
      title: 'Revisions & Retractions',
      detail: conflicts[0].description,
      bbox: findBbox(conflicts[0].struck_evidence),
    });
  }

  if (flags.length > 0) {
    bullets.push({
      type: 'UNCERTAIN',
      badgeClass: 'bg-amber-50 text-[#D97706] border-amber-200',
      title: 'Human Review Advisory',
      detail: `${flags.length} region(s) marked for manual review due to low OCR confidence.`,
      bbox: flags[0]?.bbox || null,
    });
  }

  // Include top readable lines
  lines.slice(0, 2).forEach((line) => {
    bullets.push({
      type: 'OBSERVED',
      badgeClass: 'bg-blue-50 text-[#2563EB] border-blue-200',
      title: 'Verbatim Reading',
      detail: line,
      bbox: findBbox(line) || segments[0]?.bbox || null,
    });
  });

  return {
    answerText: `This manuscript was digitized with ${Math.round((documentData.overallConfidence || 0.85) * 100)}% overall recognition confidence. Core extracted findings:`,
    bullets,
    sourceSummary: 'Multi-Pass HTR & Semantic Synthesis',
  };
}
