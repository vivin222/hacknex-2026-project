import React, { useEffect, useRef } from 'react';

/**
 * CharacterFieldCanvas Component
 * Astra-style spatial FIELD OF INDIVIDUAL CHARACTERS for CRY NOVA homepage.
 *
 * Requirements Met:
 * - Individual characters (A-Z, a-z, 0-9, symbols, mathematical/technical symbols).
 * - Hundreds of characters distributed across depth layers.
 * - Crimson/red glow accents matching the CRY NOVA visual identity.
 * - Stable original anchor positions with ambient orbital micro-motion.
 * - Inverse-distance cursor repulsion physics with velocity damping and return spring.
 * - No jitter, snapping, or permanent displacement.
 * - Radial soft contrast mask around central hero.
 * - Pure Canvas 60fps rendering, pointer-events-none.
 * - Complete teardown and memory cleanup on unmount.
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

    // Mouse tracking state
    const mouse = {
      x: -9999,
      y: -9999,
      active: false,
      lastMoveTime: 0,
    };

    // Deterministic PRNG for stable, repeatable anchor generation
    let seed = 9876543;
    const prng = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    // Responsive grid configuration based on viewport width
    const getGridConfig = (w) => {
      if (w >= 1200) {
        return { cols: 17, rows: 11 }; // ~187 glyphs on desktop
      } else if (w >= 900) {
        return { cols: 14, rows: 9 }; // ~126 glyphs on laptop
      } else if (w >= 600) {
        return { cols: 10, rows: 8 }; // ~80 glyphs on tablet
      } else {
        return { cols: 7, rows: 7 }; // ~49 glyphs on mobile
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

          if (layerRoll < 0.45) {
            // Layer 0: Distant faint characters
            depth = 0.38 + prng() * 0.18; // 0.38 - 0.56
            fontSize = Math.round(11 + prng() * 3); // 11 - 14px
            baseOpacity = 0.12 + prng() * 0.14; // 0.12 - 0.26
            colorType = 'distant';
          } else if (layerRoll < 0.80) {
            // Layer 1: Medium characters
            depth = 0.68 + prng() * 0.18; // 0.68 - 0.86
            fontSize = Math.round(15 + prng() * 4); // 15 - 19px
            baseOpacity = 0.32 + prng() * 0.22; // 0.32 - 0.54
            colorType = prng() > 0.4 ? 'medium-chalk' : 'medium-crimson';
          } else {
            // Layer 2: Foreground brighter characters with crimson glow
            depth = 0.98 + prng() * 0.22; // 0.98 - 1.20
            fontSize = Math.round(20 + prng() * 6); // 20 - 26px
            baseOpacity = 0.65 + prng() * 0.3; // 0.65 - 0.95
            colorType = prng() > 0.35 ? 'bright-crimson' : 'bright-white';
            hasGlow = prng() > 0.45; // glowing crimson accent
          }

          // Subtle ambient orbital micro-motion parameters
          const orbitRadiusX = (8 + prng() * 14) * (depth * 0.9);
          const orbitRadiusY = (8 + prng() * 14) * (depth * 0.9);
          const orbitSpeedX = 0.0007 + prng() * 0.0012;
          const orbitSpeedY = 0.0006 + prng() * 0.0011;
          const orbitPhaseX = prng() * Math.PI * 2;
          const orbitPhaseY = prng() * Math.PI * 2;

          // Subtle micro-rotation parameters
          const baseRot = (prng() - 0.5) * 0.25; // -0.125 to +0.125 rad (~7 deg)
          const maxRot = 0.06 + prng() * 0.1;
          const rotSpeed = 0.0008 + prng() * 0.0012;
          const rotPhase = prng() * Math.PI * 2;

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

      // Hero center position for radial contrast mask
      const heroCenterX = width * 0.5;
      const heroCenterY = Math.min(height * 0.38, 350);
      const maskInnerRadius = 150;
      const maskOuterRadius = 390;

      // Subtle ambient vignette in canvas background
      const ambientGrad = ctx.createRadialGradient(
        heroCenterX,
        heroCenterY,
        0,
        heroCenterX,
        heroCenterY,
        Math.max(width, height) * 0.7
      );
      ambientGrad.addColorStop(0, 'rgba(5, 5, 8, 0.4)');
      ambientGrad.addColorStop(0.5, 'rgba(5, 5, 8, 0.1)');
      ambientGrad.addColorStop(1, 'rgba(5, 5, 8, 0.0)');
      ctx.fillStyle = ambientGrad;
      ctx.fillRect(0, 0, width, height);

      const glyphCount = glyphs.length;
      for (let i = 0; i < glyphCount; i++) {
        const g = glyphs[i];

        // 1. Target anchor with ambient micro-orbital motion
        const ambientX = Math.cos(time * g.orbitSpeedX + g.orbitPhaseX) * g.orbitRadiusX;
        const ambientY = Math.sin(time * g.orbitSpeedY + g.orbitPhaseY) * g.orbitRadiusY;
        const targetX = g.anchorX + ambientX;
        const targetY = g.anchorY + ambientY;
        const targetRot = g.baseRot + Math.sin(time * g.rotSpeed + g.rotPhase) * g.maxRot;

        // 2. Cursor repulsion physics
        if (mouse.active) {
          const dx = g.currentX - mouse.x;
          const dy = g.currentY - mouse.y;
          const dist = Math.hypot(dx, dy);
          const repulsionRadius = 150 * g.depth; // 60px to 180px depending on depth

          if (dist < repulsionRadius && dist > 0.05) {
            const normX = dx / dist;
            const normY = dy / dist;
            // Smooth inverse-distance style force falloff
            const proximity = (repulsionRadius - dist) / repulsionRadius;
            const force = Math.pow(proximity, 1.6) * (13.5 * g.depth);

            g.vx += normX * force;
            g.vy += normY * force;
            // Micro-torque rotation induced by mouse push
            g.vRot += (normX * 0.025 - normY * 0.015) * proximity;
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

        // 6. Radial hero contrast mask (dim characters behind central hero)
        const dxHero = g.currentX - heroCenterX;
        const dyHero = (g.currentY - heroCenterY) * 1.35; // slightly squished ellipse
        const distHero = Math.hypot(dxHero, dyHero);

        let heroMask = 1.0;
        if (distHero < maskInnerRadius) {
          heroMask = 0.05; // almost invisible directly behind "CRY NOVA"
        } else if (distHero < maskOuterRadius) {
          heroMask = 0.05 + 0.95 * Math.pow((distHero - maskInnerRadius) / (maskOuterRadius - maskInnerRadius), 1.6);
        }

        const renderOpacity = Math.max(0.01, Math.min(1.0, g.baseOpacity * heroMask));

        // Skip rendering if practically invisible
        if (renderOpacity < 0.02) continue;

        // 7. Choose fill color matching CRY NOVA crimson / technical identity
        let fillStyle = '';
        if (g.colorType === 'distant') {
          fillStyle = `rgba(140, 50, 50, ${renderOpacity * 0.8})`;
        } else if (g.colorType === 'medium-crimson') {
          fillStyle = `rgba(220, 38, 38, ${renderOpacity})`;
        } else if (g.colorType === 'medium-chalk') {
          fillStyle = `rgba(215, 210, 210, ${renderOpacity})`;
        } else if (g.colorType === 'bright-crimson') {
          fillStyle = `rgba(239, 68, 68, ${renderOpacity})`;
        } else {
          // bright-white
          fillStyle = `rgba(255, 255, 255, ${renderOpacity})`;
        }

        // 8. Draw glyph with individual rotation and optional crimson glow
        ctx.save();
        ctx.translate(g.currentX, g.currentY);
        ctx.rotate(g.currentRot);

        if (g.hasGlow && heroMask > 0.4) {
          ctx.shadowColor = 'rgba(239, 68, 68, 0.7)';
          ctx.shadowBlur = 10 * g.depth;
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
