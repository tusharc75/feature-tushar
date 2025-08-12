export function debounce<T extends (...args: any[]) => void>(func: T, timeout = 300): [(...args: Parameters<T>) => void, () => void] {
  let timer: NodeJS.Timeout;
  const debouncedFunc = (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  };
  const teardown = () => clearTimeout(timer);

  return [debouncedFunc, teardown];
}

type ScrollToElementOptions = {
  container?: HTMLElement | Window; // Defaults to window
  behavior?: ScrollBehavior; // 'smooth' | 'auto' (default: 'smooth')
  block?: ScrollLogicalPosition; // 'start' | 'center' | 'end' | 'nearest' (default: 'center')
  inline?: ScrollLogicalPosition; // default: 'nearest'
  offset?: number; // Additional pixel offset from top after scrolling (default: 0)
  threshold?: number; // Portion of element that must be visible [0..1] (default: 0.5)
  timeout?: number; // ms before giving up (default: 2000)
};

export async function scrollToElement(
  element: HTMLElement | null,
  { container, behavior = 'smooth', block = 'center', inline = 'nearest', offset = 0, threshold = 0.5, timeout = 2000 }: ScrollToElementOptions = {}
): Promise<boolean> {
  if (!element) return false;

  const isWindow = (c: any): c is Window => !c || c === window || c === document || c === document.scrollingElement;
  const scrollContainer: HTMLElement | Window = container ?? document.scrollingElement ?? window;

  const getRects = () => {
    const elRect = element.getBoundingClientRect();
    const rootRect = isWindow(scrollContainer)
      ? new DOMRect(0, 0, window.innerWidth, window.innerHeight)
      : (scrollContainer as HTMLElement).getBoundingClientRect();
    return { elRect, rootRect };
  };

  const visibleRatio = () => {
    const { elRect, rootRect } = getRects();
    const xOverlap = Math.max(0, Math.min(elRect.right, rootRect.right) - Math.max(elRect.left, rootRect.left));
    const yOverlap = Math.max(0, Math.min(elRect.bottom, rootRect.bottom) - Math.max(elRect.top, rootRect.top));
    const overlapArea = xOverlap * yOverlap;
    const elArea = Math.max(1, elRect.width * elRect.height); // avoid divide by zero
    return overlapArea / elArea;
  };

  // If already sufficiently visible, resolve immediately
  if (visibleRatio() >= threshold) {
    return true;
  }

  // Perform the initial scroll
  try {
    element.scrollIntoView({ behavior, block, inline });
  } catch {
    // ignore if not supported
  }

  // Apply fixed-header offset or custom offset
  if (offset !== 0) {
    if (isWindow(scrollContainer)) {
      const by = offsetAdjustForBlock(element, block, offset);
      try {
        window.scrollBy({ top: by, behavior });
      } catch {
        window.scrollTo(window.scrollX, window.scrollY + by);
      }
    } else {
      const sc = scrollContainer as HTMLElement;
      const elTop = element.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop;
      const targetTop = elTop - offsetAdjustForBlock(element, block, offset);
      try {
        sc.scrollTo({ top: targetTop, behavior });
      } catch {
        sc.scrollTop = targetTop;
      }
    }
  }

  // Wait until visible or timeout
  return waitUntilVisible(element, scrollContainer, threshold, timeout);
}

// Helper: translate offset relative to block alignment
function offsetAdjustForBlock(el: HTMLElement, block: ScrollLogicalPosition, offset: number): number {
  // Positive offset means "push element further down" (account for sticky headers)
  // For center: apply offset directly; for start: apply offset; for end: invert
  switch (block) {
    case 'end':
      return -offset;
    default:
      return offset;
  }
}

// Wait using IntersectionObserver if available; fallback to rAF polling
function waitUntilVisible(element: HTMLElement, container: HTMLElement | Window, threshold: number, timeout: number): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    let done = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      cleanup();
      resolve(ok);
    };

    const isWindow = (c: any): c is Window => !c || c === window || c === document || c === document.scrollingElement;

    let observer: IntersectionObserver | null = null;
    let rafId: number | null = null;
    let toId: number | null = null;

    const cleanup = () => {
      if (observer) observer.disconnect();
      if (rafId != null) cancelAnimationFrame(rafId);
      if (toId != null) clearTimeout(toId);
    };

    // Timeout guard
    toId = window.setTimeout(() => finish(false), Math.max(0, timeout));

    // IntersectionObserver path
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            // entry.intersectionRatio is reliable for our threshold test
            if (entry.target === element && entry.intersectionRatio >= clamp01(threshold)) {
              finish(true);
              return;
            }
          }
        },
        {
          root: isWindow(container) ? null : (container as Element),
          threshold: buildThresholds(threshold)
        }
      );
      observer.observe(element);
      return;
    }

    // Fallback: rAF polling
    const poll = () => {
      const ok = computeVisibleRatio(element, container) >= clamp01(threshold);
      if (ok) {
        finish(true);
      } else {
        rafId = requestAnimationFrame(poll);
      }
    };
    rafId = requestAnimationFrame(poll);
  });
}

// Build granular thresholds up to the requested one for snappier IO callbacks
function buildThresholds(target: number): number[] {
  const t = clamp01(target);
  const steps = 10;
  const arr: number[] = [];
  for (let i = 0; i <= steps; i++) {
    const v = i / steps;
    if (v <= t) arr.push(v);
  }
  if (!arr.includes(t)) arr.push(t);
  return arr;
}

// Fallback visible ratio computation
function computeVisibleRatio(el: HTMLElement, container: HTMLElement | Window): number {
  const rect = el.getBoundingClientRect();
  const rootRect = isWindow(container)
    ? new DOMRect(0, 0, window.innerWidth, window.innerHeight)
    : (container as HTMLElement).getBoundingClientRect();

  const xOverlap = Math.max(0, Math.min(rect.right, rootRect.right) - Math.max(rect.left, rootRect.left));
  const yOverlap = Math.max(0, Math.min(rect.bottom, rootRect.bottom) - Math.max(rect.top, rootRect.top));
  const overlapArea = xOverlap * yOverlap;
  const area = Math.max(1, rect.width * rect.height);
  return overlapArea / area;

  function isWindow(c: any): c is Window {
    return !c || c === window || c === document || c === document.scrollingElement;
  }
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}
