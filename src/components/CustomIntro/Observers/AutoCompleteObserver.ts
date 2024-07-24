import { HandleSteps } from 'src/components/CustomIntro/HandleStep';
import { Observer } from 'src/components/CustomIntro/Observers';

export class AutocompleteObserver extends Observer {
  target: HTMLElement;
  next: () => void;
  observer: MutationObserver;
  valiDator: (value: string) => boolean;

  constructor(handleSteps: HandleSteps, element: HTMLElement, valiDator: (value: string) => boolean = (value) => value.length > 0) {
    super(handleSteps, element);
    this.options = {
      attributes: true
    };
    this.valiDator = valiDator;
    this.observe();
  }
  callBack(mutations: MutationRecord[]) {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes') {
        const target = mutation.target as HTMLElement;
        this.attributeTracker[mutation.attributeName] = target.getAttribute(mutation.attributeName);
      }
    }
    if (!this.attributeTracker['aria-controls'] && this.attributeTracker['value'] && this.valiDator(this.attributeTracker['value'])) {
      this.handleSteps.next();
      this.success = true;
    } else if (this.target) {
      this.success = false;
    }
  }
}
