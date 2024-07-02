import { IconButton, Popper } from '@material-ui/core';
import { Close } from '@material-ui/icons';
import { ReactNode, useRef, useState } from 'react';
import { FaCaretUp } from 'react-icons/fa';
import { cn } from 'src/constants/helpers';

import React, { useEffect } from 'react';
import { FaArrowLeft, FaArrowRight, FaQuestion } from 'react-icons/fa';
import { GiFinishLine } from 'react-icons/gi';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { HandleStep } from 'src/components/CustomIntro/HandleStep';

export type Step = {
  title: ReactNode;
  content: ReactNode;
  target?: string | null | HTMLElement;
};

type CustomIntroProps = {
  steps: Step[];
};

const CustomIntro = ({ steps }: CustomIntroProps) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, setUpdateSignal] = useState<number>(0);
  let handleStep = useRef<HandleStep | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const arrowRef = useRef(null);

  const handlePopoverClose = () => {
    handleStep.current?.reset();
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  useEffect(() => {
    handleStep.current = new HandleStep({
      steps,
      setUpdateSignal: setUpdateSignal
    });
    return () => handleStep.current.removeListeners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentStepData = handleStep.current?.getActiveStepData();
  const isLastStep = handleStep.current?.isLastStep();
  const isFirstStep = handleStep.current?.isFirstStep();
  const arrowPosition = handleStep.current?.getArrowPosition();

  // Early return if class is not ready yet.
  if (!handleStep.current?.ready) return null;

  return (
    <>
      <div
        className={cn(
          'floating-card fixed bottom-2 right-3 z-[1300]',
          handleStep.current?.started || !handleStep.current?.ready || !handleStep.current ? 'sr-only' : 'not-sr-only'
        )}
      >
        <button
          onClick={() => {
            handleStep.current?.start();
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

      {handleStep.current?.started && currentStepData && (
        <div className="">
          <div className="backdrop absolute inset-0 z-[1300] bg-black/50 mix-blend-hard-light" style={{ height: handleStep.current?.documentHeight }}>
            <div
              ref={(ref) => setAnchorEl(ref)}
              className="item pointer-events-auto absolute rounded-md bg-blend-lighten"
              style={{
                width: currentStepData.positionData.width + 10,
                height: currentStepData.positionData.height + 10,
                top: currentStepData.positionData.top - 5,
                left: currentStepData.positionData.left - 5,
                background: 'gray'
              }}
            ></div>
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
            <div className="relative z-[1301] mt-3 min-w-[300px] max-w-[300px] rounded-md bg-[var(--dark-secondary,white)] p-2 shadow-md">
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
                    onClick={() => handleStep.current?.prev()}
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
                    onClick={() => handleStep.current?.next()}
                    endIcon={<FaArrowRight size={16} />}
                  >
                    Next
                  </ThemeButton>
                ) : (
                  <ThemeButton
                    borderColor="none"
                    color="primary"
                    iconForMobile={false}
                    onClick={() => handleStep.current?.next()}
                    endIcon={<GiFinishLine size={16} />}
                  >
                    Finish
                  </ThemeButton>
                )}
              </div>
            </div>
          </Popper>
          <span ref={arrowRef} className="absolute text-[var(--dark-secondary,white)]  drop-shadow-md " style={{ ...arrowPosition }}>
            <FaCaretUp size={30} />
          </span>
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
