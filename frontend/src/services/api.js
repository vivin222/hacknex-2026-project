/**
 * HNX26EPS04 — Extreme Bad-Handwriting Digitizing Stack
 * Team: CRY NOVA | Frontend Engineering
 * Engineer: Vikash
 *
 * Dedicated API Service Adapter.
 * Integrates with Udhayan's FastAPI backend and Vivin's AI pipeline:
 * - Health Check: GET http://localhost:8000/api/health
 * - Processing:   POST http://localhost:8000/api/process (multipart/form-data, field: "image")
 * - Isolated Mock Layer: Fallback when backend is offline or running standalone demo
 */

export const API_CONFIG = {
  // Mode flag: 'auto' checks backend health first; 'mock' forces mock data; 'real' forces backend
  MODE: 'auto', // 'auto' | 'mock' | 'real'
  BASE_URL: 'http://localhost:8000',
  PROCESS_ENDPOINT: '/api/process',
  HEALTH_ENDPOINT: '/api/health',
  TIMEOUT_MS: 30000,
  MOCK_DELAY_MS: 1800,
};

/**
 * Check if Udhayan's FastAPI backend is active and responsive.
 * @returns {Promise<{ online: boolean, service?: string, error?: string }>}
 */
export async function checkBackendHealth() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);

  try {
    const res = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.HEALTH_ENDPOINT}`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      return { online: true, service: data.service || 'cry-nova-backend' };
    }
    return { online: false, error: `HTTP ${res.status}: ${res.statusText}` };
  } catch (err) {
    clearTimeout(timeout);
    return { online: false, error: err.name === 'AbortError' ? 'Connection timed out' : 'Backend offline' };
  }
}

/**
 * Normalizes backend responses from Udhayan's FastAPI / Vivin's AI pipeline
 * to guarantee complete compatibility with the frontend UI components.
 */
function normalizePipelineResult(rawResult, sourceName = 'upload.png') {
  if (!rawResult) {
    throw new Error('Received empty response from processing service.');
  }

  // Handle Udhayan's Lap 2 explicit disconnected status
  if (rawResult.status === 'ai_pipeline_not_connected' || rawResult.success === false) {
    if (rawResult.status === 'ai_pipeline_not_connected') {
      return {
        success: false,
        isAiDisconnected: true,
        message: rawResult.message || 'FastAPI backend connected, but Vivin AI pipeline is not yet linked.',
        detail: rawResult.processingInfo?.note || 'Awaiting src.pipeline integration in Lap 4.',
        rawResult,
      };
    }
    throw new Error(rawResult.detail || rawResult.message || rawResult.errorMessage || 'Processing was unsuccessful.');
  }

  // Normalize segments
  const segments = Array.isArray(rawResult.segments) ? rawResult.segments : [];

  // Normalize uncertain regions
  const uncertainRegions = (rawResult.uncertainRegions || []).map((r, idx) => ({
    id: r.id || `u-${idx + 1}`,
    text: r.text || '',
    confidence: typeof r.confidence === 'number' ? r.confidence : 0.5,
    reason: r.reason || 'Visual glyph ambiguity',
    line: r.line || (r.bbox ? `BBox [${r.bbox.slice(0, 2).join(', ')}]` : undefined),
    alternatives: r.suggested_alternatives || r.alternatives || [],
    bbox: r.bbox || null,
  }));

  // Normalize margin notes
  const marginNotes = (rawResult.marginNotes || []).map((m, idx) => ({
    id: m.id || `m-${idx + 1}`,
    text: m.text || m.originalText || '',
    position: m.position || (m.bbox ? `Margin [${m.bbox.join(', ')}]` : 'Peripheral Margin'),
    confidence: typeof m.confidence === 'number' ? m.confidence : 0.85,
    orientation: m.orientation || 'horizontal',
  }));

  // Normalize crossed-out text
  const crossedOutText = (rawResult.crossedOutText || []).map((c, idx) => ({
    id: c.id || `c-${idx + 1}`,
    originalText: c.originalText || c.text || '',
    reason: c.reason || 'Pen strikethrough detected',
    position: c.position || (c.bbox ? `Line near [${c.bbox.join(', ')}]` : 'Retracted text'),
    confidence: typeof c.confidence === 'number' ? c.confidence : 0.8,
  }));

  // Normalize processing info
  const proc = rawResult.processingInfo || {};
  const processingInfo = {
    engine: proc.engine || (proc.vlmUsed ? 'Vivin AI (HTR + VLM + LLM)' : 'CRY NOVA Dual-Stage OCR'),
    processingTimeMs: Math.round(proc.processingTimeMs || 1400),
    preProcessingApplied: proc.preProcessingApplied || proc.preprocessingApplied || ['Adaptive Binarization', 'Deskew Rectification'],
    detectedLanguage: proc.detectedLanguage || 'English (Handwritten Script)',
    resolutionDpi: proc.resolutionDpi || 300,
    contrastRatio: proc.contrastRatio || 'Enhanced',
    sourceFilename: proc.source_image || sourceName,
    isRealBackend: true,
  };

  return {
    success: true,
    text: rawResult.text || '',
    segments,
    overallConfidence: typeof rawResult.overallConfidence === 'number' ? rawResult.overallConfidence : 0.85,
    uncertainRegions,
    marginNotes,
    crossedOutText,
    rawOcrText: rawResult.rawOcrText || rawResult.text || '',
    vlmAnalysis: rawResult.vlmAnalysis || null,
    processingInfo,
  };
}

/**
 * Standard Presets representing distinct challenging handwriting archetypes
 * for judges to test immediately without searching for external image files.
 */
export const SAMPLE_PRESETS = [
  {
    id: 'clinical',
    title: 'Clinical Prescription & Doctor Note',
    tag: 'Medical Cursive',
    description: 'Notoriously illegible physician script with rapid ligatures, dosages, and strike-through revisions.',
    data: {
      success: true,
      text: "Patient exhibits recurring bilateral migraine episodes with aura. Recommended initiating Propranolol 40mg daily with titration after two weeks if refractory. Avoid excessive caffeine intake and maintain hydration protocol. Follow-up scheduled in clinic on 24th October.",
      segments: [
        { id: 's1', text: "Patient exhibits recurring bilateral migraine episodes with aura.", confidence: 0.94, line: 1 },
        { id: 's2', text: "Recommended initiating Propranolol 40mg daily with titration after two weeks if refractory.", confidence: 0.74, line: 2 },
        { id: 's3', text: "Avoid excessive caffeine intake and maintain hydration protocol.", confidence: 0.88, line: 3 },
        { id: 's4', text: "Follow-up scheduled in clinic on 24th October.", confidence: 0.82, line: 4 }
      ],
      overallConfidence: 0.84,
      uncertainRegions: [
        {
          id: 'u1',
          text: 'Propranolol 40mg',
          confidence: 0.52,
          reason: 'Visual ambiguity in cursive ligature & dosage numeral',
          severity: 'high',
          line: 2,
          alternatives: ['Propranolol 10mg', 'Propranolol 40mg', 'Popranol 40mg']
        },
        {
          id: 'u2',
          text: 'if refractory',
          confidence: 0.61,
          reason: 'Low OCR confidence — compressed descending strokes',
          severity: 'medium',
          line: 2,
          alternatives: ['if refractory', 'if necessary', 'if responsive']
        },
        {
          id: 'u3',
          text: 'hydration protocol',
          confidence: 0.69,
          reason: 'Ink bleed / overlapping ascenders with preceding line',
          severity: 'low',
          line: 3,
          alternatives: ['hydration protocol', 'hydration practice']
        },
        {
          id: 'u4',
          text: '24th October',
          confidence: 0.58,
          reason: 'Abbreviated date numeral ambiguity (possible 21st or 24th)',
          severity: 'medium',
          line: 4,
          alternatives: ['24th October', '21st October', '29th October']
        }
      ],
      marginNotes: [
        {
          id: 'm1',
          position: 'Top-Right Margin',
          text: 'BP 138/86 mmHg @ 09:15 AM — Triage Station #3',
          orientation: 'horizontal',
          confidence: 0.91
        },
        {
          id: 'm2',
          position: 'Left Margin (Vertical)',
          text: 'Alert: mild urticaria reported with sulfa derivatives in 2021',
          orientation: 'vertical',
          confidence: 0.86
        }
      ],
      crossedOutText: [
        {
          id: 'c1',
          originalText: 'Amitriptyline 25mg at bedtime',
          reason: 'Horizontal strike-out stroke across pharmaceutical entry',
          position: 'Line 2 (preceding Propranolol)',
          confidence: 0.89
        },
        {
          id: 'c2',
          originalText: 'Immediate referral to neuro specialist',
          reason: 'Double diagonal pen cancellation strokes',
          position: 'Line 4 (overwritten by clinic follow-up)',
          confidence: 0.78
        }
      ],
      rawOcrText: "Patnt exbts recurrng bilatral migrene epsdes w/ aura. Rec initiation [Amitriptyline 25mg] Propranol 40mg dly w/ titrtn aftr 2 wks if refractry. Avoid excsf cffne & hydrtn prtcl. [Refer neuro] F/U 24th Oct",
      processingInfo: {
        engine: 'CRY NOVA Mock Pipeline (Lap 3 Benchmark Mode)',
        processingTimeMs: 1420,
        preProcessingApplied: [
          'Adaptive Otsu Binarization',
          'Deskew Rectification (-2.4°)',
          'Stroke Line Baseline Segmentation',
          'Ligature Disambiguation'
        ],
        detectedLanguage: 'English (Medical Cursive)',
        resolutionDpi: 300,
        contrastRatio: '3.2:1 (Degraded Ballpoint Pen)',
        isRealBackend: false
      }
    }
  },
  {
    id: 'historical',
    title: 'Archival Expedition Field Journal (1912)',
    tag: 'Historical Cursive',
    description: 'Heavily weathered parchment with iron-gall ink fading, margin sketches, and moisture stains.',
    data: {
      success: true,
      text: "At dawn the northern ridge remained shrouded in dense freezing mist. Barometer registered twenty-six point four inches indicating prolonged depression. Pack mules exhibited extreme fatigue after traversing the jagged limestone gully. Camp fortified beneath the western cliff face.",
      segments: [
        { id: 's1', text: "At dawn the northern ridge remained shrouded in dense freezing mist.", confidence: 0.76, line: 1 },
        { id: 's2', text: "Barometer registered twenty-six point four inches indicating prolonged depression.", confidence: 0.81, line: 2 },
        { id: 's3', text: "Pack mules exhibited extreme fatigue after traversing the jagged limestone gully.", confidence: 0.77, line: 3 },
        { id: 's4', text: "Camp fortified beneath the western cliff face.", confidence: 0.85, line: 4 }
      ],
      overallConfidence: 0.79,
      uncertainRegions: [
        {
          id: 'u1',
          text: 'shrouded in dense',
          confidence: 0.45,
          reason: 'Faded iron-gall ink and moisture blotch degradation',
          severity: 'high',
          line: 1,
          alternatives: ['shrouded in dense', 'shrouded in damp', 'covered in dense']
        },
        {
          id: 'u2',
          text: 'twenty-six point four',
          confidence: 0.62,
          reason: 'Visual ambiguity in cursive numeral spelled in full',
          severity: 'medium',
          line: 2,
          alternatives: ['twenty-six point four', 'twenty-six point five', 'twenty-six point two']
        },
        {
          id: 'u3',
          text: 'jagged limestone',
          confidence: 0.55,
          reason: 'Low OCR confidence — paper fissure across word ascenders',
          severity: 'high',
          line: 3,
          alternatives: ['jagged limestone', 'rugged limestone', 'jagged riverbed']
        }
      ],
      marginNotes: [
        {
          id: 'm1',
          position: 'Top Header',
          text: 'Camp XII — Oct 14th, 1912 — Wind SSW force 6',
          orientation: 'horizontal',
          confidence: 0.92
        },
        {
          id: 'm2',
          position: 'Bottom Margin Note',
          text: 'Altimeter datum ~4,200m; water boiling point test at 86.2°C',
          orientation: 'horizontal',
          confidence: 0.84
        }
      ],
      crossedOutText: [
        {
          id: 'c1',
          originalText: 'Advance across eastern glacier route commenced',
          reason: 'Single heavy strikethrough stroke following route change',
          position: 'Line 1 (superseded by northern ridge entry)',
          confidence: 0.88
        }
      ],
      rawOcrText: "At dwn n0rthern rdge remnd shrd'd in dnse mist. Baromtr reg 26.4 in prlngd deprsn. Pck mles exhbtd xtrme fatgue trvrsng jggd lmestne glly. Cmp fortfd bnth wst cliff.",
      processingInfo: {
        engine: 'CRY NOVA Mock Pipeline (Lap 3 Benchmark Mode)',
        processingTimeMs: 1780,
        preProcessingApplied: [
          'Color Deconvolution (Iron-Gall Separation)',
          'Morphological Paper Stain Attenuation',
          'Historical Baseline Normalization'
        ],
        detectedLanguage: 'English (Early 20th C. Script)',
        resolutionDpi: 400,
        contrastRatio: '2.1:1 (Severe Weather Wear)',
        isRealBackend: false
      }
    }
  },
  {
    id: 'engineering',
    title: 'Fast-Paced Engineering Architecture Scrawl',
    tag: 'Technical Shorthand',
    description: 'Rapid developer whiteboard / lined notebook scribbles with arrows, deletions, and acronyms.',
    data: {
      success: true,
      text: "Decided on asynchronous event bus for distributed ingestion pipeline. Worker nodes will poll telemetry queue with backoff strategy to avoid overwhelming Cassandra clusters. Implement Redis lock for leader election across redundant coordinator instances. Deploy canary build to staging cluster on Wednesday evening.",
      segments: [
        { id: 's1', text: "Decided on asynchronous event bus for distributed ingestion pipeline.", confidence: 0.92, line: 1 },
        { id: 's2', text: "Worker nodes will poll telemetry queue with backoff strategy to avoid overwhelming Cassandra clusters.", confidence: 0.89, line: 2 },
        { id: 's3', text: "Implement Redis lock for leader election across redundant coordinator instances.", confidence: 0.95, line: 3 },
        { id: 's4', text: "Deploy canary build to staging cluster on Wednesday evening.", confidence: 0.87, line: 4 }
      ],
      overallConfidence: 0.91,
      uncertainRegions: [
        {
          id: 'u1',
          text: 'asynchronous event bus',
          confidence: 0.68,
          reason: 'Rushed cursive ligature across technical compound phrase',
          severity: 'medium',
          line: 1,
          alternatives: ['asynchronous event bus', 'asynchronous event queue', 'async messaging bus']
        },
        {
          id: 'u2',
          text: 'Cassandra clusters',
          confidence: 0.71,
          reason: 'Visual ambiguity — non-dictionary proper noun scrawl',
          severity: 'low',
          line: 2,
          alternatives: ['Cassandra clusters', 'Cassandra nodes', 'database clusters']
        },
        {
          id: 'u3',
          text: 'Wednesday evening',
          confidence: 0.64,
          reason: 'Low OCR confidence — cramped handwriting near page gutter',
          severity: 'medium',
          line: 4,
          alternatives: ['Wednesday evening', 'Thursday evening', 'Wednesday morning']
        }
      ],
      marginNotes: [
        {
          id: 'm1',
          position: 'Right Margin Asterisk (*)',
          text: 'Validate 99.9th percentile latency SLA with SRE team before load testing',
          orientation: 'horizontal',
          confidence: 0.94
        }
      ],
      crossedOutText: [
        {
          id: 'c1',
          originalText: 'Kafka direct stream partitioning architecture',
          reason: 'Wavy horizontal cancellation scribble',
          position: 'Line 1 (replaced with event bus)',
          confidence: 0.87
        },
        {
          id: 'c2',
          originalText: 'Target Friday midnight launch',
          reason: 'Cross-hatched strikethrough lines',
          position: 'Line 4 (moved earlier to Wednesday)',
          confidence: 0.82
        }
      ],
      rawOcrText: "Dcded on async evnt bs for dstrbtd ingstn. [Kafka direct stream] Wrkr ndes poll queue w/ bkoff to avd ovrwhelmng Cassndra clstrs. Imp Redis lck. [Friday launch] Dply cnry to stg Wed evng.",
      processingInfo: {
        engine: 'CRY NOVA Mock Pipeline (Lap 3 Benchmark Mode)',
        processingTimeMs: 1150,
        preProcessingApplied: [
          'Ruled-Line Spectral Subtraction',
          'Stroke Binarization',
          'Cursive Slant Rectification (+12°)'
        ],
        detectedLanguage: 'English (Technical Shorthand)',
        resolutionDpi: 300,
        contrastRatio: '4.5:1 (Ballpoint Pen on Ruled Pad)',
        isRealBackend: false
      }
    }
  }
];

/**
 * Main API function to process a handwriting image.
 * Works seamlessly with Mock Data or Real FastAPI Backend.
 *
 * @param {File|Blob|string} imageSource - The uploaded File object, Blob, or preset identifier
 * @param {Object} options - Optional configuration overrides
 * @returns {Promise<Object>} Formatted result adhering to HNX26EPS04 schema
 */
export async function processImage(imageSource, options = {}) {
  const mode = options.mode || API_CONFIG.MODE;

  // If in 'auto' or 'real' mode, check if real backend can be queried
  let tryBackend = mode === 'real';
  if (mode === 'auto') {
    const health = await checkBackendHealth();
    tryBackend = health.online;
  }

  if (tryBackend) {
    try {
      const formData = new FormData();
      let sourceName = 'uploaded_scan.png';

      if (imageSource instanceof File) {
        formData.append('image', imageSource, imageSource.name);
        sourceName = imageSource.name;
      } else if (imageSource instanceof Blob) {
        formData.append('image', imageSource, 'uploaded_scan.png');
      } else if (typeof imageSource === 'string' && imageSource.startsWith('data:')) {
        const response = await fetch(imageSource);
        const blob = await response.blob();
        formData.append('image', blob, 'preset_scan.png');
        sourceName = 'preset_scan.png';
      } else {
        throw new Error('Invalid image source provided for backend upload.');
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT_MS);

      const res = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.PROCESS_ENDPOINT}`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        let errDetail = res.statusText;
        try {
          const errJson = await res.json();
          errDetail = errJson.detail || errJson.message || errDetail;
        } catch (_) {}
        throw new Error(`Backend error (${res.status}): ${errDetail}`);
      }

      const backendData = await res.json();
      return normalizePipelineResult(backendData, sourceName);
    } catch (err) {
      // If user explicitly forced real mode, surface error
      if (mode === 'real') {
        throw err;
      }
      // Otherwise in 'auto' mode, log warning and gracefully fall back to mock
      console.warn(`Backend call failed (${err.message}). Falling back to local mock pipeline.`);
    }
  }

  // MOCK PROCESSING PIPELINE (LAP 3 PROTOTYPE)
  const delay = options.delayMs ?? API_CONFIG.MOCK_DELAY_MS;
  await new Promise((resolve) => setTimeout(resolve, delay));

  // Determine preset or dynamic mock result based on image
  let selectedPreset = SAMPLE_PRESETS[0]; // Default: clinical
  if (options.presetId) {
    const found = SAMPLE_PRESETS.find(p => p.id === options.presetId);
    if (found) selectedPreset = found;
  } else if (imageSource instanceof File) {
    const name = imageSource.name.toLowerCase();
    if (name.includes('history') || name.includes('journal') || name.includes('old') || name.includes('1912')) {
      selectedPreset = SAMPLE_PRESETS[1];
    } else if (name.includes('tech') || name.includes('code') || name.includes('eng') || name.includes('note')) {
      selectedPreset = SAMPLE_PRESETS[2];
    } else {
      const index = (imageSource.size + imageSource.name.length) % SAMPLE_PRESETS.length;
      selectedPreset = SAMPLE_PRESETS[index];
    }
  }

  // Deep clone
  const result = JSON.parse(JSON.stringify(selectedPreset.data));

  if (imageSource instanceof File) {
    result.processingInfo.filename = imageSource.name;
    result.processingInfo.fileSizeKb = Math.round(imageSource.size / 1024);
  }

  return result;
}

/**
 * Validates uploaded files before submitting to the pipeline.
 */
export function validateImageFile(file) {
  if (!file) {
    return { valid: false, error: 'No image file provided. Please select or drop a handwriting scan.' };
  }

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/bmp', 'image/tiff'];
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: `Unsupported format (${file.type || 'unknown'}). Supported: PNG, JPG/JPEG, WEBP, BMP, TIFF.`
    };
  }

  const MAX_SIZE_MB = 10; // Aligned with Udhayan's backend default (10MB)
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return {
      valid: false,
      error: `File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed size is ${MAX_SIZE_MB}MB.`
    };
  }

  return { valid: true };
}
