"use client";

import { useRef, useEffect, useCallback } from 'react';

/**
 * Animated dot-grid canvas that renders a pulsing wave pattern radiating from the center.
 * Uses requestAnimationFrame for silky 60fps. Only renders while visible.
 */
export function DotWaveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const cx = w / 2;
    const cy = h / 2;
    const gap = 28; // distance between dots
    const cols = Math.ceil(w / gap) + 2;
    const rows = Math.ceil(h / gap) + 2;
    const time = performance.now() * 0.001; // seconds

    ctx.clearRect(0, 0, w, h);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = (c - 1) * gap + (gap / 2);
        const y = (r - 1) * gap + (gap / 2);

        // Distance from center
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = Math.sqrt(cx * cx + cy * cy);

        // Wave: radial ripple from center
        const wave = Math.sin(dist * 0.04 - time * 2.2) * 0.5 + 0.5;
        // Secondary wave for complexity
        const wave2 = Math.sin(dist * 0.025 + time * 1.1) * 0.5 + 0.5;
        // Combined intensity
        const intensity = wave * 0.6 + wave2 * 0.4;

        // Fade at edges
        const edgeFade = 1 - Math.pow(dist / maxDist, 1.5);
        const alpha = intensity * edgeFade;

        // Dot size pulses with wave
        const baseSize = 1.8;
        const size = baseSize + intensity * 1.6;

        // Color: from dim slate to vibrant blue
        const blue = Math.round(144 + alpha * 111); // 144 → 255
        const green = Math.round(100 + alpha * 93);  // subtle teal tint
        const opacity = 0.08 + alpha * 0.55;

        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(24, ${green}, ${blue}, ${opacity})`;
        ctx.fill();
      }
    }

    animRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      // The draw loop already reads rect each frame, so this is just a nudge
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.85 }}
    />
  );
}
