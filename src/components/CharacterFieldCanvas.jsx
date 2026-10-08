import React, { useEffect, useRef } from 'react';

/**
 * CharacterFieldCanvas Component
 * Astra-style spatial FIELD OF INDIVIDUAL CHARACTERS for CRY NOVA homepage.
 *
 * Final Polish Pass:
 * - 3 distinct depth layers (distant faint, medium chalk/crimson, foreground bright with glow).
 * - Subtle pointer parallax response on depth layers.
 * - Cursor "Intelligence" effect: soft crimson interaction halo + proximity brightness boost.
 * - Stable original anchors with smooth inverse-distance repulsion, return spring, and damping.
 * - Continuous atmospheric radial contrast mask for central hero readability.
 * - Respects prefers-reduced-motion.
 * - Pure HTML5 Canvas 60 FPS, unmounted and completely cleaned up outside homepage.
 */

const GLYPH_SET = [
  // Uppercase
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  // Lowercase
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
  'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
  // Digits
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
  // Punctuation & symbols
  '@', '#', '&', '*', '+', '=', '/', '[', ']', '{', '}', '?', '!', '$', '€', '%', '<', '>', '~', '^',
  // Mathematical & technical symbols
  'β', '∑', '∆', 'π', 'µ', 'λ', 'Ω', '≈', '≠', '±', '√', '∞', '∫', '∂', 'ψ', 'θ', 'φ'
];

