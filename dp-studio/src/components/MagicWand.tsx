import { useEffect, useRef } from 'react';

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
}

const COLORS = ['#FFF9F3', '#F6C27A', '#F28C28', '#FFD98A'];
const MAX_SPARKS = 140;

/**
 * Magic-wand cursor effect: a short trail of golden sparkles follows the mouse and a small burst
 * pops on click. (The wand itself is the CSS cursor, see "magic wand cursor" in globals.css.)
 * Mouse only — never shown on touch screens, and switched off for "reduce motion".
 */
export default function MagicWand() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = window.matchMedia('(pointer: fine)').matches;
    if (reduce || !fine) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const sparks: Spark[] = [];
    let raf = 0;
    let running = false;
    let last = { x: -1, y: -1 };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const add = (x: number, y: number, count: number, speed: number) => {
      for (let i = 0; i < count; i++) {
        if (sparks.length >= MAX_SPARKS) sparks.shift();
        const a = Math.random() * Math.PI * 2;
        const v = Math.random() * speed;
        sparks.push({
          x,
          y,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v + 0.15,
          life: 0,
          max: 520 + Math.random() * 420,
          size: 1.6 + Math.random() * 2.6,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
        });
      }
    };

    let prev = 0;
    const frame = (t: number) => {
      const dt = Math.min(t - prev || 16, 40);
      prev = t;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life += dt;
        if (s.life >= s.max) {
          sparks.splice(i, 1);
          continue;
        }
        s.x += s.vx * (dt / 16);
        s.y += s.vy * (dt / 16);
        s.vy += 0.012 * (dt / 16);
        const k = 1 - s.life / s.max;
        const r = s.size * (0.4 + k * 0.6);
        ctx.globalAlpha = k;
        ctx.fillStyle = s.color;
        ctx.shadowColor = '#F28C28';
        ctx.shadowBlur = 8;
        // four-point star
        ctx.beginPath();
        ctx.moveTo(s.x, s.y - r * 2);
        ctx.quadraticCurveTo(s.x, s.y, s.x + r * 2, s.y);
        ctx.quadraticCurveTo(s.x, s.y, s.x, s.y + r * 2);
        ctx.quadraticCurveTo(s.x, s.y, s.x - r * 2, s.y);
        ctx.quadraticCurveTo(s.x, s.y, s.x, s.y - r * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (sparks.length > 0) raf = requestAnimationFrame(frame);
      else running = false; // nothing left to draw: stop the loop until the mouse moves again
    };
    const start = () => {
      if (running) return;
      running = true;
      prev = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      if (last.x >= 0 && dx * dx + dy * dy < 100) return; // only every ~10px
      last = { x: e.clientX, y: e.clientY };
      add(e.clientX + 3, e.clientY + 3, 2, 0.7);
      start();
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      add(e.clientX + 3, e.clientY + 3, 16, 2.4);
      start();
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={ref} className="wand-trail" aria-hidden="true" />;
}
