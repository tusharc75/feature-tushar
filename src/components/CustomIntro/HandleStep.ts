import { NormalStep, Step, StepDefination } from 'src/components/CustomIntro';
import { Observer } from 'src/components/CustomIntro/Observers';
import { AutocompleteObserver } from 'src/components/CustomIntro/Observers/AutoCompleteObserver';
import { DisableObserver } from 'src/components/CustomIntro/Observers/DisableObserver';
import { TextInputObserver } from 'src/components/CustomIntro/Observers/TextInputObserver';
const RETRY = 20; //in seconds

export class HandleSteps {
  private setUpdateSignal: any;
  steps: Step[];
  currentIndex: number;
  started: boolean;
  documentHeight: number;
  finished: boolean;
  boundMousedown!: (e: MouseEvent) => void;
  currentStepData:
    | ({
        positionData: {
          bottom: number;
          height: number;
          left: number;
          right: number;
          top: number;
          width: number;
          x: number;
          y: number;
        };
        element: HTMLElement;
        index: number;
      } & Step)
    | null;
  interval: NodeJS.Timeout;
  retry: number;
  message: string;
  error: boolean;
  resizeObserver: ResizeObserver;
  waitedForClicks: number;
  listenerAttachedElements: { elm: HTMLElement; event: keyof HTMLElementEventMap; func: any }[];
  handleReset: () => void;
  findingElement: boolean;
  attachedOvservers: Observer[];
  clicked: boolean;
  waiting: boolean;
  constructor({
    setUpdateSignal,
    steps,
    onReset
  }: {
    setUpdateSignal: React.Dispatch<React.SetStateAction<number>>;
    steps: StepDefination[];
    onReset: () => void;
  }) {
    this.setUpdateSignal = setUpdateSignal;
    this.handleReset = onReset;
    this.steps = this.initializeStepData(steps);
    this.currentIndex = -1;
    this.started = false;
    this.finished = false;
    this.currentStepData = null;
    this.documentHeight = document?.body.clientHeight;
    this.retry = 0;
    this.interval = null;
    this.waitedForClicks = 0;
    this.listenerAttachedElements = [];
    this.attachedOvservers = [];
    this.findingElement = false;
    this.error = false;
    this.clicked = false;
    this.waiting = false;
    this.message = '';
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

  private addEventListeners() {
    this.boundMousedown = this.handleNextMouseDown.bind(this);
    window.addEventListener('mousedown', this.boundMousedown);
  }
  removeListeners() {
    window.removeEventListener('mousedown', this.boundMousedown);
  }

  handleNextMouseDown(e: MouseEvent) {
    if (this.currentStepData.isHiddenStep && this.currentStepData.element.contains(e.target as Node) && this.currentStepData.nextOnUserClicks) {
      this.waitedForClicks += 1;
      if (this.waitedForClicks >= this.currentStepData.nextOnUserClicks) {
        this.next();
        this.waitedForClicks = 0;
      }
    }
  }

  handleNextOnFocusOut(e: FocusEvent) {
    this.next();
  }
  handleNextOnValueChange(e: FocusEvent) {
    const target = e.target as HTMLInputElement;
    if (target?.value?.trim()) {
      this.next();
    }
  }
  handleNextOnKeyDown(e: KeyboardEvent) {
    if (this.currentStepData.isHiddenStep && e.key === this.currentStepData.nextOnKeyPress) {
      this.next();
    }
  }

  attachObservers() {
    const currStepData = this.currentStepData;
    if (!currStepData) return;

    // All steps
    if (currStepData.waitForEnable) {
      const observer = new DisableObserver(this, this.currentStepData.element);
      this.attachedOvservers.push(observer);
    }

    // Hidden steps
    if (!this.currentStepData.isHiddenStep) return;
    const currData = this.currentStepData;
    if (currData.nextOnFocusOut) {
      currData.element.addEventListener('blur', this.handleNextOnFocusOut.bind(this));
      this.listenerAttachedElements.push({ elm: currData.element, event: 'blur', func: this.handleNextOnFocusOut.bind(this) });
    }
    if (currData.nextOnValueChange) {
      const isAutoComplete = this.currentStepData.element.classList.contains('MuiAutocomplete-input');
      // Track autocomplete via autocomplete observer
      if (isAutoComplete) {
        let validator = (value: string) => value.length > 0;
        if (typeof this.currentStepData.nextOnValueChange === 'function') {
          validator = this.currentStepData.nextOnValueChange;
        }
        const observer = new AutocompleteObserver(this, this.currentStepData.element, validator);
        this.attachedOvservers.push(observer);
      } else {
        // Track Text input via observer
        let validator = (value: string) => value.length > 0;
        if (typeof this.currentStepData.nextOnValueChange === 'function') {
          validator = this.currentStepData.nextOnValueChange;
        }
        const observer = new TextInputObserver(this, this.currentStepData.element, validator);
        this.attachedOvservers.push(observer);
      }
    }
    if (currData.nextOnKeyPress) {
      currData.element.addEventListener('keydown', this.handleNextOnKeyDown.bind(this));
      this.listenerAttachedElements.push({ elm: currData.element, event: 'keydown', func: this.handleNextOnKeyDown.bind(this) });
    }
  }

  removeNextObservers() {
    this.listenerAttachedElements.map((d) => d.elm.removeEventListener(d.event, d.func));
    this.attachedOvservers.map((d) => d.disconnect());
    this.listenerAttachedElements = [];
    this.attachedOvservers = [];
  }

  start() {
    this.started = true;
    this.next();
  }
  finish() {
    this.reset();
  }
  reset() {
    this.started = false;
    this.finished = false;
    this.clicked = false;
    this.currentIndex = -1;
    this.handleReset();
  }
  next() {
    if (this.currentIndex === this.steps.length - 1) {
      this.reset();
    }

    // To debounce click only register first click
    if (this.clicked || this.waiting) return;

    this.clicked = true;
    this.currentIndex++;

    this.getCurrentStep();
    this.removeNextObservers();
  }
  previous() {
    if (this.currentIndex === 0) {
      this.getCurrentStep();
      return;
    }
    // To debounce click only register first click
    if (this.clicked) return;
    this.clicked = true;
    this.currentIndex--;
    if (this.steps[this.currentIndex]?.isHiddenStep) {
      this.previous();
    }
    this.removeNextObservers();
    this.getCurrentStep();
  }

  getCurrentStep(dirty = false, index = this.currentIndex) {
    if (!this.steps[index]) return;
    if (this.currentStepData?.index === index && !dirty) return this.currentStepData;
    this.findingElement = true;
    const activeStep = this.steps[index];
    clearInterval(this.interval);
    let element = document.querySelector(activeStep.target) as HTMLElement;
    this.sendUpdateSignal();
    if (!element) {
      this.retry++;
      if (this.retry >= RETRY) {
        clearInterval(this.interval);
        this.message = 'Element not found';
        this.error = true;

        this.reset();
      }

      this.interval = setInterval(() => {
        this.getCurrentStep();
      }, 1000);
    } else {
      this.retry = 0;
      this.findingElement = false;
      const { bottom, height, left, right, top, width, x, y } = element?.getBoundingClientRect();
      const positionData = { bottom, height, left: left + window.scrollX, right, top: top + window.scrollY, width, x, y };
      // this.scrollToCurrentStep(element);

      // Check if value exist then move on to the next step
      if (activeStep.skipIfValueExist) {
        const inputElement = element as HTMLInputElement;
        if (inputElement.value?.length > 0) {
          this.clicked = false;
          this.next();
          return;
        }
      }

      this.clicked = false;
      this.currentStepData = {
        ...activeStep,
        positionData,
        index: index,
        element
      };

      // Settimeout with 0 sec delay will move these function calls to js task queue and will execute later
      setTimeout(() => {
        this.attachObservers();
        this.sendUpdateSignal();
      }, 0);
    }
  }

  private initializeStepData(steps: StepDefination[]) {
    const newSteps: Step[] = [];
    for (const data of steps) {
      const normalStep: NormalStep = {
        title: data.title,
        content: data.content,
        target: data.target,
        isHiddenStep: false,
        nextButtonName: data.nextButtonName,
        willOpenDialog: data.willOpenDialog,
        waitForStepInsertion: data.waitForStepInsertion
      };
      if (data.skipIfValueExist) {
        normalStep.skipIfValueExist = data.skipIfValueExist;
      }

      if (['nextOnUserClicks', 'nextOnFocusOut', 'nextOnValueChange', 'nextOnKeyPress'].some((d) => d in data)) {
        newSteps.push(normalStep);
        newSteps.push({
          ...data,
          target: data.target,
          isHiddenStep: true
        });
      } else {
        newSteps.push(normalStep);
      }
    }
    return newSteps;
  }

  push(steps: StepDefination[]) {
    this.steps.push(...this.initializeStepData(steps));
  }
  insert(steps: StepDefination[], index: number) {
    this.steps.splice(index, 0, ...this.initializeStepData(steps));
  }
  insertAtCurrentIndex(steps: StepDefination[]) {
    this.steps.splice(this.currentIndex + 1, 0, ...this.initializeStepData(steps));
  }
  pop() {
    this.steps.pop();
  }
  shift() {
    this.steps.shift();
  }
  unshift(steps: StepDefination[]) {
    this.steps.unshift(...this.initializeStepData(steps));
  }
  splice(start: number, deleteCount: number, steps: StepDefination[]) {
    this.steps.splice(start, deleteCount, ...this.initializeStepData(steps));
  }
  sort(compareFn?: (a: Step, b: Step) => number) {
    this.steps.sort(compareFn);
  }
  reverse() {
    this.steps.reverse();
  }

  sendUpdateSignal() {
    this.setUpdateSignal((prev) => (prev < 10 ? prev + 1 : 0));
  }

  pause() {
    this.waiting = true;
    this.sendUpdateSignal();
  }
  resume() {
    this.waiting = false;
    this.sendUpdateSignal();
  }

  scrollToCurrentStep(element: HTMLElement) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
  }

  isLastStep() {
    return this.steps.length - 1 === this.currentIndex;
  }
  isFirstStep() {
    return this.currentIndex === 0;
  }
}
