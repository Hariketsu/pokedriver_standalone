'use client';

import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useGameStore } from '@/lib/store';

// ============================================================
// Types
// ============================================================

interface BgParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
  hue: number;
}

interface ExplosionParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
  decay: number;
  color: string;
}

export interface ParticleCanvasHandle {
  spawnExplosion: (x: number, y: number, color?: string, count?: number) => void;
}

// ============================================================
// Constants
// ============================================================

const BG_PARTICLE_COUNT = 50;

// ============================================================
// Component
// ============================================================

const ParticleCanvas = forwardRef<ParticleCanvasHandle>(function ParticleCanvas(_props, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgParticlesRef = useRef<BgParticle[]>([]);
  const explosionsRef = useRef<ExplosionParticle[]>([]);
  const rafRef = useRef<number>(0);
  const canvasWRef = useRef(0);
  const canvasHRef = useRef(0);

  // ----------------------------------------------------------
  // Background particles
  // ----------------------------------------------------------

  const initBgParticles = useCallback(() => {
    const w = canvasWRef.current;
    const h = canvasHRef.current;
    bgParticlesRef.current = [];
    for (let i = 0; i < BG_PARTICLE_COUNT; i++) {
      bgParticlesRef.current.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.4 + 0.1,
        hue: Math.random() < 0.5 ? 180 : 300,
      });
    }
  }, []);

  // ----------------------------------------------------------
  // Canvas resize
  // ----------------------------------------------------------

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvasWRef.current = window.innerWidth;
    canvasHRef.current = window.innerHeight;
    canvas.width = canvasWRef.current;
    canvas.height = canvasHRef.current;
    initBgParticles();
  }, [initBgParticles]);

  // ----------------------------------------------------------
  // Spawn explosion (exposed via ref)
  // ----------------------------------------------------------

  const spawnExplosion = useCallback(
    (x: number, y: number, color?: string, count = 20) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1;
        explosionsRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1,
          r: Math.random() * 4 + 2,
          life: 1,
          decay: 0.015 + Math.random() * 0.02,
          color:
            color ||
            `hsl(${Math.random() * 60 + 180}, 100%, 60%)`,
        });
      }
    },
    [],
  );

  useImperativeHandle(ref, () => ({ spawnExplosion }), [spawnExplosion]);

  // ----------------------------------------------------------
  // Render loop
  // ----------------------------------------------------------

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const w = canvasWRef.current;
      const h = canvasHRef.current;

      ctx.clearRect(0, 0, w, h);

      // --- Background particles ---
      const bgParticles = bgParticlesRef.current;
      for (let i = 0; i < bgParticles.length; i++) {
        const p = bgParticles[i];
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around edges
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${p.alpha})`;
        ctx.fill();
      }

      // --- Explosion particles ---
      const explosions = explosionsRef.current;
      for (let i = explosions.length - 1; i >= 0; i--) {
        const p = explosions[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05; // gravity
        p.vx *= 0.99; // friction
        p.life -= p.decay;

        if (p.life <= 0) {
          explosions.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // --- Monster glows ---
      const monsters = useGameStore.getState().monsters;
      for (let i = 0; i < monsters.length; i++) {
        const m = monsters[i];
        if (m.dead) continue;

        const el = document.querySelector(`[data-monster-id="${m.id}"]`);
        if (!el) continue;

        const r = el.getBoundingClientRect();
        ctx.beginPath();
        ctx.arc(
          r.left + r.width / 2,
          r.top + r.height / 2,
          22,
          0,
          Math.PI * 2,
        );
        ctx.fillStyle =
          m.pokeData && m.pokeData.r === 'l'
            ? 'rgba(255, 0, 68, 0.08)'
            : 'rgba(0, 240, 255, 0.05)';
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(render);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [resizeCanvas]);

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
});

export default ParticleCanvas;
