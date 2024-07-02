import { Step } from 'src/components/CustomIntro';

export class HandleStep {
  steps: Step[];
  updateSignal: number;
  setUpdateSignal: React.Dispatch<React.SetStateAction<number>>;
  elements: HTMLElement[];
  currentStepIndex: number;
  itemPositions: DOMRect[];
  started: boolean;
  finished: boolean;
  timeoutSignal: NodeJS.Timeout;
  documentHeight: number;
  constructor({
    steps,
    updateSignal,
    setUpdateSignal
  }: {
    steps: Step[];
    updateSignal: number;
    setUpdateSignal: React.Dispatch<React.SetStateAction<number>>;
  }) {
    this.steps = steps;
    this.elements = [];
    this.itemPositions = [];
    this.currentStepIndex = -1;
    this.started = false;
    this.finished = false;
    this.updateSignal = updateSignal;
    this.setUpdateSignal = setUpdateSignal;
    this.timeoutSignal = null;
    this.documentHeight = document?.body.offsetHeight;

    // initialize main class
    this.init();
    this.listeaners();
  }

  listeaners() {
    window.addEventListener('resize', this.init.bind(this));
  }
  removeListeners() {
    window.removeEventListener('resize', this.init.bind(this));
  }

  private sendUpdateSignal() {
    this.setUpdateSignal((prev) => (prev < 10 ? prev + 1 : 0));
  }

  init() {
    if (!this.steps) return;
    clearTimeout(this.timeoutSignal);
    this.documentHeight = document?.body.offsetHeight;
    this.elements = [];
    this.itemPositions = [];
    for (const item of this.steps) {
      if (typeof item.target === 'string') {
        this.elements.push(document.querySelector(item.target));
      } else {
        this.elements.push(item.target);
      }
    }
    setTimeout(() => {
      this.getTargetPositions();
    }, 0);
    this.timeoutSignal = setTimeout(() => {
      this.sendUpdateSignal();
    }, 50);
  }
  getTargetPositions() {
    const positions = [];
    for (const element of this.elements) {
      if (element) {
        positions.push(element.getBoundingClientRect());
      }
    }
    this.itemPositions = positions;
    return positions;
  }
  getArrowPosition() {
    const data = this.getActiveStepData();
    if (!data) return { left: 0, top: 0 };
    return {
      top: data.positionData.top + data.positionData.height + 10,
      left: data.positionData.left + data.positionData.width / 2 + 5
    };
  }
  getActiveStepData() {
    if (!this.started && this.finished) return null;
    if (this.itemPositions[this.currentStepIndex] && this.steps[this.currentStepIndex]) {
      return { positionData: this.itemPositions[this.currentStepIndex], ...this.steps[this.currentStepIndex] };
    }
    return null;
  }

  start() {
    if (this.started) return;
    this.started = true;
    this.next();
  }
  next() {
    if (this.currentStepIndex === this.steps.length - 1) {
      this.reset();
      return;
    }
    this.currentStepIndex++;
    this.sendUpdateSignal();
  }
  prev() {
    if (this.currentStepIndex === 0) return;
    this.currentStepIndex--;
    this.sendUpdateSignal();
  }

  isLastStep() {
    return this.steps.length - 1 === this.currentStepIndex;
  }
  isFirstStep() {
    return this.currentStepIndex === 0;
  }

  reset() {
    this.sendUpdateSignal();
    this.currentStepIndex = -1;
    this.started = false;
    this.finished = false;
  }
}
