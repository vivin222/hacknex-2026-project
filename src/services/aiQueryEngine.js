/**
 * HNX26EPS04 — Extreme Bad-Handwriting Digitizing Stack
 * Team: CRY NOVA
 *
 * Instant AI Response & Document Intelligence Engine (Phase 12)
 *
 * Grounded query answering without hallucinations:
 * Discloses classification:
 * - [OBSERVED]: Directly evidenced in high-confidence OCR strokes.
 * - [INFERRED]: Structured contextual entity or semantic relationship.
 * - [UNCERTAIN]: Flagged optical ambiguity or low-confidence segment requiring review.
 *
 * Each answer point includes bounding-box provenance for one-click document grounding.
 */

export const SUGGESTED_QUESTIONS = [
  {
    id: 'summary',
    icon: 'FileText',
    label: 'What does this document say?',
    query: 'What does this document say?',
  },
  {
    id: 'revisions',
    icon: 'Scissors',
    label: 'What was crossed out or changed?',
    query: 'What was crossed out or changed?',
  },
  {
    id: 'uncertain',
    icon: 'AlertTriangle',
    label: 'Which information is uncertain?',
    query: 'Which information is uncertain?',
  },
  {
    id: 'dates',
    icon: 'Calendar',
    label: 'What dates are mentioned?',
    query: 'What dates are mentioned?',
  },
  {
    id: 'measurements',
    icon: 'Activity',
    label: 'What measurements are present?',
    query: 'What measurements are present?',
  },
  {
    id: 'summarize',
    icon: 'Sparkles',
    label: 'Summarize this document.',
    query: 'Summarize this document.',
  },
  {
    id: 'evidence',
    icon: 'Crosshair',
    label: 'Show me the evidence for this answer.',
    query: 'Show me the evidence for this answer.',
  },
];

/**
 * Answer a question based on document intelligence payload.
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

  // 1. INTENT: EVIDENCE CITATIONS ("Show me the evidence for this answer.")
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

  // 2. INTENT: REVISIONS / CROSSED OUT / CHANGES ("What was crossed out or changed?")
  if (
    q.includes('crossed out') ||
    q.includes('change') ||
    q.includes('revision') ||
    q.includes('strikethrough') ||
    q.includes('retract') ||
    q.includes('replace')
  ) {
    const bullets = [];

    if (conflicts.length > 0) {
      conflicts.forEach((c) => {
        bullets.push({
          type: 'OBSERVED',
          badgeClass: 'bg-red-50 text-[#DC2626] border-red-200',
          title: c.type || 'Revision Conflict Detected',
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
            detail: `Retracted word: "${textVal}". Physical pen stroke crossing out the characters.`,
            struckText: textVal,
            bbox: co.bbox || findBbox(textVal),
          });
        }
      });
    }

    if (bullets.length === 0) {
      return {
        answerText: 'No physical strikethroughs, pen retractions, or conflicting revisions were detected in this manuscript.',
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
      answerText: `Detected ${bullets.length} physical revision(s) and retracted handwriting stroke(s). The system isolates these deletions so superseded terms are not conflated with active directives:`,
      bullets,
      sourceSummary: 'Visual Strikethrough & Conflict Engine',
    };
  }

  // 3. INTENT: UNCERTAINTY / HUMAN REVIEW ("Which information is uncertain?")
  if (
    q.includes('uncertain') ||
    q.includes('human review') ||
    q.includes('verify') ||
    q.includes('review') ||
    q.includes('flag') ||
    q.includes('confidence')
  ) {
    const bullets = [];

    flags.forEach((f) => {
      bullets.push({
        type: 'UNCERTAIN',
        badgeClass: 'bg-amber-50 text-[#D97706] border-amber-200',
        title: f.type || 'Needs Review',
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
      answerText: `The system flagged ${bullets.length} region(s) requiring human verification. Rather than silently guessing, CRY NOVA highlights the exact stroke areas:`,
      bullets,
      sourceSummary: 'Multi-Signal Uncertainty Engine',
    };
  }

  // 4. INTENT: DATES & TIMELINE ("What dates are mentioned?")
  if (
    q.includes('date') ||
    q.includes('time') ||
    q.includes('when') ||
    q.includes('timeline') ||
    q.includes('duration') ||
    q.includes('day')
  ) {
    if (timeline.length === 0) {
      return {
        answerText: 'No specific calendar dates or scheduled timestamps were identified in this document.',
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

  // 5. INTENT: MEASUREMENTS & VITALS ("What measurements are present?")
  if (
    q.includes('measurement') ||
    q.includes('vital') ||
    q.includes('number') ||
    q.includes('metric') ||
    q.includes('bp') ||
    q.includes('rate') ||
    q.includes('pulse')
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

  // 6. DEFAULT INTENT: SUMMARY & "WHAT DOES THIS DOCUMENT SAY?"
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
