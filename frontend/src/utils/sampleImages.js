/**
 * High-fidelity SVG sample handwriting data URLs for presets
 * Renders realistic degraded cursive handwriting for judge demonstrations.
 */

export const SAMPLE_IMAGES = {
  clinical: `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
  <defs>
    <filter id="ink-bleed" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.8" xChannelSelector="R" yChannelSelector="G" />
    </filter>
  </defs>
  <!-- Prescription pad background -->
  <rect width="800" height="500" fill="#fcfbf7" />
  <rect x="20" y="20" width="760" height="460" fill="none" stroke="#e2d9c8" stroke-width="2" />
  
  <!-- Clinic header print -->
  <text x="50" y="55" font-family="sans-serif" font-size="14" font-weight="bold" fill="#78716c">ST. JUDE REGIONAL CLINIC — NEUROLOGY DEPT</text>
  <text x="50" y="75" font-family="sans-serif" font-size="11" fill="#a8a29e">PATIENT ID: #98421-E • DR. K. REYNOLDS, MD • DATE: OCT 2026</text>
  <line x1="50" y1="88" x2="750" y2="88" stroke="#d6d3d1" stroke-width="1.5" />
  
  <!-- Prescription symbol -->
  <text x="50" y="130" font-family="serif" font-size="32" font-style="italic" font-weight="bold" fill="#44403c">Rx</text>
  
  <!-- Realistic messy doctor cursive handwriting strokes -->
  <g filter="url(#ink-bleed)" stroke="#1e293b" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.88">
    <!-- Line 1: Patient exhibits recurring bilateral migraine... -->
    <path d="M 120 130 Q 150 115 180 128 T 230 125 T 280 132 T 340 120 T 400 130 T 460 122 T 520 130 T 590 124 T 660 128 T 730 125" />
    <path d="M 125 125 Q 160 135 190 122 Q 220 110 240 135 Q 270 120 310 130 Q 360 115 410 132 Q 470 120 530 134 Q 600 118 670 130" stroke-width="1.8" />
    
    <!-- Crossed out medication line -->
    <path d="M 120 185 Q 180 175 240 188 T 320 180 T 400 186 T 470 182" opacity="0.5" stroke="#334155" />
    <!-- Strike-through pen stroke -->
    <path d="M 110 184 Q 280 178 480 182" stroke="#dc2626" stroke-width="3" opacity="0.75" />
    
    <!-- Line 2: Rec initiating Propranolol 40mg daily... -->
    <path d="M 120 225 Q 170 210 210 230 T 270 220 T 330 215 T 410 232 T 480 220 T 560 230 T 630 218 T 710 225" />
    <path d="M 330 205 Q 350 245 365 210 Q 380 240 410 215" stroke-width="3.2" stroke="#0f172a" /> <!-- Ambiguous "40mg" -->
    
    <!-- Line 3: Avoid excessive caffeine & hydration... -->
    <path d="M 120 280 Q 160 268 210 285 T 270 272 T 340 284 T 420 270 T 500 285 T 570 275 T 650 282 T 720 276" />
    
    <!-- Line 4: Crossed out referral -->
    <path d="M 120 335 Q 170 325 240 338 T 310 330" opacity="0.45" />
    <path d="M 115 332 L 320 332 M 120 338 L 315 328" stroke="#ef4444" stroke-width="2.2" opacity="0.8" />
    
    <!-- Clinic follow up on 24th Oct -->
    <path d="M 340 335 Q 390 320 440 336 T 510 328 T 580 335 T 670 325 T 730 332" />
    <path d="M 520 315 Q 545 350 560 320 Q 575 348 600 325" stroke-width="3" stroke="#0f172a" />
  </g>
  
  <!-- Margin Notes in ballpoint pen -->
  <!-- Top Right Margin -->
  <g transform="rotate(-3 600 70)" stroke="#1d4ed8" fill="#1d4ed8" opacity="0.85">
    <text x="500" y="65" font-family="cursive, sans-serif" font-size="12" font-style="italic">BP 138/86 mmHg @ 09:15 AM (Nurse #3)</text>
  </g>
  
  <!-- Left Margin Vertical Note -->
  <g transform="rotate(-90 40 320)" stroke="#b91c1c" fill="#b91c1c" opacity="0.85">
    <text x="-310" y="42" font-family="cursive, sans-serif" font-size="11" font-weight="bold">! Allergy: sulfa derivatives 2021</text>
  </g>
  
  <!-- Doctor signature scrawl -->
  <path d="M 540 430 Q 580 390 620 440 T 670 410 T 730 425 M 560 440 L 710 435" stroke="#1e293b" stroke-width="2.5" fill="none" opacity="0.75" />
</svg>
`)}`,

  historical: `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
  <!-- Aged parchment background -->
  <rect width="800" height="500" fill="#f5ede0" />
  <!-- Water damage & aging blotches -->
  <circle cx="220" cy="180" r="110" fill="#eddcc2" opacity="0.6" />
  <circle cx="620" cy="320" r="90" fill="#e6d2b5" opacity="0.5" />
  <rect x="25" y="25" width="750" height="450" fill="none" stroke="#d5be9b" stroke-width="1.5" />
  
  <!-- Header handwritten -->
  <text x="80" y="70" font-family="serif" font-size="16" font-style="italic" fill="#5c4428">Camp XII — Oct 14th, 1912 — Wind SSW force 6</text>
  <line x1="80" y1="80" x2="520" y2="80" stroke="#8c6d48" stroke-width="1" />
  
  <!-- Iron gall faded calligraphy ink strokes -->
  <g stroke="#3e2e1e" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.82">
    <!-- Crossed out glacier advance -->
    <path d="M 80 125 Q 140 115 210 130 T 320 122 T 420 128 T 510 120" opacity="0.5" />
    <line x1="75" y1="124" x2="515" y2="124" stroke="#5c4428" stroke-width="2.8" opacity="0.75" />
    
    <!-- Line 1: At dawn the northern ridge remained... -->
    <path d="M 80 170 Q 150 155 220 175 T 310 160 T 400 172 T 500 162 T 610 170 T 710 165" />
    <path d="M 85 165 Q 160 175 230 162 T 320 172 T 420 160 T 520 174 T 630 162 T 705 170" stroke-width="1.6" />
    
    <!-- Line 2: Barometer registered twenty-six point four inches... -->
    <path d="M 80 225 Q 160 210 240 230 T 330 218 T 430 228 T 530 215 T 620 226 T 715 220" />
    
    <!-- Line 3: Pack mules exhibited extreme fatigue... -->
    <path d="M 80 280 Q 150 268 230 284 T 320 272 T 410 285 T 510 274 T 610 282 T 710 276" />
    
    <!-- Line 4: Camp fortified beneath western cliff... -->
    <path d="M 80 335 Q 160 320 250 340 T 350 325 T 460 338 T 560 326 T 660 335" />
  </g>
  
  <!-- Bottom margin notes -->
  <text x="80" y="420" font-family="serif" font-size="12" font-style="italic" fill="#6e5334">Altimeter datum ~4,200m; water boiling point test at 86.2°C</text>
  <line x1="80" y1="428" x2="480" y2="428" stroke="#a88d6c" stroke-width="0.8" />
