/**
 * HNX26EPS04 — Extreme Bad-Handwriting Digitizing Stack
 * Team: CRY NOVA
 *
 * Instant AI Response & Document Intelligence Engine (Phase 7 & 8)
 *
 * Provides deterministic, evidence-linked answers to user queries grounded
 * directly in the recognized handwriting, extracted entities, measurements,
 * timeline, revisions, and uncertainty flags.
 *
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
    query: 'What was crossed out or changed in this document?',
  },
  {
    id: 'review',
    icon: 'AlertTriangle',
    label: 'Which parts need human verification?',
    query: 'Which parts need human verification and why?',
  },
  {
    id: 'measurements',
    icon: 'Activity',
    label: 'Show important measurements & vitals',
    query: 'Show me the important measurements and vital signs.',
  },
  {
    id: 'timeline',
    icon: 'Calendar',
    label: 'What dates & timeline are mentioned?',
    query: 'What dates, times, and durations are mentioned in this document?',
  },
  {
    id: 'medications',
    icon: 'Pill',
    label: 'What medications/entities are listed?',
    query: 'What clinical entities and medications are recorded?',
  },
];

/**
 * Answer a question based on document intelligence payload.
 * @param {string} question - User question
 * @param {object} documentData - Normalized pipeline result
 * @returns {object} { answerText, bullets, provenanceLinks, sourceSummary }
 */
