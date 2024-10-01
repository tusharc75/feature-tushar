import { HandleSteps } from 'src/components/CustomIntro/HandleStep';
import { Observer } from 'src/components/CustomIntro/Observers';

export class CheckBoxObserver extends Observer {
  target: HTMLElement;
  next: () => void;
  observer: MutationObserver;
  validator: (value: boolean) => boolean;
  stepIndex: number;
  debouncedTracker: null | (() => void);
  cancelDebounceTracker: null | (() => void);
  isCheckBoxInsideTable: boolean;
  constructor(handleSteps: HandleSteps, element: HTMLElement, validator: (value: boolean) => boolean = (value) => value) {
    super(handleSteps, element, validator);
    this.options = {
      attributes: true
    };
    this.debouncedTracker = null;
    this.cancelDebounceTracker = null;
    this.options = { attributes: true, childList: true, attributeFilter: ['checked'] };
    this.isCheckBoxInsideTable = Boolean(this.target.getAttribute('aria-label'));
    this.init();
  }

  private init() {
    const target = this.isCheckBoxInsideTable
      ? this.target.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement // table body
      : this.target; // input element
    this.observe(target);
  }

  checkIfValueExist(): void {
    const target = this.target as HTMLInputElement;
    if (this.validator(target?.checked)) {
      this.success = true;
      this.handleSteps.next();
    } else {
      this.success = false;
    }
  }

  validate(target: HTMLInputElement) {
    if (this.validator(target?.checked)) {
      this.success = true;
      this.handleSteps.next();
    } else {
      this.success = false;
    }
  }

  callBack(mutations: MutationRecord[]) {
    for (const mutation of mutations) {
      if (this.isCheckBoxInsideTable && mutation.type === 'childList') {
        const target = document.querySelector(this.handleSteps.currentStepData.target) as HTMLInputElement;
        if (!target) return;
        this.target = target;
        this.handleSteps.currentStepData.element = this.target;
        this.validate(target);
      } else if (mutation.type === 'attributes') {
        const target = mutation.target as HTMLElement;
        this.attributeTracker[mutation.attributeName] = target.getAttribute(mutation.attributeName);
        this.validate(this.target as HTMLInputElement);
      }
    }
  }
}
