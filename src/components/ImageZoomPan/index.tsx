import { Restore } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { cn } from 'src/constants/helpers';

type ImageZoomPanProps = {
  src: string;
  alt?: string;
};
type Dimensions = {
  width: number;
  height: number;
};
function fitInsideContainer(width: number, height: number, containerWidth: number, containerHeight: number): Dimensions {
  const aspectRatio = width / height;
  let newWidth = containerWidth;
  let newHeight = containerHeight;
  if (containerWidth / containerHeight > aspectRatio) {
    newWidth = containerHeight * aspectRatio;
  } else {
    newHeight = containerWidth / aspectRatio;
  }
  return { width: newWidth, height: newHeight };
}
const maxRetry = 5;

const ImageZoomPan = memo(({ src, alt }: ImageZoomPanProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);
  const [isError, setIsError] = useState(false);
  const [containerRef, setContainerRef] = useState<HTMLDivElement>(null);
  const [size, setSize] = useState<Dimensions>({ width: 0, height: 0 });
  const [dirty, setDirty] = useState(false);
  const retries = useRef(0);

  const containerSize = useMemo(() => {
    const parent = containerRef?.parentElement;
    if (!parent) return { width: 0, height: 0 };
    const { clientWidth, clientHeight } = parent || {};
    return { width: clientWidth, height: clientHeight };
  }, [containerRef]);

  useEffect(() => {
    if (retries.current < maxRetry && (size.width === 0 || size.height === 0)) {
      retries.current++;
      const img = new Image();
      img.src = src;
      img.onload = () => {
        const canvas = canvasRef.current;
        if (canvas) {
          const { width, height } = fitInsideContainer(img.width, img.height, containerSize.width, containerSize.height);
          setSize({ width, height });
          canvas.width = width;
          canvas.height = height;
          canvas.style.width = `${width}px`;
          canvas.style.height = `${height}px`;
          if (containerRef) {
            containerRef.style.width = `${width}px`;
            containerRef.style.height = `${height}px`;
          }
          requestAnimationFrame(() => {
            drawImage(img, { x: 0, y: 0 }, 1);
          });
          setIsLoading(false);
        }
      };
      img.onerror = () => {
        setIsError(true);
        setIsLoading(false);
      };
    }
  }, [containerSize.height, containerSize.width, src, containerRef, size]);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        requestAnimationFrame(() => {
          drawImage(img, position, zoom);
        });
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
      setDirty(true);
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
      setDirty(true);
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
        setDirty(true);
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

  const handleReset = useCallback(() => {
    setPosition({ x: 0, y: 0 });
    setZoom(1);
    setDirty(false);
  }, []);

  return (
    <div
      className={cn(
        'relative max-h-full min-h-[300px] w-full overflow-hidden border',
        isLoading ? '' : isDragging ? 'cursor-grabbing' : 'cursor-grab'
      )}
      ref={setContainerRef}
    >
      <ResetButton dirty={dirty} handleReset={handleReset} />
      <img src={src} alt={alt} className="sr-only" />
      {isLoading && !isError && (
        <div className="bg-muted absolute inset-0 flex animate-pulse select-none items-center justify-center">Loading...</div>
      )}
      {isError ? (
        <div className="bg-muted absolute inset-0 flex select-none items-center justify-center">Failed to load preview</div>
      ) : (
        <>
          <canvas
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            ref={canvasRef}
            className="block max-h-full max-w-full overscroll-contain"
          />
        </>
      )}
    </div>
  );
});

export default ImageZoomPan;

const ResetButton = memo(({ dirty, handleReset }: { dirty: boolean; handleReset: () => void }) => {
  if (!dirty) return null;
  return (
    <HtmlTooltip className="absolute right-2 top-2" title={'Restore'}>
      <IconButton
        onClick={handleReset}
        className=" !bg-[--dark-primary,white]"
        sx={{ borderRadius: '5px', border: '1px solid var(--common-border-color)' }}
        size="small"
      >
        <Restore />
      </IconButton>
    </HtmlTooltip>
  );
});
