import { Step } from 'src/components/CustomIntro';
const RETRY = 10; //in seconds

export class HandleSteps {
  setUpdateSignal: any;
  steps: Step[];
  currentIndex: number;
  started: boolean;
  documentHeight: number;
  finished: boolean;
  boundMousedown!: (e: MouseEvent) => void;
  currentStepData:
    | ({
        positionData: DOMRect;
        element: HTMLElement;
        index: number;
      } & Step)
    | null;
  interval: NodeJS.Timeout;
  retry: number;
  message: string;
  waitingForUser: boolean;
  error: boolean;
  resizeObserver: ResizeObserver;
  constructor({ setUpdateSignal, steps }: { setUpdateSignal: React.Dispatch<React.SetStateAction<number>>; steps: Step[] }) {
    this.setUpdateSignal = setUpdateSignal;
    this.steps = steps;
    this.currentIndex = -1;
    this.started = false;
    this.finished = false;
    this.currentStepData = null;
    this.documentHeight = document?.body.offsetHeight;
    this.retry = 0;
    this.interval = null;
    this.message = '';
    this.error = false;
    this.waitingForUser = false;
    this.resizeObserver = new ResizeObserver((entries) => {
      window.requestAnimationFrame(() => {
        if (!entries[0]) return;
        const height = entries[0].target.clientHeight;
        this.documentHeight = height;
        if (this.started) {
          this.getCurrentStep(true);
        }
      });
    });

    this.addEventListeners();
    this.resizeObserver.observe(document?.body);
  }

  toggleWaitForUser() {
    this.waitingForUser = this.steps[this.currentIndex - 1]?.waitForUserClick;
  }

  private addEventListeners() {
    this.boundMousedown = this.handleMouseDown.bind(this);
    window.addEventListener('mousedown', this.boundMousedown);
  }
  removeListeners() {
    window.removeEventListener('mousedown', this.boundMousedown);
  }

  handleMouseDown(e: MouseEvent) {
    // if (this.steps[this.currentIndex]?.waitForUserClick) {
    //   this.waitingForUser = true;
    // }
  }

  start() {
    this.started = true;
    if (this.waitingForUser) {
      this.waitingForUser = false;
      this.getCurrentStep();
      this.sendUpdateSignal();
    } else {
      this.next();
    }
  }
  finish() {
    this.reset();
  }
  reset() {
    this.started = false;
    this.finished = false;
    this.currentIndex = -1;
    this.sendUpdateSignal();
  }
  next() {
    if (this.currentIndex === this.steps.length - 1) this.reset();
    this.currentIndex++;
    this.getCurrentStep();
    console.log(this);
  }
  previous() {
    if (this.currentIndex === 0) return;
    this.currentIndex--;
    this.getCurrentStep();
  }

  getCurrentStep(dirty = false) {
    if (!this.steps[this.currentIndex]) return;
    if (this.currentStepData?.index === this.currentIndex && !dirty) return this.currentStepData;
    const activeStep = this.steps[this.currentIndex];
    let element = document.querySelector(activeStep.target) as HTMLElement;
    if (!element) {
      this.interval = setInterval(() => {
        this.retry++;
        if (this.retry >= RETRY) {
          clearInterval(this.interval);
          this.message = 'Element not found';
          this.error = true;
          this.reset();
        }
        element = document.querySelector(activeStep.target) as HTMLElement;
        if (element) {
          this.retry = 0;
          this.currentStepData = {
            ...activeStep,
            positionData: element?.getBoundingClientRect(),
            index: this.currentIndex,
            element
          };
          clearInterval(this.interval);
          // this.focusElement(element);
          setTimeout(() => {
            this.sendUpdateSignal();
          }, 200);
        }
      }, 1000);
    }

    this.currentStepData = {
      ...activeStep,
      positionData: element?.getBoundingClientRect(),
      index: this.currentIndex,
      element
    };
    // this.focusElement(element);
    setTimeout(() => {
      this.sendUpdateSignal();
    }, 200);
  }

  focusElement(element: HTMLElement) {
    if (this.waitingForUser) return;
    setTimeout(() => {
      element.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  }

  private sendUpdateSignal() {
    this.setUpdateSignal((prev) => (prev < 10 ? prev + 1 : 0));
  }

  isLastStep() {
    return this.steps.length - 1 === this.currentIndex;
  }
  isFirstStep() {
    return this.currentIndex === 0;
  }
}
