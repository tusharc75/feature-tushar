import { useCallback, useEffect, useRef, useState } from 'react';

const PADDING = 25;

const useDragAndDrop = (props?: { clampToWindow: boolean }) => {
  const { clampToWindow = true } = props || {};
  const handleRef = useRef(null);
  const containerRef = useRef(null);
  const currentTranslate = useRef(0);
  const [enabled, setEnabled] = useState(true);
  const animationFrameId = useRef(null);

  const enableDisableDraggable = useCallback((enabled: boolean) => {
    setEnabled(enabled);
  }, []);

  useEffect(() => {
    const handleElement = handleRef.current;
    const containerElement = containerRef.current;

    if (!handleElement || !containerElement) return;

    let isDragging = false;
    let startX;

    const onMouseDown = (event: MouseEvent) => {
      if (!enabled || isDragging) return;
      event.preventDefault();
      isDragging = true;
      startX = event.clientX;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'grabbing';
      handleElement.style.cursor = 'grabbing';
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!isDragging) return;
      event.preventDefault();
      const dx = event.clientX - startX;
      let newTranslate = currentTranslate.current + dx;

      if (clampToWindow) {
        // Prevent movement outside the window
        const containerWidth = containerElement.offsetWidth;
        const windowWidth = window.innerWidth;
        const minTranslate = -(windowWidth - containerWidth - PADDING); // Left boundary
        const maxTranslate = 0; // Right boundary

        newTranslate = Math.max(minTranslate, Math.min(maxTranslate, newTranslate));
      }

      // Smooth drag using requestAnimationFrame
      if (animationFrameId.current === null) {
        animationFrameId.current = requestAnimationFrame(() => {
          containerElement.style.transform = `translateX(${newTranslate}px)`;
          animationFrameId.current = null;
        });
      }
    };

    const onMouseUp = () => {
      isDragging = false;

      // Update currentTranslate based on the last drag position
      const computedStyle = window.getComputedStyle(containerElement);
      const matrix = new DOMMatrixReadOnly(computedStyle.transform);
      currentTranslate.current = matrix.m41;

      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);

      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      handleElement.style.cursor = 'grab';
      document.body.style.cursor = '';
    };

    handleElement.addEventListener('mousedown', onMouseDown);

    return () => {
      handleElement.removeEventListener('mousedown', onMouseDown);
    };
  }, [enabled]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!enabled) {
      container.style.transform = '';
    } else {
      container.style.transform = `translateX(${currentTranslate.current}px)`;
    }
  }, [enabled]);

  return { handleRef, containerRef, enableDisableDraggable };
};

export default useDragAndDrop;
