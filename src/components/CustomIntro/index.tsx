import { IconButton, Popper } from '@material-ui/core';
import { Close } from '@material-ui/icons';
import { ReactNode, useRef, useState } from 'react';
import { FaCaretUp } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';
import { cn } from 'src/constants/helpers';

import React, { useEffect } from 'react';
import { FaArrowLeft, FaArrowRight, FaQuestion } from 'react-icons/fa';
import { GiFinishLine } from 'react-icons/gi';
import { HandleSteps } from 'src/components/CustomIntro/HandleStep';
import { getCurrentUrl } from 'src/components/CustomIntro/IntorCreator/helper';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { stepData } from 'src/components/CustomIntro/data';

export type IntroStep = {
  [key: string]: {
    name: string;
    steps: Step[];
  };
};

export type Step = {
  title: ReactNode;
  content: ReactNode;
  target: string;
  url: string;
  waitForUserClick: boolean;
};

const CustomIntro = () => {
  const location = useLocation();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, setUpdateSignal] = useState<number>(0);
  const [tutorialPresent, setTutorialPresent] = useState<string>(null);
  let handleSteps = useRef<HandleSteps | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const arrowRef = useRef(null);

  const handlePopoverClose = () => {
    handleSteps.current?.reset();
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  useEffect(() => {
    console.log('hello');
    if (!stepData) return () => handleSteps?.current?.removeListeners();
    const currentUrl = getCurrentUrl();
    if (stepData[currentUrl] && !handleSteps.current) {
      setTutorialPresent(currentUrl);
      handleSteps.current = new HandleSteps({
        steps: stepData[currentUrl].steps,
        setUpdateSignal: setUpdateSignal
      });
    } else if (!handleSteps.current?.started) {
      setTutorialPresent(null);
      return () => {
        handleSteps?.current?.removeListeners();
        handleSteps.current = null;
      };
    }

    return () => handleSteps.current?.removeListeners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const handleFinish = () => {
    setTutorialPresent(null);
    handleSteps.current?.finish();
    handleSteps?.current?.removeListeners();
    handleSteps.current = null;
  };

  const currentStepData = handleSteps.current?.currentStepData;
  const isLastStep = handleSteps.current?.isLastStep();
  const isFirstStep = handleSteps.current?.isFirstStep();
  const isWaiting = handleSteps.current?.waitingForUser;

  console.log(currentStepData, handleSteps.current);

  if (handleSteps.current?.error) return null;

  return (
    <>
      <div
        className={cn('floating-card fixed bottom-2 right-3 z-[1300]', tutorialPresent && !handleSteps.current?.started ? 'not-sr-only' : 'sr-only')}
      >
        <button
          onClick={() => {
            handleSteps.current?.start();
          }}
          type="button"
          className="group relative flex size-10 cursor-pointer items-center justify-center rounded-full bg-[white] text-gray-900 transition-all duration-300 [border:1px_solid_var(--common-border-color)] hover:size-14 dark:bg-[var(--dark-primary)] dark:text-gray-200"
        >
          <span className="sr-only">Walk me</span>
          <span className="absolute  inset-0 z-[-1] inline-flex size-10  animate-ping rounded-full bg-sky-400 opacity-75 group-hover:size-14"></span>
          <HtmlTooltip title={'Walk me'}>
            <FaQuestion className=" block size-5 text-gray-600 transition-all duration-300 group-hover:size-7 dark:text-gray-200" />
          </HtmlTooltip>
        </button>
      </div>

      {handleSteps.current?.started && currentStepData && !isWaiting && (
        <div className="">
          <div
            className="backdrop absolute inset-0 z-[1301] bg-black/50 mix-blend-hard-light"
            style={{ height: handleSteps.current?.documentHeight }}
          >
            {currentStepData.element && (
              <div
                ref={(ref) => setAnchorEl(ref)}
                className="item pointer-events-auto absolute cursor-pointer rounded-md bg-blend-lighten"
                onClick={() => {
                  currentStepData?.element.click();
                  handleSteps.current?.next();
                }}
                style={{
                  width: currentStepData?.positionData?.width + 10,
                  height: currentStepData?.positionData?.height + 10,
                  top: currentStepData?.positionData?.top - 5,
                  left: currentStepData?.positionData?.left - 5,
                  background: 'gray'
                }}
              ></div>
            )}
          </div>
          <Popper
            open={open}
            anchorEl={anchorEl}
            modifiers={[
              {
                name: 'arrow',
                enabled: true,
                options: {
                  element: arrowRef
                }
              }
            ]}
          >
            <div className="relative z-[1302] mt-3 min-w-[300px] max-w-[300px] rounded-md bg-[var(--dark-secondary,white)] p-2 shadow-md">
              <div className="mb-2 flex items-center justify-between gap-2 pb-1 [border-bottom:1px_solid_var(--common-border-color)]">
                <p className=" truncate text-[16px] font-semibold ">{currentStepData.title}</p>
                <IconButton size="small" onClick={handlePopoverClose}>
                  <Close />
                </IconButton>
              </div>
              <div className="p-2 text-gray-600 dark:text-gray-300">{currentStepData.content}</div>
              <div className="footer flex justify-between gap-2 pt-2 [border-top:1px_solid_var(--common-border-color)]">
                {!isFirstStep ? (
                  <ThemeButton
                    color="secondary"
                    iconForMobile={false}
                    onClick={() => handleSteps.current?.previous()}
                    startIcon={<FaArrowLeft size={16} />}
                  >
                    Prev
                  </ThemeButton>
                ) : (
                  <span></span>
                )}
                {!isLastStep ? (
                  <ThemeButton
                    borderColor="none"
                    color="primary"
                    iconForMobile={false}
                    onClick={() => {
                      handleSteps.current?.next();
                      currentStepData.element.click();
                    }}
                    endIcon={<FaArrowRight size={16} />}
                  >
                    Next
                  </ThemeButton>
                ) : (
                  <ThemeButton
                    borderColor="none"
                    color="primary"
                    iconForMobile={false}
                    onClick={() => handleFinish()}
                    endIcon={<GiFinishLine size={16} />}
                  >
                    Finish
                  </ThemeButton>
                )}
              </div>
            </div>
          </Popper>
          {/* <span ref={arrowRef} className="absolute text-[var(--dark-secondary,white)]  drop-shadow-md " style={{ ...arrowPosition }}>
            <FaCaretUp size={30} />
          </span> */}
        </div>
      )}
    </>
  );
};

export default CustomIntro;

type CustomIntroWrapperProps = {
  title: ReactNode;
  content: ReactNode;
  disabled?: boolean;
  children: ReactNode;
};

export const CustomIntroWrapper = ({ title, content, disabled, children, ...rest }: CustomIntroWrapperProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const arrowRef = useRef(null);

  const handlePopoverOpen = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  return (
    <span className="relative">
      {children}
      {!disabled && (
        <button
          type="button"
          onClick={handlePopoverOpen}
          className={cn(
            'absolute right-0 top-0 z-[2] !-mr-[5px] flex size-3 cursor-help items-center justify-center rounded-full border-0 bg-[var(--new-theme-color)] focus-within:border-0 focus-within:outline-none',
            open && 'opacity-0'
          )}
        >
          <span className="h-3 w-3 animate-ping rounded-full bg-[var(--new-theme-color)] opacity-75"></span>
          <span className=" sr-only">more info</span>
        </button>
      )}

      <Popper
        open={open}
        anchorEl={anchorEl}
        modifiers={[
          {
            name: 'arrow',
            enabled: true,
            options: {
              element: arrowRef
            }
          }
        ]}
      >
        <div className="relative mt-3 min-w-[200px] max-w-[300px] rounded-md bg-[var(--dark-secondary,white)] p-2 shadow-md">
          <div className="mb-2 flex items-center justify-between gap-2 pb-1 [border-bottom:1px_solid_var(--common-border-color)]">
            <p className=" truncate text-[16px] font-semibold ">{title}</p>
            <IconButton size="small" onClick={handlePopoverClose}>
              <Close />
            </IconButton>
          </div>
          <div className="p-1 text-gray-600 dark:text-gray-300">{content}</div>
          <span
            ref={arrowRef}
            className="absolute left-1/2 top-[-20px] text-[var(--dark-secondary,white)]  drop-shadow-md [transform:translateX(-50%)]"
          >
            <FaCaretUp size={30} />
          </span>
        </div>
      </Popper>
    </span>
  );
};
