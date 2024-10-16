import { Step } from 'src/components/CustomIntro';
import { HandleSteps } from 'src/components/CustomIntro/HandleStep';

type StepData = Step & { stepIndex: number };
type CheckForRequiredFieldsT = { [key: number]: StepData & { found: boolean } };

export class CheckForRequiredFields {
  handleStep: HandleSteps;
  steps: StepData[];
  checkForRequiredFields: CheckForRequiredFieldsT;
  constructor(handleStep: HandleSteps) {
    this.handleStep = handleStep;
    this.steps = this.initSteps(handleStep.steps);
  }
  initSteps(steps: Step[]) {
    this.steps = steps.map((step, index) => {
      const newData = { ...step, stepIndex: index };
      return newData;
    });
    return this.steps;
  }
  update() {
    const checkForRequiredFields = this.steps.filter((step) => step.checkForRequired);
    if (checkForRequiredFields.length === 0) return;
    const allStepData: CheckForRequiredFieldsT = {};
    for (let i = 0; i < checkForRequiredFields.length; i++) {
      const step = checkForRequiredFields[i];
      const isElementFound = document.querySelector(step.target);
      if (isElementFound) {
        allStepData[step.stepIndex] = { ...step, found: true };
      } else {
        allStepData[step.stepIndex] = { ...step, found: false };
      }
    }
    this.checkForRequiredFields = allStepData;
  }
  render() {
    if (this?.checkForRequiredFields?.[this.handleStep.currentIndex + 1] && !this.checkForRequiredFields[this.handleStep.currentIndex + 1].found) {
      this.handleStep.currentIndex += 2;
    }
  }
}
