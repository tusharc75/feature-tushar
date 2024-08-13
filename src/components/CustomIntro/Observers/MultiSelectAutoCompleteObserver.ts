import { HandleSteps } from 'src/components/CustomIntro/HandleStep';
import { Observer } from 'src/components/CustomIntro/Observers';

export class MultiSelectAutoCompleteObserver extends Observer {
  target: HTMLElement;
  next: () => void;
  observer: MutationObserver;
  validator: (value: string[]) => boolean;
  targetParent: HTMLElement;

  constructor(handleSteps: HandleSteps, element: HTMLElement, validator: (value: string[]) => boolean = (value) => value.length > 0) {
    super(handleSteps, element, validator);
    this.options = {
      attributes: true
    };
    this.targetParent = this.target.parentElement;
    this.observe();
  }

  checkValue() {
    const chipFound: NodeListOf<HTMLSpanElement> = this.targetParent.querySelectorAll('.MuiAutocomplete-tag .MuiChip-label');
    let success = false;
    if (chipFound) {
      success = this.validator(Array.from(chipFound).map((chip) => chip.textContent || chip.innerText));
    } else {
      success = false;
    }
    return success;
  }

  callBack(mutations: MutationRecord[]) {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes') {
        const target = mutation.target as HTMLElement;
        this.attributeTracker[mutation.attributeName] = target.getAttribute(mutation.attributeName);
      }
    }
    if (!this.attributeTracker['aria-controls'] && this.checkValue()) {
      this.handleSteps.next();
      this.success = true;
    } else if (this.target) {
      this.success = false;
    }
  }
}
