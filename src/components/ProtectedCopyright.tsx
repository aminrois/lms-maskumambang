import React, { useEffect, useRef } from 'react';

interface ProtectedCopyrightProps {
  lines: string[];
  align?: 'left' | 'center' | 'right';
  fontSize?: number;
  color?: string;
  fontWeight?: string;
  fontFamily?: string;
  lineGap?: number;
  className?: string;
}

export const ProtectedCopyright: React.FC<ProtectedCopyrightProps> = ({
  lines,
  align = 'center',
  fontSize = 13,
  color = 'rgba(148, 163, 184, 0.9)',
  fontWeight = '500',
  fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  lineGap = 6,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const renderCanvas = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const containerWidth = container.clientWidth;
      if (containerWidth <= 0) return;

      const dpr = window.devicePixelRatio || 1;
      const fontSpec = `${fontWeight} ${fontSize}px ${fontFamily}`;
      ctx.font = fontSpec;

      // Word wrapping logic per line for responsiveness
      const allWrappedLines: string[] = [];
      lines.forEach((lineText) => {
        const words = lineText.split(' ');
        let currentLine = '';

        for (let i = 0; i < words.length; i++) {
          const word = words[i];
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const metrics = ctx.measureText(testLine);

          if (metrics.width > containerWidth - 12 && currentLine) {
            allWrappedLines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) {
          allWrappedLines.push(currentLine);
        }
      });

      const paddingTop = 4;
      const paddingBottom = 4;
      const lineHeight = Math.round(fontSize * 1.4);
      const contentHeight =
        allWrappedLines.length > 0
          ? allWrappedLines.length * lineHeight + (allWrappedLines.length - 1) * lineGap
          : 0;
      const totalHeight = contentHeight > 0 ? contentHeight + paddingTop + paddingBottom : 0;

      canvas.width = Math.floor(containerWidth * dpr);
      canvas.height = Math.floor(totalHeight * dpr);
      canvas.style.width = `${containerWidth}px`;
      canvas.style.height = `${totalHeight}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, containerWidth, totalHeight);

      ctx.font = fontSpec;
      ctx.fillStyle = color;
      ctx.textAlign = align;
      ctx.textBaseline = 'top';

      let x = 0;
      if (align === 'center') {
        x = containerWidth / 2;
      } else if (align === 'right') {
        x = containerWidth;
      } else {
        x = 0;
      }

      let y = paddingTop;
      allWrappedLines.forEach((line) => {
        ctx.fillText(line, x, y);
        y += lineHeight + lineGap;
      });
    };

    renderCanvas();

    const resizeObserver = new ResizeObserver(() => {
      renderCanvas();
    });

    resizeObserver.observe(container);
    window.addEventListener('resize', renderCanvas);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', renderCanvas);
    };
  }, [lines, align, fontSize, color, fontWeight, fontFamily, lineGap]);

  return (
    <div ref={containerRef} className={`w-full overflow-hidden select-none pointer-events-none ${className}`}>
      <canvas ref={canvasRef} className="block" />
    </div>
  );
};
