import React, { useEffect, useRef } from 'react';

const IslamicPatternBackgroundBase: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isLowPowerDevice =
      typeof navigator !== 'undefined' && (navigator.hardwareConcurrency || 4) <= 2;
    const dpr = isLowPowerDevice ? 1 : Math.min(window.devicePixelRatio || 1, 2);

    let starBitmap: HTMLCanvasElement | null = null;
    let bitmapSize = 0;

    const buildStarBitmap = (outerRadius: number, innerRadius: number) => {
      bitmapSize = Math.ceil(outerRadius * 3.2); // padding so the glow doesn't clip
      const off = document.createElement('canvas');
      off.width = bitmapSize;
      off.height = bitmapSize;
      const octx = off.getContext('2d')!;
      const cx = bitmapSize / 2;
      const cy = bitmapSize / 2;

      const glow = octx.createRadialGradient(cx, cy, 0, cx, cy, outerRadius * 1.4);
      glow.addColorStop(0, 'rgba(234, 179, 8, 0.35)');
      glow.addColorStop(0.5, 'rgba(234, 179, 8, 0.12)');
      glow.addColorStop(1, 'rgba(234, 179, 8, 0)');
      octx.fillStyle = glow;
      octx.fillRect(0, 0, bitmapSize, bitmapSize);

      octx.translate(cx, cy);

      // Square 1
      octx.beginPath();
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2;
        const x = Math.cos(angle) * outerRadius;
        const y = Math.sin(angle) * outerRadius;
        if (i === 0) octx.moveTo(x, y);
        else octx.lineTo(x, y);
      }
      octx.closePath();
      octx.strokeStyle = 'rgba(234, 179, 8, 0.7)';
      octx.lineWidth = 1.2;
      octx.stroke();

      // Square 2 (rotated 45deg)
      octx.beginPath();
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2 + Math.PI / 4;
        const x = Math.cos(angle) * outerRadius;
        const y = Math.sin(angle) * outerRadius;
        if (i === 0) octx.moveTo(x, y);
        else octx.lineTo(x, y);
      }
      octx.closePath();
      octx.strokeStyle = 'rgba(234, 179, 8, 0.7)';
      octx.lineWidth = 1.2;
      octx.stroke();

      // Inner 16-point star
      octx.beginPath();
      const points = 8;
      for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? outerRadius * 0.75 : innerRadius;
        const angle = (i * Math.PI) / points;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0) octx.moveTo(x, y);
        else octx.lineTo(x, y);
      }
      octx.closePath();
      octx.strokeStyle = 'rgba(250, 204, 21, 1)';
      octx.lineWidth = 1;
      octx.stroke();

      // Center octagon
      octx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const x = Math.cos(angle) * (innerRadius * 0.6);
        const y = Math.sin(angle) * (innerRadius * 0.6);
        if (i === 0) octx.moveTo(x, y);
        else octx.lineTo(x, y);
      }
      octx.closePath();
      octx.fillStyle = 'rgba(234, 179, 8, 0.25)';
      octx.fill();
      octx.strokeStyle = 'rgba(254, 240, 138, 0.8)';
      octx.lineWidth = 0.8;
      octx.stroke();

      starBitmap = off;
    };

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const tileSize = width < 640 ? 110 : 140;
      buildStarBitmap(tileSize * 0.36, tileSize * 0.18);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    const baseDensity = isLowPowerDevice ? 40000 : 20000;
    const maxParticles = isLowPowerDevice ? 15 : 40;
    const particlesCount = prefersReducedMotion
      ? 0
      : Math.min(Math.floor((width * height) / baseDensity), maxParticles);
    const particles = Array.from({ length: particlesCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.8 + 0.6,
      speedY: Math.random() * 0.3 + 0.1,
      speedX: (Math.random() - 0.5) * 0.2,
      alpha: Math.random() * 0.6 + 0.2,
      pulseSpeed: Math.random() * 0.02 + 0.01,
    }));

    let time = 0;
    let lastRenderTime = 0;
    const fpsInterval = 1000 / 30;

    let bgGradientCache: CanvasGradient | null = null;

    const drawFrame = (animated: boolean) => {
      if (!bgGradientCache) {
        bgGradientCache = ctx.createLinearGradient(0, 0, width, height);
        bgGradientCache.addColorStop(0, '#090F26');
        bgGradientCache.addColorStop(0.5, '#121F52');
        bgGradientCache.addColorStop(1, '#0A1333');
      }
      ctx.fillStyle = bgGradientCache;
      ctx.fillRect(0, 0, width, height);

      const tileSize = width < 640 ? 110 : 140;
      const cols = Math.ceil(width / tileSize) + 2;
      const rows = Math.ceil(height / tileSize) + 2;
      const offsetX = (width % tileSize) / 2 - tileSize;
      const offsetY = (height % tileSize) / 2 - tileSize;

      if (starBitmap) {
        for (let c = -1; c < cols; c++) {
          for (let r = -1; r < rows; r++) {
            const cx = c * tileSize + offsetX + (r % 2 === 0 ? 0 : tileSize / 2);
            const cy = r * tileSize + offsetY;

            const distToCenter = Math.hypot(cx - width / 2, cy - height / 2);
            const maxDist = Math.hypot(width / 2, height / 2);
            const distFactor = 1 - Math.min(distToCenter / maxDist, 0.85);
            const wave = animated ? Math.sin(time * 1.5 + (c * 0.5 + r * 0.5)) * 0.2 + 0.8 : 0.8;
            const alpha = Math.max(0.08, Math.min(0.45, distFactor * wave * 0.45));
            const starRotation = animated ? time * 0.2 * ((c + r) % 2 === 0 ? 1 : -1) : 0;

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.translate(cx, cy);
            if (starRotation !== 0) ctx.rotate(starRotation);
            ctx.drawImage(starBitmap, -bitmapSize / 2, -bitmapSize / 2, bitmapSize, bitmapSize);
            ctx.restore();
          }
        }
      }

      if (animated) {
        particles.forEach((p) => {
          p.y -= p.speedY;
          p.x += p.speedX;
          p.alpha += Math.sin(time * 2) * p.pulseSpeed;
          if (p.y < -10) {
            p.y = height + 10;
            p.x = Math.random() * width;
          }
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;

          const currentAlpha = Math.max(0.1, Math.min(0.8, p.alpha));
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(253, 224, 71, ${currentAlpha})`;
          ctx.fill();

          if (p.size > 1.2) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(234, 179, 8, ${currentAlpha * 0.2})`;
            ctx.fill();
          }
        });
      }
    };

    if (prefersReducedMotion) {
      drawFrame(false);
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }

    const render = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(render);
      if (typeof document !== 'undefined' && document.hidden) return;

      const elapsed = currentTime - lastRenderTime;
      if (elapsed < fpsInterval) return;
      lastRenderTime = currentTime - (elapsed % fpsInterval);

      time += 0.015;

      drawFrame(true);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
    />
  );
};

export const IslamicPatternBackground = React.memo(IslamicPatternBackgroundBase);
