import { ArrowDropUp, Close } from '@mui/icons-material';
import { Dialog, IconButton, Popper, TextField, useMediaQuery } from '@mui/material';
import { KeyboardEvent, ReactNode, useRef, useState } from 'react';
import { cn, CustomDialogTransition } from 'src/constants/helpers';

import React, { useEffect } from 'react';
import { FaArrowLeft, FaArrowRight, FaQuestion } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';
import { HandleSteps } from 'src/components/CustomIntro/HandleStep';
import { getCurrentUrl } from 'src/components/CustomIntro/helper';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { AI_AGENT } from 'src/config';
import { useStore, WALK_ME_INSTANCE, WALK_ME_STEPS } from 'src/StateProvider/fastContext';
export * from 'src/components/CustomIntro/CustomIntroWrapper';
export * from 'src/components/CustomIntro/helper';
export * from 'src/components/CustomIntro/useSetWalkmeSteps';

export type StateWalkmeInstance = {
  name: string;
  type?: 'flow' | 'normal' | undefined;
  instance: HandleSteps;
  handleNext: () => void;
};

export type WalkmeData = {
  name: string;
  type?: 'flow' | 'normal' | undefined;
  steps: StepDefination[];
  url: string;
};

export type Step = NormalStep | HiddenStep;

export type StepDefination = {
  title: ReactNode;
  content?: ReactNode;
  target: string;
  nextOnUserClicks?: number;
  nextOnFocusOut?: boolean;
  formFields?: boolean;
  nextOnValueChange?: boolean | ((value: string | string[] | boolean) => boolean);
  nextOnKeyPress?: (e: KeyboardEvent) => boolean;
  skipIfValueExist?: boolean;
  nextButtonName?: string;
  waitForEnable?: boolean;
  willOpenDialog?: boolean;
  waitForStepInsertion?: boolean;
  fieldType?: 'checkbox' | string;
  checkForRequired?: boolean;
  isPreviousButtonDisabled?: boolean;
};

export type NormalStep = {
  title: ReactNode;
  content?: ReactNode;
  target: string;
  isHiddenStep: false;
  skipIfValueExist?: boolean;
  nextButtonName?: string;
  waitForEnable?: boolean;
  willOpenDialog?: boolean;
  waitForStepInsertion?: boolean;
  fieldType?: string;
  index: number;
  checkForRequired?: boolean;
  isPreviousButtonDisabled?: boolean;
};
export type HiddenStep = {
  target: string;
  isHiddenStep: true;
  nextOnUserClicks?: number;
  nextOnFocusOut?: boolean;
  nextOnValueChange?: boolean | ((value: string | string[] | boolean) => boolean);
  nextOnKeyPress?: (e: KeyboardEvent) => boolean;
  skipIfValueExist?: boolean;
  nextButtonName?: string;
  waitForEnable?: boolean;
  willOpenDialog?: boolean;
  waitForStepInsertion?: boolean;
  fieldType?: string;
  index: number;
  checkForRequired?: boolean;
  isPreviousButtonDisabled?: boolean;
};

let timeout: NodeJS.Timeout;

