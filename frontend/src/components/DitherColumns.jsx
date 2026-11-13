import React, { useEffect, useRef } from 'react';

// Procedural stippled Roman columns (ported from the Stitch login mockup)
export default function DitherColumns() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      const parent = canvas.parentElement;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      const w = canvas.width;
      const h = canvas.height;
      if (!w || !h) return;

      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, w, h);

      const columns = [
        { x: w * 0.22, width: Math.max(90, w * 0.16), top: h * 0.05, bottom: h * 0.94, flutes: 14, capitalScale: 1.4 },
        { x: w * 0.52, width: Math.max(70, w * 0.13), top: h * 0.16, bottom: h * 0.92, flutes: 11, capitalScale: 1.2 },
        { x: w * 0.82, width: Math.max(105, w * 0.19), top: h * 0.04, bottom: h * 0.95, flutes: 16, capitalScale: 1.5 },
      ];

      // deterministic pseudo-random so the art never "jitters" on resize
      let seed = 1337;
      const random = () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      };
      const dot = (x, y, alpha = 0.85, size = 1.25) => {
        ctx.fillStyle = `rgba(220, 220, 225, ${alpha})`;
        ctx.fillRect(Math.floor(x), Math.floor(y), size, size);
      };

      columns.forEach((col) => {
        const colW = col.width;
        const capitalH = 70 * col.capitalScale;
        const shaftTop = col.top + capitalH;
        const shaftBottom = col.bottom - 40;
        const baseH = 40;

        // Capital
        for (let y = col.top; y < shaftTop; y += 1.8) {
          const progress = (y - col.top) / capitalH;
          const flare = (1.35 - progress * 0.35) * (colW / 2);
          const dotCount = Math.floor(colW * 1.8);
          for (let i = 0; i < dotCount; i++) {
            const rx = (random() - 0.5) * 2 * flare;
            const wave = Math.sin(rx * 0.12) * Math.cos(progress * 8);
            const density = (0.55 + wave * 0.45) * (1 - (Math.abs(rx) / flare) * 0.3);
            if (random() < density) {
              const lum = (0.2 + random() * 0.75) * (1 - progress * 0.2);
              dot(col.x + rx, y + (random() - 0.5) * 2, lum, random() > 0.8 ? 1.6 : 1.1);
            }
          }
        }

        // Fluted shaft with cylindrical lighting
        for (let y = shaftTop; y < shaftBottom; y += 1.6) {
          for (let flute = 0; flute < col.flutes; flute++) {
            const fluteNorm = flute / (col.flutes - 1);
            const xOffset = (fluteNorm - 0.5) * colW;
            const normalX = (fluteNorm - 0.5) * 2;
            const cylinderLight = Math.max(0, Math.cos(normalX * 1.3 - 0.3));
            const ridgeStep = flute % 2 === 0 ? 1.0 : 0.45;
            const probability = cylinderLight * ridgeStep * 0.88;
            for (let d = 0; d < 4; d++) {
              if (random() < probability) {
                const jitterX = (random() - 0.5) * ((colW / col.flutes) * 0.85);
                const jitterY = (random() - 0.5) * 1.6;
                const brightness = (0.35 + cylinderLight * 0.65) * (0.8 + random() * 0.2);
                dot(col.x + xOffset + jitterX, y + jitterY, brightness, random() > 0.85 ? 1.5 : 1.1);
              }
            }
          }
        }

        // Base
        for (let y = shaftBottom; y < col.bottom; y += 1.6) {
          const baseProgress = (y - shaftBottom) / baseH;
          const baseFlare = (1 + baseProgress * 0.4) * (colW / 2);
          const baseDensity = Math.sin(baseProgress * Math.PI * 2.5);
          for (let i = 0; i < colW * 1.5; i++) {
            const rx = (random() - 0.5) * 2 * baseFlare;
            if (random() < 0.4 + baseDensity * 0.35) {
              dot(col.x + rx, y + (random() - 0.5) * 2, 0.4 + random() * 0.55, 1.2);
            }
          }
        }
      });
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(canvas.parentElement);
    return () => ro.disconnect();
  }, []);

  return <canvas ref={canvasRef} />;
}
