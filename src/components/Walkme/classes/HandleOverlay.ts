import { HandleSteps } from 'src/components/Walkme/classes';
import { CheckInputs } from 'src/components/Walkme/classes/CheckInputs';
import { StepWithAllData } from 'src/components/Walkme/types';

const getTotalHeight = () => Math.max(document.body.scrollHeight, document.body.offsetHeight);

const backdropStyles: React.CSSProperties = {
  position: 'absolute',
  left: '0px',
  right: '0px',
  top: '0px',
  height: `0px`,
  zIndex: '1301',
  background: 'rgba(0,0,0,0.5)',
  mixBlendMode: 'hard-light'
};

const windowStyles: React.CSSProperties = {
  backgroundBlendMode: 'lighten',
  background: 'gray',
  pointerEvents: 'auto',
  cursor: 'pointer',
  borderRadius: '2px',
  backgroundColor: 'gray',
  position: 'absolute'
};

export class HandleOverlay {
  handleSteps: HandleSteps;
  backdrop = document.createElement('div');
  window = document.createElement('div');
  currentIndex = -1;
  targetElement: HTMLElement = null;
  checkInputs: CheckInputs;
  scrollToItem: boolean[] = [];
  constructor(handleSteps: HandleSteps) {
    this.handleSteps = handleSteps;
    this.createOverlay();
    this.window.onclick = () => this.handleClick();
    this.checkInputs = new CheckInputs(() => handleSteps.next());
  }

  private createOverlay() {
    this.window.classList.add('bg-blend-lighten');
    Object.assign(this.window.style, windowStyles);
    Object.assign(this.backdrop.style, backdropStyles);
    this.backdrop.appendChild(this.window);
  }

  async handleClick() {
    (this.targetElement as HTMLElement).click();
    if (!this.targetElement) return;
    let passed = false;
    if (this.checkInputs.passedFailedIndexes[this.handleSteps.index] === undefined && this.targetElement) {
      passed = await this.checkInputs.check(this.handleSteps.currentStepData, this.targetElement, this.handleSteps.index);
    }
    return passed;
  }

  start() {
    document.body.appendChild(this.backdrop);
    this.window.style.display = 'block';
    requestAnimationFrame(() => {
      this.updateWindow(); // apply positioning styles after layout
    });
  }
  pause() {
    this.handleSteps.currentStepData = null;
    this.handleSteps.setCurrentStepData(null);
  }
  stop() {
    this.currentIndex = -1;
    this.handleSteps.currentStepData = null;
    this.handleSteps.setCurrentStepData(null);
    if (document.body.contains(this.backdrop)) {
      document.body.removeChild(this.backdrop);
    }
  }
  update() {
    this.getCurrentStepData();
    this.updateWindow();
    this.sendUpdateSignal();
  }

  showHideOverlay() {
    if (this.checkInputs.passedFailedIndexes[this.handleSteps.index] === false) {
      this.backdrop.style.display = 'none';
      this.window.style.display = 'none';
    } else {
      this.backdrop.style.display = 'block';
    }
  }

  private sendUpdateSignal() {
    const failed = this.checkInputs.passedFailedIndexes[this.handleSteps.index] === false;
    if (this.targetElement) {
      this.handleSteps.setCurrentStepData({ ...this.handleSteps.currentStepData, target: failed ? null : (this.targetElement as HTMLElement) });
    } else {
      this.handleSteps.setCurrentStepData({ ...this.handleSteps.currentStepData, target: null });
    }
    this.showHideOverlay();
  }

  private getCurrentStepData() {
    const currentStep = this.handleSteps.steps[this.handleSteps.index];
    if (!currentStep) return;
    if (this.currentIndex === this.handleSteps.index) return;
    const currentStepData: StepWithAllData = {
      ...currentStep,
      target: this.window
    };
    this.currentIndex = this.handleSteps.index;
    this.handleSteps.currentStepData = currentStepData;
  }

  private updateWindow() {
    const totalHeight = getTotalHeight();
    this.backdrop.style.height = `${totalHeight}px`;
    const stepData = this.handleSteps.currentStepData;

    if (!stepData?.targetSelector) {
      this.window.style.display = 'none';
      this.targetElement = null;
      return;
    }
    const selector = stepData?.targetSelector;
    const targetElement = selector ? document.body.querySelector(selector) : null;

    if (targetElement) {
      if (!this.scrollToItem[this.handleSteps.index]) {
        this.scrollToElement(targetElement as HTMLElement);
        this.scrollToItem[this.handleSteps.index] = true;
      }
      this.targetElement = targetElement as HTMLElement;
      const rect = targetElement.getBoundingClientRect();
      const computedStyles = window.getComputedStyle(targetElement);
      const borderRadius = computedStyles.getPropertyValue('border-radius');
      const positionStyles: React.CSSProperties = {
        top: `${rect.top + window.scrollY - 1}px`,
        left: `${rect.left + window.scrollX - 1}px`,
        width: `${rect.width + 2}px`,
        height: `${rect.height + 2}px`,
        borderRadius,
        display: 'block'
      };
      Object.assign(this.window.style, positionStyles);
    } else {
      this.window.style.display = 'none';
      this.targetElement = null;
    }
  }

  private scrollToElement(element: HTMLElement | null, options: ScrollIntoViewOptions = { behavior: 'smooth', block: 'center' }): void {
    if (!element) {
      console.warn('scrollToElement: target is null or undefined');
      return;
    }
    const rect = element.getBoundingClientRect();
    const isVisible = rect.width > 0 && rect.height > 0;
    if (!isVisible) {
      console.warn('scrollToElement: element is not visible');
      return;
    }
    element.scrollIntoView(options);
  }
}
