import { HandleSteps } from 'src/components/CustomIntro/HandleStep';
import { Observer } from 'src/components/CustomIntro/Observers';

export class AutocompleteObserver extends Observer {
  target: HTMLElement;
  next: () => void;
  observer: MutationObserver;
  validator: (value: string) => boolean;
  parent: HTMLElement;

  constructor(handleSteps: HandleSteps, element: HTMLElement, validator: (value: string) => boolean = (value) => value.length > 0) {
    super(handleSteps, element, validator);
    this.options = {
      attributes: true
    };
    this.parent = this.target.parentElement;
    this.observe();
  }

  callBack(mutations: MutationRecord[]) {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes') {
        const target = mutation.target as HTMLElement;
        this.attributeTracker[mutation.attributeName] = target.getAttribute(mutation.attributeName);
      }
    }
    if (!this.attributeTracker['aria-controls'] && this.attributeTracker['value'] && this.validator(this.attributeTracker['value'])) {
      this.handleSteps.next();
      this.success = true;
    } else if (this.target) {
      this.success = false;
    }
  }
}