</svg>
`)}`,

  engineering: `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
  <!-- Lined notebook background -->
  <rect width="800" height="500" fill="#f8fafc" />
  <!-- Ruled horizontal blue notebook lines -->
  <line x1="0" y1="70" x2="800" y2="70" stroke="#cbd5e1" stroke-width="1" />
  <line x1="0" y1="125" x2="800" y2="125" stroke="#cbd5e1" stroke-width="1" />
  <line x1="0" y1="180" x2="800" y2="180" stroke="#cbd5e1" stroke-width="1" />
  <line x1="0" y1="235" x2="800" y2="235" stroke="#cbd5e1" stroke-width="1" />
  <line x1="0" y1="290" x2="800" y2="290" stroke="#cbd5e1" stroke-width="1" />
  <line x1="0" y1="345" x2="800" y2="345" stroke="#cbd5e1" stroke-width="1" />
  <line x1="0" y1="400" x2="800" y2="400" stroke="#cbd5e1" stroke-width="1" />
  <!-- Red margin line -->
  <line x1="120" y1="0" x2="120" y2="500" stroke="#fca5a5" stroke-width="1.5" />
  
  <!-- Ballpoint fast scribble handwriting -->
  <g stroke="#0f172a" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.9">
    <!-- Crossed out Kafka -->
    <path d="M 140 115 Q 180 108 230 118 T 320 112 T 400 116" opacity="0.5" />
    <path d="M 135 116 Q 260 105 410 115" stroke="#0f172a" stroke-width="3.5" />
    
    <!-- Line 1: Decided on async event bus... -->
    <path d="M 140 170 Q 200 155 270 174 T 360 162 T 460 172 T 560 160 T 660 170 T 750 165" />
    
    <!-- Line 2: Worker nodes poll telemetry queue... -->
    <path d="M 140 225 Q 210 212 290 230 T 380 216 T 480 228 T 580 215 T 670 226 T 760 220" />
    
    <!-- Line 3: Implement Redis lock for leader election... -->
    <path d="M 140 280 Q 220 268 310 285 T 410 270 T 510 282 T 620 272 T 720 280" />
    
    <!-- Line 4: Crossed out Friday launch -->
    <path d="M 140 338 Q 190 328 250 340 T 320 332" opacity="0.5" />
    <!-- Crosshatch strikethrough -->
    <line x1="135" y1="334" x2="330" y2="336" stroke="#0f172a" stroke-width="2.5" />
    <line x1="140" y1="344" x2="325" y2="326" stroke="#0f172a" stroke-width="2" />
    
    <!-- Deploy canary build to staging cluster Wed evng -->
    <path d="M 340 335 Q 410 320 490 338 T 590 324 T 690 336 T 760 330" />
  </g>
  
  <!-- Right margin asterisk note -->
  <text x="480" y="440" font-family="sans-serif" font-size="12" font-style="italic" fill="#2563eb">
    * Validate 99.9th pct SLA with SRE before benchmark
  </text>
</svg>
`)}`
};
