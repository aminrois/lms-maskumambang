import { useEffect, useRef } from 'react';

interface StaticIslamicPatternProps {
  className?: string;
  opacity?: number;
  patternScale?: number;
}

export default function StaticIslamicPattern({
  className = "",
  opacity = 0.05,
  patternScale = 1
}: StaticIslamicPatternProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const render = () => {
      const parent = canvas.parentElement;
      const width = parent?.clientWidth || window.innerWidth;
      const height = parent?.clientHeight || window.innerHeight;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const tileSize = (width < 640 ? 110 : 140) * patternScale;
      const cols = Math.ceil(width / tileSize) + 2;
      const rows = Math.ceil(height / tileSize) + 2;
      const offsetX = (width % tileSize) / 2 - tileSize;
      const offsetY = (height % tileSize) / 2 - tileSize;

      const drawEightPointStar = (cx: number, cy: number, outerRadius: number, innerRadius: number) => {
        ctx.save();
        ctx.translate(cx, cy);

        // Square 1
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const angle = (i * Math.PI) / 2;
          const x = Math.cos(angle) * outerRadius;
          const y = Math.sin(angle) * outerRadius;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = `rgba(234, 179, 8, ${opacity * 0.7})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Square 2 (Rotated 45 deg)
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const angle = (i * Math.PI) / 2 + Math.PI / 4;
          const x = Math.cos(angle) * outerRadius;
          const y = Math.sin(angle) * outerRadius;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = `rgba(234, 179, 8, ${opacity * 0.7})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Inner Star Geometry (16 points connected)
        ctx.beginPath();
        const points = 8;
        for (let i = 0; i < points * 2; i++) {
          const r = i % 2 === 0 ? outerRadius * 0.75 : innerRadius;
          const angle = (i * Math.PI) / points;
          const x = Math.cos(angle) * r;
          const y = Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = `rgba(250, 204, 21, ${opacity})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Center Octagon accent
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI) / 4;
          const x = Math.cos(angle) * (innerRadius * 0.6);
          const y = Math.sin(angle) * (innerRadius * 0.6);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = `rgba(234, 179, 8, ${opacity * 0.25})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(254, 240, 138, ${opacity * 0.8})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();

        ctx.restore();
      };

      ctx.beginPath();
      for (let c = -1; c < cols; c++) {
        for (let r = -1; r < rows; r++) {
          const cx = c * tileSize + offsetX + (r % 2 === 0 ? 0 : tileSize / 2);
          const cy = r * tileSize + offsetY;

          drawEightPointStar(cx, cy, tileSize * 0.36, tileSize * 0.18);

          // Lines
          if (c < cols - 1) {
            const nextCx = (c + 1) * tileSize + offsetX + (r % 2 === 0 ? 0 : tileSize / 2);
            ctx.moveTo(cx, cy);
            ctx.lineTo(nextCx, cy);
          }
          if (r < rows - 1) {
            const nextCy = (r + 1) * tileSize + offsetY;
            const nextCx = cx + (r % 2 === 0 ? tileSize / 2 : -tileSize / 2);
            ctx.moveTo(cx, cy);
            ctx.lineTo(nextCx, nextCy);
          }
        }
      }
      ctx.strokeStyle = `rgba(234, 179, 8, ${opacity * 0.8})`;
      ctx.lineWidth = 0.6;
      ctx.stroke();
    };

    render();

    // Re-render only on window resize
    let resizeTimer: any;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(render, 200);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
    };
  }, [opacity, patternScale]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 z-0 ${className}`}
    />
  );
}
