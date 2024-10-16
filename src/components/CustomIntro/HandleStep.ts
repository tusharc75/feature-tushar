import { NormalStep, Step, StepDefination } from 'src/components/CustomIntro';
import { Observer } from 'src/components/CustomIntro/Observers';
import { AutocompleteObserver } from 'src/components/CustomIntro/Observers/AutoCompleteObserver';
import { CheckBoxObserver } from 'src/components/CustomIntro/Observers/CheckBoxObserver';
import { CheckForRequiredFields } from 'src/components/CustomIntro/Observers/CheckForRequiredFields';
import { DisableObserver } from 'src/components/CustomIntro/Observers/DisableObserver';
import { MultiSelectAutoCompleteObserver } from 'src/components/CustomIntro/Observers/MultiSelectAutoCompleteObserver';
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
  originalSteps: StepDefination[];
  clicked: boolean;
  waiting: boolean;
  tempIndex: number;
  checkForRequiredFields: CheckForRequiredFields;
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
    this.tempIndex = -1;
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
    this.loop();
    this.addEventListeners();
    this.resizeObserver.observe(document?.body);
    this.checkForRequiredFields = new CheckForRequiredFields(this);
  }

  private addEventListeners() {
    this.boundMousedown = this.handleNextMouseDown.bind(this);
    window.addEventListener('mousedown', this.boundMousedown);
  }

  private loop() {
    if (this.error) {
      console.error(this.message);
      this.error = false;
      this.message = '';
    }
    window.requestAnimationFrame(() => {
      this.checkPreviousObservers();
      this.loop();
      this.checkForRequiredFields?.update();
      this.checkForRequiredFields?.render();
    });
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
    if (this.currentStepData.isHiddenStep && this.currentStepData.nextOnKeyPress(e)) {
      this.next();
    }
  }

  attachObservers() {
    this.attachedOvservers.map((o) => o.cleanup());
    const currStepData = this.currentStepData;

    if (!currStepData) return;
    const isObserverPresent = this.attachedOvservers.find((o) => o.actualIndex === this.currentIndex);
    if (isObserverPresent) return;

    // All steps
    if (currStepData.waitForEnable) {
      const observer = new DisableObserver(this, this.currentStepData.element);
      this.attachedOvservers.push(observer);
    }

    // Hidden steps
    if (!this.currentStepData.isHiddenStep) return;
    const currData = this.currentStepData;
    if (currData.nextOnFocusOut) {
      if (currData.element.tagName === 'IFRAME') {
        const element = currData.element as HTMLIFrameElement;
        element.contentDocument.body.addEventListener('blur', this.handleNextOnFocusOut.bind(this));
        this.listenerAttachedElements.push({ elm: element.contentDocument.body, event: 'blur', func: this.handleNextOnFocusOut.bind(this) });
      } else {
        currData.element.addEventListener('blur', this.handleNextOnFocusOut.bind(this));
        this.listenerAttachedElements.push({ elm: currData.element, event: 'blur', func: this.handleNextOnFocusOut.bind(this) });
      }
    }
    if (currData.nextOnValueChange) {
      const parent = this.currentStepData?.element?.parentElement?.parentElement?.parentElement?.getAttribute('datatype');
      const isMultiInputAutoComplete = parent === 'multiSelect';

      const isAutoComplete = this.currentStepData.element.classList.contains('MuiAutocomplete-input');
      const isCheckBox = this.currentStepData.fieldType === 'checkbox';

      if (isMultiInputAutoComplete) {
        // Track multiselect autocomplete via MultiSelectAutoComplete observer
        let validator = (value: string[]) => value.length > 0;
        if (typeof this.currentStepData.nextOnValueChange === 'function') {
          validator = this.currentStepData.nextOnValueChange;
        }
        const observer = new MultiSelectAutoCompleteObserver(this, this.currentStepData.element, validator);
        this.attachedOvservers.push(observer);
      } else if (isAutoComplete) {
        // Track autocomplete via autocomplete observer
        let validator = (value: string) => value.length > 0;
        if (typeof this.currentStepData.nextOnValueChange === 'function') {
          validator = this.currentStepData.nextOnValueChange;
        }
        const observer = new AutocompleteObserver(this, this.currentStepData.element, validator);
        this.attachedOvservers.push(observer);
      } else if (isCheckBox) {
        let validator = (value: boolean) => value === true;
        if (typeof this.currentStepData.nextOnValueChange === 'function') {
          validator = this.currentStepData.nextOnValueChange;
        }
        const observer = new CheckBoxObserver(this, this.currentStepData.element, validator);
        this.attachedOvservers.push(observer);
      } else {
        // Track Text input via observer
        let validator = (value: string) => {
          if (['decimal', 'currencyAmount'].includes(this.currentStepData.fieldType)) {
            return value.length > 0 && Number(value) !== 0;
          }
          return value.length > 0;
        };
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

  removeObservers() {
    this.listenerAttachedElements.map((d) => d.elm.removeEventListener(d.event, d.func));
    this.attachedOvservers.map((d) => d.disconnect());
    this.listenerAttachedElements = [];
    this.attachedOvservers = [];
  }

  checkPreviousObservers() {
    if (this.attachedOvservers.length <= 1) return;
    const invalidObservers = this.attachedOvservers.filter((o) => !o.success);
    if (invalidObservers.length === 0) return;
    if (this.tempIndex > -1) return;
    for (const observer of invalidObservers) {
      if (observer.actualIndex < this.currentIndex) {
        this.tempIndex = this.currentStepData.isHiddenStep ? this.currentIndex - 1 : this.currentIndex;
        this.currentIndex = observer.stepIndex;
        this.tempIndex = -1;
        this.clicked = false;
        this.next(false);
        break;
      }
    }
  }

  start() {
    this.started = true;
    this.next();
  }
  finish() {
    this.reset();
  }
  reset() {
    this.tempIndex = -1;
    this.started = false;
    this.finished = false;
    this.clicked = false;
    this.currentIndex = -1;
    this.handleReset();
    this.removeListeners();
    this.removeObservers();
  }
  next(shouldCheck = true) {
    if (this.currentIndex === this.steps.length - 1) {
      this.reset();
    }
    // // To debounce click only register first click
    // if ((this.clicked || this.waiting) && shouldCheck) return;
    // this.clicked = !shouldCheck;

    if (shouldCheck) {
      this.clicked = true;
      this.currentIndex++;
      if (this.tempIndex > -1) {
        this.currentIndex = this.tempIndex;
        this.tempIndex = -1;
      }
    }
    // if previous step will open dialog then retry to get element position in 500ms to see if there is any layout shift
    if (this.currentIndex > 0) {
      const prevStep = this.steps[this.currentIndex - 1];
      if (prevStep.willOpenDialog) {
        setTimeout(() => {
          this.getCurrentStep(true, this.currentIndex);
        }, 500);
      }
    }
    this.getCurrentStep();
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

    this.getCurrentStep();
  }

  getCurrentStep(dirty = false, index = this.currentIndex) {
    if (!this.steps[index]) return;
    if (this.currentStepData?.index === index && !dirty) return this.currentStepData;
    this.findingElement = true;
    const activeStep = this.steps[index];
    clearInterval(this.interval);
    this.sendUpdateSignal();
    let element = document.querySelector(activeStep.target) as HTMLElement;

    if (!element) {
      this.retry++;
      if (this.retry >= RETRY) {
        clearInterval(this.interval);
        this.message = `Element not found with selector: ${activeStep.target}`;
        this.error = true;

        this.reset();
      }

      this.interval = setInterval(() => {
        this.getCurrentStep();
      }, 1000);
    } else {
      this.retry = 0;
      this.findingElement = false;
      this.clicked = false;
      this.sendUpdateSignal();
      const { bottom, height, left, right, top, width, x, y } = element?.getBoundingClientRect();
      const positionData = { bottom, height, left: left + window.scrollX, right, top: top + window.scrollY, width, x, y };

      this.currentStepData = {
        ...activeStep,
        positionData,
        index: index,
        element
      };

      this.attachObservers();
      this.sendUpdateSignal();
    }
  }

  private initializeStepData(steps: StepDefination[], firstTimeInitialization = true, from = '') {
    if (firstTimeInitialization) {
      this.originalSteps = steps;
    } else {
      this.originalSteps = [...this.originalSteps, ...steps];
    }
    const newSteps: Step[] = [];
    for (let i = 0; i < steps.length; i++) {
      const data = steps[i];
      const normalStep: NormalStep = {
        title: data.title,
        index: i,
        content: data.content,
        target: data.target,
        isHiddenStep: false,
        nextButtonName: data.nextButtonName,
        willOpenDialog: data.willOpenDialog,
        waitForStepInsertion: data.waitForStepInsertion,
        fieldType: data.fieldType,
        isPreviousButtonDisabled: data.isPreviousButtonDisabled
      };
      if (data.skipIfValueExist) {
        normalStep.skipIfValueExist = data.skipIfValueExist;
      }

      if (['nextOnUserClicks', 'nextOnFocusOut', 'nextOnValueChange', 'nextOnKeyPress'].some((d) => d in data) || data.fieldType === 'checkbox') {
        newSteps.push(normalStep);
        newSteps.push({
          ...data,
          index: i,
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
    this.steps.push(...this.initializeStepData(steps, false, 'push'));
    this.checkForRequiredFields.initSteps(this.steps);
  }
  insert(steps: StepDefination[], index: number) {
    if (!steps || steps.length === 0 || !index) return;
    this.originalSteps.splice(index, 0, ...steps);
    this.steps = this.initializeStepData(this.originalSteps, false, 'insert');
    this.checkForRequiredFields.initSteps(this.steps);
  }
  insertAtCurrentIndex(steps: StepDefination[]) {
    if (!steps || steps.length === 0) return;
    this.steps.splice(this.currentIndex + 1, 0, ...this.initializeStepData(steps, false, 'insertAtCurrentIndex'));
    this.checkForRequiredFields.initSteps(this.steps);
  }
  pop() {
    this.steps.pop();
  }
  shift() {
    this.steps.shift();
  }
  unshift(steps: StepDefination[]) {
    this.steps.unshift(...this.initializeStepData(steps, false, 'unshift'));
    this.checkForRequiredFields.initSteps(this.steps);
  }
  splice(start: number, deleteCount: number, steps: StepDefination[]) {
    this.steps.splice(start, deleteCount, ...this.initializeStepData(steps, false, 'splice'));
    this.checkForRequiredFields.initSteps(this.steps);
  }
  sort(compareFn?: (a: Step, b: Step) => number) {
    this.steps.sort(compareFn);
  }
  remove(index: number) {
    this.originalSteps.splice(index, 1);
    this.steps = this.initializeStepData(this.originalSteps, false, 'remove');
    this.checkForRequiredFields.initSteps(this.steps);
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
