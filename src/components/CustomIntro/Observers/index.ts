import { HandleSteps } from 'src/components/CustomIntro/HandleStep';

export class Observer {
  target: HTMLElement;
  observer: MutationObserver;
  options: MutationObserverInit;
  attributeTracker: Record<string, string>;
  handleSteps: HandleSteps;
  success: boolean;
  actualIndex: number;
  stepIndex: number;
  parent: HTMLElement;
  validator: (value: string | string[]) => boolean;
  constructor(handleSteps: HandleSteps, element: HTMLElement, validator: (value: string | string[]) => boolean = (value) => value.length > 0) {
    this.handleSteps = handleSteps;
    this.validator = validator;
    this.target = element;
    this.observer = null;
    this.options = {};
    this.attributeTracker = {};
    this.success = false;
    this.actualIndex = handleSteps.currentIndex;
    this.stepIndex = handleSteps.currentStepData.isHiddenStep ? handleSteps.currentIndex - 1 : handleSteps.currentIndex;
    this.parent = this.target.parentElement;
  }

  checkClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!this.parent.contains(target) && this.actualIndex === this.handleSteps.currentIndex) {
      this.success = true;
      this.handleSteps.clicked = false;
      this.handleSteps.next();
      return;
    }
  }

  checkKeyboard(e: KeyboardEvent) {
    const isvalidKey = ['Enter', 'Escape'].includes(e.key);
    if (isvalidKey && this.actualIndex === this.handleSteps.currentIndex) {
      this.success = true;
      this.handleSteps.clicked = false;
      this.handleSteps.next();
      return;
    }
  }

  checkIfValueExist() {
    const activeStep = this.handleSteps.steps[this.stepIndex];
    if (!activeStep.skipIfValueExist) return;
    const inputElement = this.target as HTMLInputElement;
    if (!this.validator(inputElement.value)) return;
    document.addEventListener('click', this.checkClick.bind(this));
    document.addEventListener('keydown', this.checkKeyboard.bind(this));
  }

  callBack(mutations: MutationRecord[]) {}

  observe() {
    this.checkIfValueExist();
    this.observer = new MutationObserver(this.callBack.bind(this));
    this.observer.observe(this.target, this.options);
  }
  disconnect() {
    this.observer?.disconnect();
  }
  childCleanup() {}
  cleanup() {
    document.removeEventListener('click', this.checkClick.bind(this));
    document.removeEventListener('keydown', this.checkKeyboard.bind(this));
    this.childCleanup();
  }
}
