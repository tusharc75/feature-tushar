// src/components/Walkme/classes/inputCallbacks.ts
type Resolve = (valid: boolean) => void;

// Utility: ensure resolve fires only once when valid
const resolveIfValidOnce = (resolve: Resolve) => {
  let done = false;
  return (valid: boolean) => {
    if (!done && valid) {
      done = true;
      resolve(true);
    }
  };
};

export function textInputCallback({
  targetElement,
  resolve,
  validator,
  immediateEvaluate = true
}: {
  targetElement: HTMLElement;
  resolve: (valid: boolean) => void;
  validator: (value: string) => boolean;
  immediateEvaluate?: boolean;
}): () => void {
  const resolveOnce = ((done) => (valid: boolean) => {
    if (!done && valid) {
      done = true;
      resolve(true);
    }
  })(false);

  const inputEl =
    targetElement.tagName?.toLowerCase() === 'input' || targetElement.tagName?.toLowerCase() === 'textarea'
      ? (targetElement as HTMLInputElement | HTMLTextAreaElement)
      : (targetElement.querySelector('input, textarea') as HTMLInputElement | HTMLTextAreaElement | null);

  if (!inputEl) return () => {};

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let rafId: number | null = null;
  let attrObserver: MutationObserver | null = null;

  // Track last seen value to ignore no-op updates
  let lastValue = inputEl.value ?? '';

  const evaluate = () => {
    const raw = inputEl.value ?? '';
    lastValue = raw;
    resolveOnce(validator(raw));
  };

  const scheduleEvaluate = (debounceMs = 1000) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(evaluate, debounceMs);
  };

  const onUserEvent = () => scheduleEvaluate(1000);

  // Listen to user-driven events
  inputEl.addEventListener('input', onUserEvent);
  inputEl.addEventListener('change', onUserEvent);

  // 1) Hook the instance's value setter to catch programmatic updates (e.g., React)
  let hookedSetter = false;
  try {
    const proto = inputEl instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;

    const desc = Object.getOwnPropertyDescriptor(proto, 'value');
    if (desc && desc.get && desc.set) {
      Object.defineProperty(inputEl, 'value', {
        configurable: true,
        enumerable: desc.enumerable ?? false,
        get() {
          return desc.get!.call(this);
        },
        set(v: string) {
          const prev = lastValue;
          desc.set!.call(this, v);
          const cur = desc.get!.call(this) as string;
          if (cur !== prev) {
            // Programmatic change detected
            scheduleEvaluate(1000);
          }
        }
      });
      hookedSetter = true;
    }
  } catch {
    // Fall back below
  }

  // 2) Observe attribute changes to 'value' (some libs touch the attribute)
  try {
    attrObserver = new MutationObserver(() => {
      const cur = inputEl.value ?? '';
      if (cur !== lastValue) scheduleEvaluate(1000);
    });
    attrObserver.observe(inputEl, { attributes: true, attributeFilter: ['value'] });
  } catch {
    // ignore
  }

  // 3) Fallback polling if setter hook failed (or as belt-and-braces)
  if (!hookedSetter) {
    const poll = () => {
      const cur = inputEl.value ?? '';
      if (cur !== lastValue) {
        scheduleEvaluate(1000);
      }
      rafId = window.requestAnimationFrame(poll);
    };
    rafId = window.requestAnimationFrame(poll);
  }

  // Immediate evaluation on mount if desired
  if (immediateEvaluate) {
    queueMicrotask(() => {
      evaluate();
    });
  }

  return () => {
    inputEl.removeEventListener('input', onUserEvent);
    inputEl.removeEventListener('change', onUserEvent);
    if (debounceTimer) clearTimeout(debounceTimer);

    if (attrObserver) {
      attrObserver.disconnect();
      attrObserver = null;
    }

    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    // Restore original value accessor by removing the instance override
    try {
      if (Object.prototype.hasOwnProperty.call(inputEl, 'value')) {
        delete (inputEl as any).value;
      }
    } catch {
      // ignore
    }
  };
}