const CustomIntro = () => {
  const [selectedIntro, setSelectedIntro] = useState<WalkmeData | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_s, setWalkMeInstance] = useStore((store) => store[WALK_ME_INSTANCE]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, setUpdateSignal] = useState<number>(0);
  let handleSteps = useRef<HandleSteps | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const [arrowRef, setArrowRef] = React.useState(null);

  const open = Boolean(anchorEl);

  const handleReset = () => {
    if (isWaiting) return;
    handleSteps?.current?.removeListeners();
    handleSteps?.current?.removeObservers();
    setAnchorEl(null);
    handleSteps.current = null;
    setSelectedIntro(null);
    setWalkMeInstance({ [WALK_ME_INSTANCE]: null });
  };

  const handleNext = (checkForStepInsertion = true) => {
    clearTimeout(timeout);
    if (checkForStepInsertion) {
      if (currentStepData?.element.tagName === 'IFRAME') {
        const frame = currentStepData?.element as HTMLIFrameElement;
        frame.contentDocument.body.focus();
        frame.contentDocument.body.click();
      } else if (currentStepData.fieldType !== 'checkbox') {
        currentStepData?.element.click();
      }
      if (currentStepData?.waitForStepInsertion) {
        handleSteps.current?.pause();
        return;
      }
    } else {
      handleSteps.current.resume();
    }

    if (currentStepData?.willOpenDialog || currentStepData?.waitForStepInsertion) {
      // check if dialog will open then wait for 500ms to let dialog open properly
      timeout = setTimeout(() => {
        handleSteps.current?.next();
      }, 500);
    } else {
      // wait for any layout change
      timeout = setTimeout(
        () => {
          handleSteps.current?.next();
        },
        checkForStepInsertion ? 100 : 500
      );
    }
  };

  const handleStart = (intro: WalkmeData) => {
    // const currentUrl = getCurrentUrl();
    setSelectedIntro(intro);
    handleSteps.current = new HandleSteps({
      steps: intro.steps,
      setUpdateSignal: setUpdateSignal,
      onReset: handleReset
    });
    setWalkMeInstance({
      [WALK_ME_INSTANCE]: {
        name: intro.name,
        instance: handleSteps.current,
        type: intro.type,
        handleNext: () => handleNext(false)
      }
    });

    handleSteps.current?.start();
  };

  const currentStepData = handleSteps?.current?.currentStepData as {
    positionData: DOMRect;
    element: HTMLElement;
    index: number;
  } & NormalStep;
  const isLastStep = handleSteps?.current?.isLastStep();
  const isFirstStep = handleSteps?.current?.isFirstStep();
  const isWaiting = handleSteps?.current?.waiting;
  const isFindingElement = handleSteps?.current?.findingElement || isWaiting;
  const isHiddenStep = currentStepData?.isHiddenStep;

  if (handleSteps?.current?.error || !handleSteps || isHiddenStep) return null;

  return (
    <>
      {!selectedIntro && <SelectIntro handleStart={handleStart} />}
      {handleSteps.current?.started && currentStepData && !isHiddenStep && (
        <div className="">
          <div
            className={'backdrop absolute left-0 right-0 top-0 z-[1301] bg-black/50 mix-blend-hard-light'}
            style={{ height: handleSteps.current?.documentHeight, minHeight: '100vh' }}
          >
            {currentStepData?.element && !isFindingElement && (
              <div
                ref={(ref) => setAnchorEl(ref)}
                className="item pointer-events-auto absolute cursor-pointer rounded-md bg-[gray] bg-blend-lighten"
                onClick={() => {
                  handleNext();
                }}
                style={{
                  width: currentStepData?.positionData?.width + 10,
                  height: currentStepData?.positionData?.height + 10,
                  top: currentStepData?.positionData?.top - 5,
                  left: currentStepData?.positionData?.left - 5,
                  backgroundBlendMode: 'lighten',
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
            <span ref={setArrowRef}>
              <ArrowDropUp ref={arrowRef} fontSize="small" className=" text-[--dark-secondary,white]" />
            </span>

            <div className="relative z-[1302] mt-3 min-w-[300px] max-w-[300px] rounded-md bg-[var(--dark-secondary,white)] p-2 shadow-md">
              <div className="mb-2 flex items-center justify-between gap-2 pb-1 [border-bottom:1px_solid_var(--common-border-color)]">
                {currentStepData.title && <p className=" truncate text-[16px] font-semibold ">{currentStepData.title}</p>}
                <IconButton size="small" onClick={handleReset}>
                  <Close />
                </IconButton>
              </div>
              {currentStepData.content && (
                <div className="mb-2 p-2 text-gray-600 [border-bottom:1px_solid_var(--common-border-color)] dark:text-gray-300">
                  {currentStepData.content}
                </div>
              )}
              <div className="footer flex justify-between gap-2 ">
                {!isFirstStep ? (
                  <ThemeButton
                    disabled={isWaiting || currentStepData.isPreviousButtonDisabled}
                    iconForMobile={false}
                    onClick={() => handleSteps.current?.previous()}
                    startIcon={<FaArrowLeft size={16} />}
                  >
                    Prev
                  </ThemeButton>
                ) : (
                  <span></span>
                )}
                {!isLastStep || isWaiting || currentStepData.waitForStepInsertion ? (
                  <ThemeButton
                    buttonType="theme"
                    iconForMobile={false}
                    onClick={() => {
                      handleNext();
                    }}
                    disabled={isWaiting}
                    endIcon={<FaArrowRight size={16} />}
                  >
                    {currentStepData.nextButtonName || 'Next'}
                  </ThemeButton>
                ) : (
                  <ThemeButton
                    buttonType="theme"
                    iconForMobile={false}
                    disabled={isWaiting}
                    onClick={() => {
                      handleNext();
                      handleReset();
                    }}
                  >
                    {currentStepData.nextButtonName || 'Finish'}
                  </ThemeButton>
                )}
              </div>
            </div>
          </Popper>
        </div>
      )}
    </>
  );
};

export default CustomIntro;

const SelectIntro = ({ handleStart }: { handleStart: (intro: WalkmeData) => void }) => {
  const isMobile = useMediaQuery('(max-width:768px)');
  const location = useLocation();
  const [walkMeSteps] = useStore((store) => store[WALK_ME_STEPS]);
  const [stepsForThisPage, setStepsForThisPage] = useState<WalkmeData[]>([]);
  const [filteredSteps, setFilteredSteps] = useState<WalkmeData[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const url = getCurrentUrl();
    const stepsForCurrentPage = walkMeSteps?.filter((d) => url === d?.url);
    setStepsForThisPage(stepsForCurrentPage);
    setFilteredSteps(stepsForCurrentPage);
  }, [walkMeSteps, location]);

  const handleSearch = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    if (value.trim() === '') {
      setFilteredSteps(stepsForThisPage);
    } else {
      setFilteredSteps(() => stepsForThisPage.filter((d) => d.name.toLowerCase().trim().includes(value.toLowerCase())));
    }
  };

  if (stepsForThisPage.length === 0 || isMobile) return null;

  return (
    <>
      <div className={cn('floating-card fixed bottom-2  z-[50]', AI_AGENT ? 'right-[60px]' : 'right-3')}>
        <HtmlTooltip className="block" title={'Walk me'}>
          <button
            type="button"
            className="group relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[white] text-gray-900 transition-all duration-300 [border:1px_solid_var(--common-border-color)] hover:h-14 hover:w-14 dark:bg-[var(--dark-primary)] dark:text-gray-200"
            onClick={() => setOpen(true)}
          >
            <span className="sr-only">Walk me</span>
            {!AI_AGENT && (
              <span className="pointer-events-none absolute inset-0 z-[-1] inline-flex h-10 w-10  animate-ping rounded-full bg-sky-400 opacity-75 group-hover:h-14 group-hover:w-14"></span>
            )}
            <FaQuestion className=" block h-5 w-5 text-gray-600 transition-all duration-300 group-hover:h-7 group-hover:w-7 dark:text-gray-200" />
          </button>
        </HtmlTooltip>
      </div>
      <Dialog
        open={open}
        TransitionComponent={CustomDialogTransition}
        keepMounted
        onClose={() => setOpen(false)}
        aria-labelledby="alert-dialog-slide-title"
        aria-describedby="alert-dialog-slide-description"
        fullWidth
        maxWidth="xs"
        PaperProps={{
          style: { borderRadius: '16px' }
        }}
      >
        <div className="p-[24px]">
          <div className="flex justify-between gap-2 pb-[10px] text-[#2a3042] [border-bottom:1px_solid_var(--common-border-color)] dark:text-[white]">
            <h6 className="  text-[17px] font-bold leading-[1.57] ">Select any topic</h6>
            <IconButton onClick={() => setOpen(false)} size="small">
              <Close />
            </IconButton>
          </div>
          <div className="pb-2 pt-3">
            <TextField
              autoFocus
              label="Search topic..."
              type="search"
              variant="outlined"
              size="small"
              fullWidth
              onChange={handleSearch}
              value={search}
            />
          </div>
          <div className=" mt-4  h-[200px] space-y-3 overflow-y-auto">
            {filteredSteps?.map((intro, index) => (
              <button
                className="flex max-w-fit cursor-pointer items-center gap-2 border-0 bg-transparent text-left font-medium leading-[1.83] text-[#2a3042] shadow-none transition-all hover:gap-3 hover:text-[var(--new-theme-color)] dark:text-[white]"
                key={intro.name}
                onClick={() => {
                  handleStart(intro);
                  setOpen(false);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 13 13" fill="none">
                  <path
                    d="M6.50049 0H13.0005V6.5H12.188V1.39014L0.59082 12.981L0.0195312 12.4097L11.6104 0.8125H6.50049V0Z"
                    fill="currentcolor"
                    stroke="currentcolor"
                  ></path>
                </svg>
                {intro.name}
              </button>
            ))}
          </div>
        </div>
      </Dialog>
    </>
  );
};
