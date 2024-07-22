import { HandleSteps } from 'src/components/CustomIntro/HandleStep';
import { Observer } from 'src/components/CustomIntro/Observers';

export class DisableObserver extends Observer {
  target: HTMLElement;
  next: () => void;
  observer: MutationObserver;
  constructor(handleSteps: HandleSteps, element: HTMLElement) {
    super(handleSteps, element);
    this.options = {
      attributes: true
    };
    this.observe();
  }
  callBack(mutations: MutationRecord[]) {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes') {
        const target = mutation.target as HTMLElement;
        this.attributeTracker[mutation.attributeName] = target.getAttribute(mutation.attributeName);
      }
    }
    if (this.attributeTracker['disabled']) {
      this.handleSteps.waiting = true;
      this.handleSteps.sendUpdateSignal();
    } else {
      this.handleSteps.waiting = false;
      this.handleSteps.sendUpdateSignal();
    }
  }
}
