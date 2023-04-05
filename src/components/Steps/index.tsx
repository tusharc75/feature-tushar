import React, { useEffect, useRef } from 'react';
import styles from './steps.module.scss';
import MobileSteps from './MobileSteps';
import { isMobile } from 'react-device-detect';
import { Button, IconButton, Box, Typography } from '@material-ui/core';
import HtmlTooltip from '../../components/CustomTooltipTitle';
import { AiOutlineLeft, AiOutlineRight } from 'react-icons/ai';
import { FiMaximize2 } from 'react-icons/fi';
import { LeftIcon, RightIcon, getIcon, stepIconInterface, getColorOficon } from './icons';

const STEP_GAP = 15;

const Steps = ({
  nextStep,
  isNextStep,
  steps,
  currentStep,
  setCurrentStep,
  isStepEnded,
  setStepFullScreen = null,
  updateStatus = null,
  isPrevStep = true,
  handleNext = null,
  handlePrev = null,
  className = '',
  ...others
}) => {
  let activeStep = currentStep;
  const containerRef = useRef(null);

  const goNext = () => {
    if (handleNext) {
      handleNext();
      return;
    }
    setCurrentStep((prevStep) => {
      const newStep = prevStep + 1;
      if (updateStatus) {
        updateStatus(newStep);
      }
      return newStep;
    });
  };

  const goPrev = () => {
    if (handlePrev) {
      handlePrev();
      return;
    }
    setCurrentStep((prevStep) => {
      const newStep = prevStep - 1;
      if (updateStatus) {
        updateStatus(newStep);
      }
      return newStep;
    });
  };

  useEffect(() => {
    handleScroll();
  }, [activeStep]);

  const handleScroll = () => {
    if (containerRef.current) {
      const container = containerRef.current;
      const element = container.querySelector('div.single-step-item');
      if (element) {
        const scrollpos = activeStep * (element?.clientWidth + STEP_GAP);
        container.scroll({
          top: 0,
          left: scrollpos,
          behavior: 'smooth'
        });
      }
    }
  };

  return (
    <div>
      {isMobile ? (
        <MobileSteps
          stepName={`${activeStep + 1}/${steps.length} ${steps[currentStep] ? steps[currentStep] : ''}`}
          nextButton={
            <Button
              size="small"
              variant="text"
              color="primary"
              disabled={currentStep === steps.length - 1 || (currentStep === 0 && isNextStep) || !nextStep}
              endIcon={<AiOutlineRight />}
              className="ml-1 MobileStep-next-back-button"
              onClick={goNext}
            >
              {'Next'}
            </Button>
          }
          backButton={
            <Button
              size="small"
              variant="text"
              color={'primary'}
              startIcon={<AiOutlineLeft />}
              disabled={currentStep === steps.length || currentStep === 0 || isStepEnded || !isPrevStep}
              className={`mr-1 MobileStep-next-back-button `}
              onClick={goPrev}
            >
              {'Back'}
            </Button>
          }
        />
      ) : (
        <Box {...others} className={`${className} ${styles.gradient}`}>
          <Box className={styles.mainContainer}>
            <Box className={styles.iconButton}>
              <IconButton disabled={currentStep === steps.length || currentStep === 0 || isStepEnded || !isPrevStep} onClick={goPrev}>
                <LeftIcon />
              </IconButton>
            </Box>
            <div className={styles.contentContainer} ref={containerRef}>
              {steps.map((step, i) => {
                const Icon = getIcon(step.icon);
                return (
                  <Box
                    className={`
                    ${styles.singleStep} 
                    ${i < currentStep || isStepEnded ? styles.activeSteps : ''}
                    ${i === currentStep ? styles.currentStep : ''}
                    ${i > currentStep ? styles.inActiveStep : ''}
                    single-step-item
                `}
                    key={step.name}
                  >
                    <Box className={styles.stepIcon}>
                      <Icon colors={i > currentStep ? null : getColorOficon(i) || ['#FAC94B', '#FF9B04']} />
                    </Box>
                    <Typography className={styles.label}>{step.title}</Typography>
                    {!isStepEnded && setStepFullScreen && currentStep === i && (
                      <HtmlTooltip title={`Full Screen`}>
                        <Box className={styles.fullScrceen}>
                          <IconButton aria-label="Full Screen" onClick={setStepFullScreen} size="small">
                            <FiMaximize2 />
                          </IconButton>
                        </Box>
                      </HtmlTooltip>
                    )}
                  </Box>
                );
              })}
            </div>
            <Box className={styles.iconButton}>
              <IconButton disabled={currentStep === steps.length - 1 || (currentStep === 0 && isNextStep) || !nextStep} onClick={goNext}>
                <RightIcon />
              </IconButton>
            </Box>
          </Box>
        </Box>
      )}
    </div>
  );
};

export default Steps;

interface stepInterface extends stepIconInterface {
  name: string;
  title: string;
}

export const getIndex = (name: string, steps: stepInterface[]) => {
  if (!name) return 0;
  const index = steps.findIndex((step) => step.name === name);
  return index === -1 ? 0 : index;
};

export const doesStepsContainStep = (name: string, steps: stepInterface[]) => {
  const names = steps.map((step) => step.name);
  return name.includes(name);
};
