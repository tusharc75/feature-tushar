import { HandleSteps } from 'src/components/CustomIntro/HandleStep';

export class Observer {
  target: HTMLElement;
  observer: MutationObserver;
  options: MutationObserverInit;
  attributeTracker: Record<string, string>;
  handleSteps: HandleSteps;
  constructor(handleSteps: HandleSteps, element: HTMLElement) {
    this.handleSteps = handleSteps;
    this.target = element;
    this.observer = null;
    this.options = {};
    this.attributeTracker = {};
  }

  callBack(mutations: MutationRecord[]) {}

  observe() {
    this.observer = new MutationObserver(this.callBack.bind(this));
    this.observer.observe(this.target, this.options);
  }
  disconnect() {
    this.observer?.disconnect();
  }
}
