import React, { useEffect, useRef } from 'react';
import styles from './steps.module.scss';
import MobileSteps from './MobileSteps';
import { isMobile, isTablet } from 'react-device-detect';
import { Button, IconButton, Box, Typography } from '@material-ui/core';
import HtmlTooltip from '../../components/CustomTooltipTitle';
import { AiOutlineLeft, AiOutlineRight } from 'react-icons/ai';
import { FiMaximize2 } from 'react-icons/fi';
import { LeftIcon, RightIcon, getIcon, stepIconInterface, getColorOficon, StepCompleteIcon } from './icons';

const STEP_GAP = 15;

const Steps = ({
  nextStep,
  isNextStep = false,
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
  showExtraStep = false,
  nextStepToolTip = null,
  prevStepToolTip = null,
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

  const goToPrevStepAtIndex = (index: number) => {
    setCurrentStep(() => {
      const newStep = index;
      if (updateStatus) {
        updateStatus(newStep);
      }
      return newStep;
    });
  };

  useEffect(() => {
    handleScroll();
  }, [activeStep]);

  // for mobile view, add class to body to compenset for mobile stepper floating height
  useEffect(() => {
    if (isMobile && !isTablet) {
      document.body.classList.add('has-mobile-step');
      return () => {
        document.body.classList.remove('has-mobile-step');
      };
    } else {
      return () => {};
    }
  }, [isMobile && !isTablet]);

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

  const isNextButtonDisabled = React.useMemo(() => {
    if (showExtraStep) return currentStep === steps.length || !nextStep;
    return currentStep === steps.length - 1 || (currentStep === 0 && isNextStep) || !nextStep;
  }, [currentStep, steps.length, showExtraStep, nextStep, isNextStep]);

  return (
    <div>
      {isMobile && !isTablet ? (
        <MobileSteps
          id={steps[currentStep]?.title ? steps[currentStep]?.title : ''}
          stepName={`${
            activeStep + 1 > steps.length || isStepEnded
              ? 'Completed'
              : `${activeStep + 1}/${steps.length} ${steps[currentStep]?.title ? steps[currentStep]?.title : ''}`
          }`}
          nextButton={
            <Button
              size="small"
              variant="text"
              color="primary"
              disabled={isNextButtonDisabled}
              endIcon={<AiOutlineRight />}
              className="MobileStep-next-back-button ml-1"
              id="step-next-button"
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
              id="step-previous-button"
              startIcon={<AiOutlineLeft />}
              disabled={currentStep === steps.length || currentStep === 0 || isStepEnded || !isPrevStep}
              className={`MobileStep-next-back-button mr-1 `}
              onClick={goPrev}
            >
              {'Back'}
            </Button>
          }
        />
      ) : (
        <Box {...others} className={`${className} ${styles.gradient}`}>
          <Box className={styles.mainContainer}>
            {isStepEnded || (
              <Box className={styles.iconButton}>
                <HtmlTooltip title={prevStepToolTip || ''}>
                  <span>
                    <IconButton
                      id="step-previous-button"
                      style={{ opacity: currentStep === 0 && '0' }}
                      disabled={currentStep === steps.length || currentStep === 0 || isStepEnded || !isPrevStep}
                      onClick={goPrev}
                    >
                      <LeftIcon />
                    </IconButton>
                  </span>
                </HtmlTooltip>
              </Box>
            )}
            <div
              className={styles.contentContainer}
              style={
                {
                  '--flex-basis': isStepEnded ? '100%' : 'calc(100% - calc(calc(var(--icon-size) + var(--left-right-icon-spacing, 15px)) * 2))',
                  marginLeft: isStepEnded ? '8px' : 'unset',
                  padding: '9px 8px 0 0'
                } as React.CSSProperties
              }
              ref={containerRef}
            >
              {steps.map((step, i) => {
                const Icon = getIcon(step.icon);
                return (
                  <div
                    className={`
                    ${styles.singleStep} 
                    ${i < currentStep || isStepEnded ? styles.activeSteps : ''}
                    ${i === currentStep && !isStepEnded ? styles.currentStep : ''}
                    ${i > currentStep && !isStepEnded ? styles.inActiveStep : ''}
                    single-step-item transition-[shadow]
                    ${i < currentStep && !isStepEnded && isPrevStep ? 'cursor-pointer hover:shadow hover:[border:2px_solid_#f99336]' : ''}
                    
                `}
                    style={{ '--line-color': i < currentStep ? 'var(--new_theme_color)' : 'unset' } as React.CSSProperties}
                    key={step.name}
                    id={step.name}
                    aria-disabled={i > currentStep && !isStepEnded}
                    onClick={() => {
                      if (i < currentStep && !isStepEnded && isPrevStep) {
                        goToPrevStepAtIndex(i);
                      }
                    }}
                  >
                    {(isStepEnded || i < currentStep) && (
                      <Box className={styles.stepCompleteIcon}>
                        <StepCompleteIcon />
                      </Box>
                    )}

                    <Box
                      className={styles.stepIcon}
                      style={
                        {
                          '--icon-color': i > currentStep && !isStepEnded ? null : getColorOficon(i) || ['#FAC94B', '#FF9B04']
                        } as React.CSSProperties
                      }
                    >
                      <Icon colors={['#fff', '#ffff']} style={{ color: '#fff' }} />
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
                  </div>
                );
              })}
            </div>
            {!isStepEnded && (
              <Box className={styles.iconButton}>
                <HtmlTooltip title={nextStepToolTip || ''}>
                  <span>
                    <IconButton
                      id="step-next-button"
                      style={{ opacity: showExtraStep ? currentStep - 1 === steps.length && '0' : currentStep === steps.length - 1 && '0' }}
                      disabled={isNextButtonDisabled}
                      onClick={goNext}
                    >
                      <RightIcon />
                    </IconButton>
                  </span>
                </HtmlTooltip>
              </Box>
            )}
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
