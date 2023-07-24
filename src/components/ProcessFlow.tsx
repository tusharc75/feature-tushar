import React, { useState, useEffect } from 'react';
import Steps from 'src/components/Steps';

import { stepIconInterface, StepIconType } from 'src/components/Steps/icons';
interface StepInterface extends stepIconInterface {
  text: string;
  canCompleteManually: boolean;
  name: string;
  title: string;
}

interface InputStepInterface {
  text: string;
  canCompleteManually: boolean;
}

const getStepData = (steps: InputStepInterface[]): StepInterface[] => {
  const data = steps?.map((item) => ({
    text: item.text,
    canCompleteManually: item.canCompleteManually,
    name: item.text,
    title: item.text,
    icon: getIcon(item.text)
  }));
  return data;
};

const getIcon = (name: string): StepIconType => {
  switch (true) {
    case name === 'New':
      return 'add';
    case name === 'Prospecting':
      return 'prospecting';
    case name === 'Proposal':
      return 'proposal';
    case name === 'Negotiating':
      return 'negotiating';
    case name === 'Closed':
      return 'closed';
    case name === 'Unqualified':
      return 'unqualified';
    case name === 'Qualified':
      return 'qualified';
    default:
      return 'add';
  }
};

export default function ProcessFlow(props) {
  const { steps, activeStep, isProcessing, handleMarkAsCompleted, hideBackButton = false, disableBackNext = false } = props;
  const [stateSteps, setStateSteps] = useState(getStepData(steps));

  useEffect(() => {
    setStateSteps(getStepData(steps));
  }, [steps]);

  const [currentStep, setCurrentStep] = useState(activeStep);

  useEffect(() => {
    setCurrentStep(activeStep + 1);
  }, [activeStep]);

  const handleNext = () => {
    handleMarkAsCompleted();
  };
  const handleBack = () => {
    handleMarkAsCompleted({ isSetBackStep: true });
  };

  return (
    <>
      <div className="my-4">
        <Steps
          currentStep={currentStep}
          isNextStep={steps[activeStep + 1]?.canCompleteManually || isProcessing ? false : true || !disableBackNext}
          isPrevStep={activeStep === 0 ? false : true || !disableBackNext}
          isStepEnded={currentStep === steps.length + 1}
          nextStep={steps[activeStep + 1]?.text}
          setCurrentStep={setCurrentStep}
          steps={stateSteps}
          showExtraStep={true}
          handleNext={handleNext}
          handlePrev={handleBack}
        />
      </div>
    </>
  );
}
