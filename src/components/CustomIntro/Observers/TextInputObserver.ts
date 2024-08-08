import { HandleSteps } from 'src/components/CustomIntro/HandleStep';
import { debounce } from 'src/components/CustomIntro/helper';
import { Observer } from 'src/components/CustomIntro/Observers';

export class TextInputObserver extends Observer {
  target: HTMLElement;
  next: () => void;
  observer: MutationObserver;
  validator: (value: string) => boolean;
  stepIndex: number;
  debouncedTracker: null | (() => void);
  cancelDebounceTracker: null | (() => void);
  constructor(handleSteps: HandleSteps, element: HTMLElement, validator: (value: string) => boolean = (value) => value.length > 0) {
    super(handleSteps, element, validator);
    this.options = {
      attributes: true
    };
    this.observe();
    this.debouncedTracker = null;
    this.cancelDebounceTracker = null;
  }

  detectValueChange() {
    const target = this.target as HTMLInputElement | HTMLTextAreaElement;
    if (target?.value && this.validator(target?.value)) {
      // Creating only one instance of debounce
      if (!this.debouncedTracker) {
        const [debouncedTracker, teardown] = debounce(() => {
          this.handleSteps.next();
          this.success = true;
        }, 1500);
        this.debouncedTracker = debouncedTracker;
        this.cancelDebounceTracker = teardown;
      }
      this.debouncedTracker();
    } else if (this.target) {
      this.success = false;
    }
  }

  childCleanup(): void {
    this.cancelDebounceTracker?.();
  }

  callBack(mutations: MutationRecord[]) {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes') {
        const target = mutation.target as HTMLElement;
        this.attributeTracker[mutation.attributeName] = target.getAttribute(mutation.attributeName);
      }
    }
    this.detectValueChange();
  }
}
