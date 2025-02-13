import React, { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from 'src/constants/helpers';

interface ImageZoomPanProps {
  src: string;
  alt?: string;
}

const ImageZoomPan = ({ src, alt }: ImageZoomPanProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);
  const [isError, setIsError] = useState(false);
  const [containerRef, setContainerRef] = useState<HTMLDivElement>(null);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = img.width;
        canvas.height = img.height;
        drawImage(img, { x: 0, y: 0 }, 1);
        setIsLoading(false);
      }
    };
    img.onerror = () => {
      setIsError(true);
      setIsLoading(false);
    };
  }, [src]);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        drawImage(img, position, zoom);
        setIsLoading(false);
      }
    };
    img.onerror = () => {
      setIsError(true);
      setIsLoading(false);
    };
  }, [src, position, zoom, containerRef]);

  const drawImage = (img: HTMLImageElement, position: { x: number; y: number }, zoom: number) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.scale(zoom, zoom);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.restore();
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: position.x + e.movementX,
        y: position.y + e.movementY
      });
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      setLastTouchDistance(distance);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDistance !== null) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      const zoomFactor = distance / lastTouchDistance;
      setZoom((prevZoom) => Math.max(1, prevZoom * zoomFactor));
      setLastTouchDistance(distance);
    }
  };

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;
        const newZoom = Math.max(0.5, zoom + e.deltaY * -0.001);
        const zoomFactor = newZoom / zoom;
        setPosition({
          x: position.x - offsetX * (zoomFactor - 1),
          y: position.y - offsetY * (zoomFactor - 1)
        });
        setZoom(newZoom);
      }
    },
    [position.x, position.y, zoom]
  );
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas?.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas?.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const getStyle = useCallback(() => {
    const parent = containerRef?.parentElement;
    if (!parent) return {};
    const { clientWidth, clientHeight } = parent || { containerStyle: {}, canvasStyle: {} };
    if (clientWidth > clientHeight) {
      return { containerStyle: { height: clientHeight, width: 'auto' }, canvasStyle: { height: '100%', width: 'auto' } };
    } else {
      return { containerStyle: { width: clientWidth, height: 'auto' }, canvasStyle: { width: '100%', height: 'auto' } };
    }
  }, [containerRef]);

  return (
    <div
      className={cn(
        'relative max-h-full min-h-[300px] w-full overflow-hidden border',
        isLoading ? '' : isDragging ? 'cursor-grabbing' : 'cursor-grab'
      )}
      style={getStyle().containerStyle}
      ref={setContainerRef}
    >
      <img src={src} alt={alt} className="sr-only" />
      {isLoading && !isError && (
        <div className="bg-muted absolute inset-0 flex animate-pulse select-none items-center justify-center">Loading...</div>
      )}
      {isError ? (
        <div className="bg-muted absolute inset-0 flex select-none items-center justify-center">Failed to load preview</div>
      ) : (
        <canvas
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          ref={canvasRef}
          style={getStyle().canvasStyle}
          className="block max-h-full max-w-full overscroll-contain"
        />
      )}
    </div>
  );
};

export default ImageZoomPan;