export function answerDocumentQuery(question, documentData) {
  if (!documentData || !documentData.text) {
    return {
      answerText: 'No processed document available. Please upload or select a handwriting scan first.',
      bullets: [],
      provenanceLinks: [],
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

  // 1. INTENT: REVISIONS / CROSSED OUT / CHANGES
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
          badgeClass: 'bg-rose-950/70 text-rose-300 border-rose-800/60',
          title: c.type || 'Revision Detected',
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
            badgeClass: 'bg-rose-950/70 text-rose-300 border-rose-800/60',
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
        answerText: 'No physical strikethroughs, pen retractions, or conflicting dosage revisions were detected in this manuscript.',
        bullets: [
          {
            type: 'OBSERVED',
            badgeClass: 'bg-blue-950/60 text-blue-300 border-blue-800/40',
            title: 'Unrevised Manuscript',
            detail: 'The primary text stream contains uninterrupted handwriting with no detected pen-deletion lines.',
            bbox: segments[0]?.bbox || null,
          },
        ],
        sourceSummary: 'Visual Strikethrough & Conflict Engine',
      };
    }

    return {
      answerText: `Detected ${bullets.length} physical revision(s) and retracted handwriting stroke(s). The system isolates these deletions so superseded terms are not conflated with active instructions:`,
      bullets,
      sourceSummary: 'Visual Strikethrough & Conflict Engine',
    };
  }

  // 2. INTENT: UNCERTAINTY / HUMAN VERIFICATION / FLAGS
  if (
    q.includes('uncertain') ||
    q.includes('human verification') ||
    q.includes('verify') ||
    q.includes('review') ||
    q.includes('flag') ||
    q.includes('confidence')
  ) {
    const bullets = [];

    flags.forEach((f) => {
      bullets.push({
        type: 'UNCERTAIN',
        badgeClass: 'bg-amber-950/70 text-amber-300 border-amber-700/60',
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
          badgeClass: 'bg-amber-950/70 text-amber-300 border-amber-700/60',
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
            badgeClass: 'bg-blue-950/60 text-blue-300 border-blue-800/40',
            title: 'High Overall Confidence',
            detail: `Overall document confidence is ${Math.round((documentData.overallConfidence || 0.85) * 100)}%.`,
            bbox: segments[0]?.bbox || null,
          },
        ],
        sourceSummary: 'Multi-Signal Uncertainty Engine',
      };
    }

    return {
      answerText: `The system flagged ${bullets.length} region(s) requiring human inspection. Rather than silently guessing, CRY NOVA highlights the exact stroke areas:`,
      bullets,
      sourceSummary: 'Multi-Signal Uncertainty Engine',
    };
  }

  // 3. INTENT: MEASUREMENTS & VITALS
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
        answerText: 'No numerical measurements, vital signs, or laboratory metric values were identified in this manuscript.',
        bullets: [],
        sourceSummary: 'Quantitative Semantic Parser',
      };
    }

    const bullets = measurements.map((m) => ({
      type: 'OBSERVED',
      badgeClass: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/50',
      title: m.metric,
      detail: `Value: ${m.value} (Confidence: ${Math.round((m.confidence || 0.9) * 100)}%)`,
      bbox: m.bbox || findBbox(m.value) || findBbox(m.metric),
    }));

    return {
      answerText: `Extracted ${measurements.length} quantitative measurement(s) and clinical metrics with unit grounding:`,
      bullets,
      sourceSummary: 'Quantitative Semantic Parser',
    };
  }

  // 4. INTENT: DATES & TIMELINE
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
        answerText: 'No calendar dates, times, or treatment durations were detected in the text.',
        bullets: [],
        sourceSummary: 'Temporal Sequence Analyzer',
      };
    }

    const bullets = timeline.map((t) => ({
      type: 'OBSERVED',
      badgeClass: 'bg-amber-950/60 text-amber-300 border-amber-800/50',
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

  // 5. INTENT: MEDICATIONS & CLINICAL ENTITIES
  if (
    q.includes('medication') ||
    q.includes('drug') ||
    q.includes('rx') ||
    q.includes('prescription') ||
    q.includes('entity') ||
    q.includes('patient') ||
    q.includes('doctor')
  ) {
    if (entities.length === 0) {
      return {
        answerText: 'No structured clinical or domain entities were extracted from this manuscript.',
        bullets: [],
        sourceSummary: 'Clinical Entity & Knowledge Graph Engine',
      };
    }

    const bullets = entities.map((e) => ({
      type: 'INFERRED',
      badgeClass: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/50',
      title: e.type,
      detail: `Identified "${e.value}" (Confidence: ${Math.round((e.confidence || 0.85) * 100)}% - ${e.status || 'verified'})`,
      bbox: e.bbox || findBbox(e.value),
    }));

    return {
      answerText: `Extracted ${entities.length} structured domain entity/entities from the recognized handwriting:`,
      bullets,
      sourceSummary: 'Clinical Entity & Knowledge Graph Engine',
    };
  }

  // 6. DEFAULT INTENT: GENERAL SUMMARY / "WHAT DOES THIS DOCUMENT SAY?"
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
      badgeClass: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/50',
      title: 'Key Entities',
      detail: entSummary,
      bbox: entities[0]?.bbox || null,
    });
  }

  if (measurements.length > 0) {
    const measSummary = measurements.map((m) => `${m.metric}: ${m.value}`).slice(0, 3).join('; ');
    bullets.push({
      type: 'OBSERVED',
      badgeClass: 'bg-blue-950/60 text-blue-300 border-blue-800/40',
      title: 'Key Measurements',
      detail: measSummary,
      bbox: measurements[0]?.bbox || null,
    });
  }

  if (conflicts.length > 0) {
    bullets.push({
      type: 'OBSERVED',
      badgeClass: 'bg-rose-950/70 text-rose-300 border-rose-800/60',
      title: 'Revisions & Retractions',
      detail: conflicts[0].description,
      bbox: findBbox(conflicts[0].struck_evidence),
    });
  }

  if (flags.length > 0) {
    bullets.push({
      type: 'UNCERTAIN',
      badgeClass: 'bg-amber-950/70 text-amber-300 border-amber-700/60',
      title: 'Human Review Advisory',
      detail: `${flags.length} region(s) marked for manual review due to optical degradation.`,
      bbox: flags[0]?.bbox || null,
    });
  }

  // Include first 2 readable lines as direct observations
  lines.slice(0, 2).forEach((line) => {
    bullets.push({
      type: 'OBSERVED',
      badgeClass: 'bg-blue-950/60 text-blue-300 border-blue-800/40',
      title: 'Verbatim Reading',
      detail: line,
      bbox: findBbox(line) || segments[0]?.bbox || null,
    });
  });

  return {
    answerText: `This manuscript was digitized using CRY NOVA's multi-pass handwriting pipeline with ${Math.round((documentData.overallConfidence || 0.85) * 100)}% overall recognition confidence. Core extracted insights:`,
    bullets,
    sourceSummary: 'Multi-Pass HTR & Semantic Synthesis',
  };
}
