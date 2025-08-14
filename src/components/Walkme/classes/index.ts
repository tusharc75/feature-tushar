import { HandleOverlay } from 'src/components/Walkme/classes/HandleOverlay';
import { Step, StepWithAllData } from 'src/components/Walkme/types';

export class HandleSteps {
  enable: boolean;
  steps: Step[] = [];
  index: number;
  animationFrame: number;
  currentStepData: StepWithAllData;
  setCurrentStepData: React.Dispatch<React.SetStateAction<StepWithAllData>>;
  handleOverlay: HandleOverlay;
  constructor(setCurrentStepData: React.Dispatch<React.SetStateAction<StepWithAllData>>) {
    this.enable = false;
    this.index = 0;
    this.setCurrentStepData = setCurrentStepData;
    this.handleOverlay = new HandleOverlay(this);
  }
  start(steps: Step[]) {
    if (!steps || steps.length === 0) return;
    this.steps = steps;
    this.enable = true;
    this.animationFrame = requestAnimationFrame(this.animate);
    this.handleOverlay.start();
  }
  async next(shouldClick = false) {
    if (!this.enable) return;
    if (shouldClick) {
      await this.handleOverlay.handleClick();
      return;
    }
    if (this.index < this.steps.length - 1) {
      this.index += 1;
    } else {
      this.stop();
    }
  }

  prev() {
    if (!this.enable) return;
    if (this.index > 0) {
      this.index -= 1;
    }
  }
  pause() {
    this.enable = false;
    window?.cancelAnimationFrame(this.animationFrame);
    this.handleOverlay.pause();
  }
  stop() {
    this.steps = [];
    this.enable = false;
    this.index = 0;
    this.handleOverlay.stop();
    this.setCurrentStepData(null);
    window?.cancelAnimationFrame(this.animationFrame);
  }
  destroy() {
    this.stop();
  }
  private update() {
    this.handleOverlay.update();
  }
  private animate = () => {
    if (!this.enable) return;
    if (this.index < 0 || this.index >= this.steps.length) {
      this.stop();
      return;
    }
    this.update();
    this.animationFrame = requestAnimationFrame(this.animate);
  };
}
