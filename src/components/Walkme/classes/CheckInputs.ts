import {
  checkboxCallback,
  autocompleteCallback,
  textInputCallback,
  multiSelectAutocompleteCallback
} from 'src/components/Walkme/classes/inputCallbacks';
import { StepWithAllData } from 'src/components/Walkme/types';

export class CheckInputs {
  cleanupFns: Array<() => void> = [];
  passedFailedIndexes: boolean[] = [];
  handleNext: () => void;

  constructor(handleNext: () => void) {
    this.handleNext = handleNext;
  }

  async check(step: StepWithAllData, targetElement: HTMLElement, index: number): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const tagName = targetElement.tagName.toLowerCase();
      const dataType = targetElement.closest('[datatype]')?.getAttribute('datatype');

      // If there's no input/textarea to validate, just move on
      if (!['input', 'textarea'].includes(tagName) && !targetElement.querySelector('input, textarea')) {
        this.passedFailedIndexes[index] = true;
        this.handleNext();
        return resolve(true);
      }

      this.passedFailedIndexes[index] = false;

      const isMultiSelect = dataType === 'multiSelect';
      const isAutoComplete = targetElement.classList.contains('MuiAutocomplete-input') || targetElement.closest('.MuiAutocomplete-root') !== null;
      const isCheckbox = targetElement.getAttribute('type') === 'checkbox' || !!targetElement.querySelector('input[type="checkbox"]');
      const isRadio = targetElement.getAttribute('type') === 'radio' || !!targetElement.querySelector('input[type="radio"]');

      // Guarded resolve that updates state and cleans up exactly once
      let settled = false;
      const cleanupPrev = this.cleanupFns[index];
      cleanupPrev?.();

      const finalize = () => {
        if (settled) return;
        settled = true;
        // Stop listeners/observers for this index
        this.cleanupFns[index]?.();
        this.cleanupFns[index] = undefined as unknown as () => void;
        resolve(true);
      };

      const resolveInput = (valid: boolean) => {
        this.passedFailedIndexes[index] = valid;
        if (valid) {
          this.handleNext();
          finalize();
        }
      };

      // Choose validator per type
      const numberLike = (el: HTMLElement) => {
        const inputEl = (el.matches('input') ? el : el.querySelector('input')) as HTMLInputElement | null;
        return inputEl?.getAttribute('type') === 'number';
      };
      const textValidator = (v: string) => (numberLike(targetElement) ? v.trim().length > 0 && Number(v) !== 0 : v.trim().length > 0);
      const checkboxValidator = (v: boolean) => v === true;
      const multiSelectValidator = (values: string[]) => values.length > 0;

      // Helpers to read current values for early-skip logic
      const findInput = <T extends HTMLElement = HTMLInputElement | HTMLTextAreaElement>(): T | null => {
        if (targetElement.matches('input, textarea')) return targetElement as T;
        return targetElement.querySelector('input, textarea') as T | null;
      };

      const currentValidity = (): boolean => {
        if (isMultiSelect) {
          // chips under MUI Autocomplete multi
          const root = targetElement.closest('.MuiAutocomplete-root') ?? targetElement.parentElement ?? targetElement;
          const chips = root.querySelectorAll('.MuiChip-root, [data-chip="true"]');
          const values = Array.from(chips).map((chip) => (chip.textContent ?? '').trim());
          return multiSelectValidator(values);
        }

        if (isAutoComplete && !isCheckbox && !isRadio) {
          const inputEl = (targetElement.matches('input') ? targetElement : targetElement.querySelector('input')) as HTMLInputElement | null;
          if (!inputEl) return false;
          // Consider closed dropdown as “finalized” state; value from prop or attribute
          const isOpen = !!inputEl.getAttribute('aria-controls');
          const value = inputEl.value || inputEl.getAttribute('value') || '';
          return !isOpen && value ? textValidator(value) : false;
        }

        if (isCheckbox) {
          const inputEl = (targetElement as HTMLInputElement).matches('input[type="checkbox"]')
            ? (targetElement as HTMLInputElement)
            : (targetElement.querySelector('input[type="checkbox"]') as HTMLInputElement | null);
          return !!inputEl && checkboxValidator(!!inputEl.checked);
        }

        if (isRadio) {
          const checked = targetElement.querySelector('input[type="radio"]:checked') as HTMLInputElement | null;
          return !!checked; // Any selection is considered valid
        }

        // text/number/textarea
        const inputEl = findInput<HTMLInputElement | HTMLTextAreaElement>();
        const raw = inputEl?.value ?? '';
        return textValidator(raw);
      };

      // Skip immediately if requested and a current value already exists and is valid
      if (step.skipIfValueExist === true && currentValidity()) {
        console.log('pre-skipping', targetElement);
        this.passedFailedIndexes[index] = true;
        this.handleNext();
        return finalize();
      }

      // Attach appropriate callback; store cleanup
      // When skipIfValueExist is false, we do NOT want immediate evaluation on prefilled values.
      // When true, we allow immediate evaluation (which won't auto-advance here because we already checked above).
      const immediateEvaluate = step.skipIfValueExist === true;

      let cleanup: () => void = () => {};
      if (isMultiSelect) {
        cleanup = multiSelectAutocompleteCallback({
          targetElement,
          resolve: resolveInput,
          validator: multiSelectValidator,
          immediateEvaluate
        });
      } else if (isAutoComplete && !isCheckbox && !isRadio) {
        cleanup = autocompleteCallback({
          targetElement,
          resolve: resolveInput,
          validator: (v: string) => v.trim().length > 0,
          immediateEvaluate
        });
      } else if (isCheckbox || isRadio) {
        cleanup = checkboxCallback({
          targetElement,
          resolve: resolveInput,
          validator: checkboxValidator,
          immediateEvaluate
        });
      } else {
        cleanup = textInputCallback({
          targetElement,
          resolve: resolveInput,
          validator: textValidator,
          immediateEvaluate
        });
      }

      // Save cleanup so we can tear down on next check or when resolved
      this.cleanupFns[index] = cleanup;
    });
  }

  // Optional: call this when the step is exited to clean everything at once
  cleanupAll() {
    this.cleanupFns.forEach((fn) => fn?.());
    this.cleanupFns = [];
  }
}