export function checkboxCallback({
  targetElement,
  resolve,
  validator,
  immediateEvaluate = true
}: {
  targetElement: HTMLElement;
  resolve: Resolve;
  validator: (checked: boolean) => boolean;
  immediateEvaluate?: boolean;
}): () => void {
  const resolveOnce = resolveIfValidOnce(resolve);

  // Handle checkbox or radio group gracefully
  let inputEl =
    (targetElement as HTMLInputElement).tagName?.toLowerCase() === 'input'
      ? (targetElement as HTMLInputElement)
      : (targetElement.querySelector('input[type="checkbox"], input[type="radio"]') as HTMLInputElement | null);

  if (!inputEl) {
    return () => {};
  }

  const emit = () => {
    if (inputEl?.type === 'radio') {
      const checked = !!(
        inputEl.closest('[role="radiogroup"]')?.querySelector('input[type="radio"]:checked') ||
        inputEl.closest('form')?.querySelector('input[type="radio"]:checked') ||
        inputEl.closest('*')?.querySelector('input[type="radio"]:checked')
      );
      resolveOnce(validator(checked));
    } else {
      const checked = !!inputEl.checked;
      resolveOnce(validator(checked));
    }
  };

  const handler = () => emit();

  inputEl.addEventListener('change', handler);
  inputEl.addEventListener('click', handler);

  if (immediateEvaluate) {
    queueMicrotask(handler);
  }

  return () => {
    inputEl.removeEventListener('change', handler);
    inputEl.removeEventListener('click', handler);
  };
}

export function autocompleteCallback({
  targetElement,
  resolve,
  validator,
  immediateEvaluate = true
}: {
  targetElement: HTMLElement;
  resolve: (valid: boolean) => void;
  validator: (value: string) => boolean;
  immediateEvaluate?: boolean;
}): () => void {
  const inputEl = targetElement.matches('input')
    ? (targetElement as HTMLInputElement)
    : (targetElement.querySelector('input') as HTMLInputElement | null);
  if (!inputEl) return () => {};

  const attributeTracker: Record<string, string | null> = {};
  let resolved = false;
  const resolveOnce = (valid: boolean) => {
    if (!resolved && valid) {
      resolved = true;
      resolve(true);
      observer.disconnect();
    }
  };

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes') {
        const attr = mutation.attributeName!;
        attributeTracker[attr] = inputEl.getAttribute(attr);
      }
    }
    const value = attributeTracker['value'] || inputEl.value || '';
    const isOpen = !!attributeTracker['aria-controls'];
    if (!isOpen && value && validator(value)) {
      resolveOnce(true);
    }
  });

  observer.observe(inputEl, { attributes: true, attributeFilter: ['value', 'aria-controls'] });

  if (immediateEvaluate) {
    // Immediate evaluation
    queueMicrotask(() => {
      const value = inputEl.getAttribute('value') || inputEl.value || '';
      const isOpen = !!inputEl.getAttribute('aria-controls');
      if (!isOpen && value && validator(value)) {
        resolveOnce(true);
      }
    });
  }

  return () => observer.disconnect();
}

export function multiSelectAutocompleteCallback({
  targetElement,
  resolve,
  validator,
  immediateEvaluate = true
}: {
  targetElement: HTMLElement;
  resolve: Resolve;
  validator: (values: string[]) => boolean;
  immediateEvaluate?: boolean;
}): () => void {
  const resolveOnce = resolveIfValidOnce(resolve);

  // Best-effort root for MUI Autocomplete multi-select:
  const root = targetElement.closest('.MuiAutocomplete-root') ?? targetElement.parentElement ?? targetElement;

  const readChips = () => {
    const chips = root.querySelectorAll('.MuiChip-root, [data-chip="true"]');
    const values = Array.from(chips).map((chip) => (chip.textContent ?? '').trim());
    return values;
  };

  const evaluate = () => {
    resolveOnce(validator(readChips()));
  };

  // Observe chip add/remove and text changes inside chips
  const observer = new MutationObserver(() => evaluate());
  observer.observe(root, { childList: true, subtree: true });

  // Some libraries also modify hidden inputs to hold values; listen to input too
  const inputEl = root.querySelector('input') as HTMLInputElement | null;
  const onInput = () => evaluate();
  inputEl?.addEventListener('input', onInput);
  inputEl?.addEventListener('change', onInput);
  inputEl?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === 'Tab' || e.key === 'Backspace') {
      queueMicrotask(evaluate);
    }
  });

  if (immediateEvaluate) {
    // Immediate evaluation
    queueMicrotask(evaluate);
  }

  return () => {
    observer.disconnect();
    inputEl?.removeEventListener('input', onInput);
    inputEl?.removeEventListener('change', onInput);
  };
}