export default function CharacterFieldCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = null;
    let isMounted = true;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Reduced motion preference
    const isReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Mouse tracking state
    const mouse = {
      x: -9999,
      y: -9999,
      active: false,
      lastMoveTime: 0,
    };

    // Parallax smoothing state
    let curParallaxX = 0;
    let curParallaxY = 0;

    // Deterministic PRNG for stable, repeatable anchor generation
    let seed = 9876543;
    const prng = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    // Responsive grid configuration based on viewport width
    const getGridConfig = (w) => {
      if (w >= 1280) {
        return { cols: 17, rows: 11 }; // ~187 glyphs on desktop
      } else if (w >= 1024) {
        return { cols: 14, rows: 9 }; // ~126 glyphs on laptop
      } else if (w >= 640) {
        return { cols: 10, rows: 8 }; // ~80 glyphs on tablet
      } else {
        return { cols: 6, rows: 7 }; // ~42 glyphs on mobile
      }
    };

    let glyphs = [];

    const initGlyphs = () => {
      seed = 5432198;
      const { cols, rows } = getGridConfig(width);
      const cellW = width / cols;
      const cellH = height / rows;
      const list = [];

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          // Jittered anchor inside cell for even spatial distribution without clumping
          const anchorX = c * cellW + (0.15 + prng() * 0.7) * cellW;
          const anchorY = r * cellH + (0.15 + prng() * 0.7) * cellH;

          // Character selection
          const char = GLYPH_SET[Math.floor(prng() * GLYPH_SET.length)];

          // 3 Depth Layers Allocation
          const layerRoll = prng();
          let depth = 0.5;
          let fontSize = 12;
          let baseOpacity = 0.2;
          let colorType = 'distant';
          let hasGlow = false;
          let parallaxRatio = 0.5;

          if (layerRoll < 0.46) {
            // Layer 0: Distant faint characters
            depth = 0.35 + prng() * 0.17; // 0.35 - 0.52
            fontSize = Math.round(10 + prng() * 3); // 10 - 13px
            baseOpacity = 0.09 + prng() * 0.11; // 0.09 - 0.20
            colorType = 'distant';
            parallaxRatio = 0.35;
          } else if (layerRoll < 0.80) {
            // Layer 1: Medium characters
            depth = 0.65 + prng() * 0.20; // 0.65 - 0.85
            fontSize = Math.round(14 + prng() * 4); // 14 - 18px
            baseOpacity = 0.28 + prng() * 0.20; // 0.28 - 0.48
            colorType = prng() > 0.45 ? 'medium-chalk' : 'medium-crimson';
            parallaxRatio = 0.72;
          } else {
            // Layer 2: Foreground brighter characters with crimson glow
            depth = 0.98 + prng() * 0.26; // 0.98 - 1.24
            fontSize = Math.round(20 + prng() * 6); // 20 - 26px
            baseOpacity = 0.70 + prng() * 0.25; // 0.70 - 0.95
            colorType = prng() > 0.4 ? 'bright-crimson' : 'bright-white';
            hasGlow = prng() > 0.45;
            parallaxRatio = 1.15;
          }

          // Subtle ambient orbital micro-motion parameters (depth-dependent speeds)
          const speedMultiplier = 0.7 + depth * 0.5;
          const orbitRadiusX = (7 + prng() * 12) * (depth * 0.85);
          const orbitRadiusY = (7 + prng() * 12) * (depth * 0.85);
          const orbitSpeedX = (0.0006 + prng() * 0.0009) * speedMultiplier;
          const orbitSpeedY = (0.0005 + prng() * 0.0008) * speedMultiplier;
          const orbitPhaseX = prng() * Math.PI * 2;
          const orbitPhaseY = prng() * Math.PI * 2;

          // Subtle micro-rotation parameters
          const baseRot = (prng() - 0.5) * 0.24; // ~-7 to +7 deg
          const maxRot = 0.05 + prng() * 0.08;
          const rotSpeed = 0.0007 + prng() * 0.0011;
          const rotPhase = prng() * Math.PI * 2;

          // Subtle opacity breathing / twinkle
          const breathSpeed = 0.001 + prng() * 0.0018;
          const breathPhase = prng() * Math.PI * 2;

          list.push({
            char,
            anchorX,
            anchorY,
            currentX: anchorX,
            currentY: anchorY,
            vx: 0,
            vy: 0,
            depth,
            fontSize,
            baseOpacity,
            colorType,
            hasGlow,
            parallaxRatio,
            orbitRadiusX,
            orbitRadiusY,
            orbitSpeedX,
            orbitSpeedY,
            orbitPhaseX,
            orbitPhaseY,
            baseRot,
            currentRot: baseRot,
            vRot: 0,
            maxRot,
            rotSpeed,
            rotPhase,
            breathSpeed,
            breathPhase,
          });
        }
      }

      // Depth sorting so distant glyphs render beneath foreground glyphs
      list.sort((a, b) => a.depth - b.depth);
      glyphs = list;
    };

    initGlyphs();

    // High-DPI canvas resolution scaling
    const handleResize = () => {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      initGlyphs();
    };

    handleResize();

    // Event listeners for smooth pointer repulsion
    const onPointerMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
      mouse.lastMoveTime = Date.now();
    };

    const onPointerLeave = () => {
      mouse.active = false;
    };

    const onTouchMove = (e) => {
      if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
        mouse.active = true;
        mouse.lastMoveTime = Date.now();
      }
    };

    const onTouchEnd = () => {
      mouse.active = false;
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerleave', onPointerLeave);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('resize', handleResize);

    // Main 60fps Physics & Render Loop
    const render = (time) => {
      if (!isMounted) return;

      // Inactivity timeout: if mouse hasn't moved for 3 seconds, deactivate cursor force
      if (mouse.active && Date.now() - mouse.lastMoveTime > 3000) {
        mouse.active = false;
      }

      ctx.clearRect(0, 0, width, height);

      // Hero center position for atmospheric radial contrast mask
      const heroCenterX = width * 0.5;
      const heroCenterY = Math.min(height * 0.36, 340);

      // Parallax smoothing
      const targetParallaxX = mouse.active && !isReducedMotion ? (mouse.x - width * 0.5) / (width * 0.5) : 0;
      const targetParallaxY = mouse.active && !isReducedMotion ? (mouse.y - height * 0.5) / (height * 0.5) : 0;
      curParallaxX += (targetParallaxX - curParallaxX) * 0.04;
      curParallaxY += (targetParallaxY - curParallaxY) * 0.04;

      // Cursor "Intelligence" Effect: Subtle crimson interaction halo following pointer
      if (mouse.active && !isReducedMotion) {
        const haloGrad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 160);
        haloGrad.addColorStop(0, 'rgba(239, 68, 68, 0.085)');
        haloGrad.addColorStop(0.5, 'rgba(220, 38, 38, 0.03)');
        haloGrad.addColorStop(1, 'rgba(220, 38, 38, 0.0)');
        ctx.fillStyle = haloGrad;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 160, 0, Math.PI * 2);
        ctx.fill();
      }

      const glyphCount = glyphs.length;
      for (let i = 0; i < glyphCount; i++) {
        const g = glyphs[i];

        // 1. Ambient micro-orbital motion + subtle pointer parallax
        const ambientX = isReducedMotion ? 0 : Math.cos(time * g.orbitSpeedX + g.orbitPhaseX) * g.orbitRadiusX;
        const ambientY = isReducedMotion ? 0 : Math.sin(time * g.orbitSpeedY + g.orbitPhaseY) * g.orbitRadiusY;
        const parallaxShiftX = isReducedMotion ? 0 : curParallaxX * 15 * g.parallaxRatio;
        const parallaxShiftY = isReducedMotion ? 0 : curParallaxY * 15 * g.parallaxRatio;

        const targetX = g.anchorX + ambientX + parallaxShiftX;
        const targetY = g.anchorY + ambientY + parallaxShiftY;
        const targetRot = isReducedMotion ? g.baseRot : g.baseRot + Math.sin(time * g.rotSpeed + g.rotPhase) * g.maxRot;

        // 2. Cursor repulsion physics & proximity brightness boost
        let proximityHighlight = 0;
        if (mouse.active && !isReducedMotion) {
          const dx = g.currentX - mouse.x;
          const dy = g.currentY - mouse.y;
          const dist = Math.hypot(dx, dy);
          const repulsionRadius = 150 * g.depth; // 55px to 185px depending on depth

          if (dist < repulsionRadius && dist > 0.05) {
            const normX = dx / dist;
            const normY = dy / dist;
            const proximity = (repulsionRadius - dist) / repulsionRadius;
            const force = Math.pow(proximity, 1.6) * (13.5 * g.depth);

            g.vx += normX * force;
            g.vy += normY * force;
            // Micro-torque rotation induced by mouse push
            g.vRot += (normX * 0.025 - normY * 0.015) * proximity;
            proximityHighlight = proximity * 0.35;
          }
        }

        // 3. Return spring force toward target anchor
        const springK = 0.046;
        g.vx += (targetX - g.currentX) * springK;
        g.vy += (targetY - g.currentY) * springK;

        // 4. Velocity damping to eliminate jitter
        const damping = 0.86;
        g.vx *= damping;
        g.vy *= damping;
        g.currentX += g.vx;
        g.currentY += g.vy;

        // 5. Angular spring and damping
        const rotSpring = (targetRot - g.currentRot) * 0.05;
        g.vRot += rotSpring;
        g.vRot *= 0.86;
        g.currentRot += g.vRot;

        // 6. Atmospheric radial hero contrast mask
        const dxHeroNorm = (g.currentX - heroCenterX) / 440;
        const dyHeroNorm = (g.currentY - heroCenterY) / 280;
        const distHeroNorm = Math.hypot(dxHeroNorm, dyHeroNorm);

        let heroMask = 1.0;
        if (distHeroNorm < 0.42) {
          heroMask = 0.035; // imperceptible whisper directly behind hero title
        } else if (distHeroNorm < 1.0) {
          const t = (distHeroNorm - 0.42) / 0.58;
          const smooth = t * t * (3 - 2 * t); // smoothstep
          heroMask = 0.035 + 0.965 * smooth;
        }

        // 7. Subtle opacity breathing + cursor proximity boost
        const breath = isReducedMotion ? 0 : Math.sin(time * g.breathSpeed + g.breathPhase) * 0.07;
        const effAlpha = Math.max(0.01, Math.min(1.0, (g.baseOpacity + breath + proximityHighlight) * heroMask));

        // Skip rendering if practically invisible
        if (effAlpha < 0.02) continue;

        // 8. Choose fill color matching CRY NOVA crimson / technical identity
        let fillStyle = '';
        if (g.colorType === 'distant') {
          fillStyle = `rgba(135, 45, 45, ${effAlpha * 0.75})`;
        } else if (g.colorType === 'medium-crimson') {
          fillStyle = `rgba(220, 38, 38, ${effAlpha})`;
        } else if (g.colorType === 'medium-chalk') {
          fillStyle = `rgba(220, 215, 215, ${effAlpha})`;
        } else if (g.colorType === 'bright-crimson') {
          fillStyle = `rgba(242, 60, 60, ${effAlpha})`;
        } else {
          // bright-white
          fillStyle = `rgba(255, 255, 255, ${effAlpha})`;
        }

        // 9. Draw glyph with individual rotation and optional crimson glow
        ctx.save();
        ctx.translate(g.currentX, g.currentY);
        ctx.rotate(g.currentRot);

        if (g.hasGlow && heroMask > 0.4) {
          ctx.shadowColor = 'rgba(239, 68, 68, 0.75)';
          ctx.shadowBlur = (9 + proximityHighlight * 12) * g.depth;
        }

        ctx.font = `${g.fontSize}px "JetBrains Mono", "Courier New", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = fillStyle;
        ctx.fillText(g.char, 0, 0);

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    // Comprehensive unmount cleanup
    return () => {
      isMounted = false;
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 w-full h-full"
    />
  );
}
