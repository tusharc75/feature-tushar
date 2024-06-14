import { forwardRef, useRef, useState, useImperativeHandle, useEffect } from 'react';
import Joyride, { BeaconRenderProps, CallBackProps, STATUS, Step, StoreHelpers, TooltipRenderProps } from 'react-joyride';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const BeaconComponent = forwardRef<HTMLButtonElement, BeaconRenderProps>((props, ref) => {
  return (
    <button
      className="beacon ralative flex size-12 animate-bounce cursor-pointer items-center justify-center rounded-full border-0 bg-sky-500/70"
      ref={ref}
      {...props}
    >
      {/* <span className="absolute left-0 top-0 h-full w-full animate-ping rounded-full bg-sky-400 opacity-75"></span> */}
    </button>
  );
});

function Tooltip({ backProps, continuous, index, isLastStep, primaryProps, skipProps, step, tooltipProps }: TooltipRenderProps) {
  return (
    <div {...tooltipProps} className=" min-w-[420px] max-w-[420px] overflow-hidden rounded-md bg-[var(--dark-primary,white)]">
      <div>
        {step.title && (
          <h3 className="mb-2 bg-[var(--primary)] p-3 text-center text-[18px] font-semibold text-[var(--primary-text)] text-white dark:bg-[#1a1a26]">
            {step.title}
          </h3>
        )}
        {step.content && <div className="p-2">{step.content}</div>}
      </div>
      <div className="bg-[#ebebeb] p-2 dark:bg-[#1a1a26]">
        <div className=" flex justify-between  gap-2">
          {!isLastStep && (
            <ThemeButton {...skipProps} iconForMobile={false}>
              Skip
            </ThemeButton>
          )}
          <div className="ml-auto flex justify-between gap-2">
            {index > 0 && (
              <ThemeButton {...backProps} iconForMobile={false}>
                Back
              </ThemeButton>
            )}
            <ThemeButton {...primaryProps} iconForMobile={false}>
              {continuous ? 'Next' : 'Close'}
            </ThemeButton>
          </div>
        </div>
      </div>
    </div>
  );
}

const defaultStep = [
  {
    content: 'Change the world, obviously',
    placement: 'top' as const,
    title: 'Add items'
  }
];

type CustomProps = {
  steps: Step[];
  resource: string;
};
type State = {
  complete: boolean;
  run: boolean;
};
export type CustomRef = {
  handleRestart: () => void;
  complete: boolean;
  run: boolean;
};
export type CustomStep = Step[];

const Intro = forwardRef<CustomRef, CustomProps>((props, ref) => {
  const { steps = defaultStep, resource } = props;
  const [localStoraData, setLocalStorageData] = useState({});

  const [{ complete, run: runState }, setState] = useState<State>({ complete: false, run: false });
  const helpers = useRef<StoreHelpers>();

  const setHelpers = (storeHelpers: StoreHelpers) => {
    helpers.current = storeHelpers;
  };

  const handleRestart = () => {
    const { reset } = helpers.current!;
    setState((prev) => ({ ...prev, complete: false }));
    reset(true);
  };

  const getCompleteFromLocalStorage = () => {
    const localStorageData = JSON.parse(localStorage.getItem('introRideComplete')) || {};
    setLocalStorageData(localStorageData);
    setState((prev) => ({ ...prev, run: !localStorageData[resource] }));
  };

  const setCompleteToLocalStorage = (value: { [key: string]: boolean }) => {
    localStorage.setItem('introRideComplete', JSON.stringify(value));
  };

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const options: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (options.includes(status)) {
      setState((prev) => ({ ...prev, complete: true, run: false }));
      setCompleteToLocalStorage({ ...localStoraData, [resource]: true });
    }
  };

  useImperativeHandle(ref, () => {
    return {
      handleRestart,
      complete,
      run: runState
    };
  });

  useEffect(() => {
    getCompleteFromLocalStorage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource]);

  return (
    <>
      <Joyride
        beaconComponent={BeaconComponent}
        callback={handleJoyrideCallback}
        getHelpers={setHelpers}
        // locale={messages}
        disableScrolling
        run={runState}
        scrollToFirstStep
        showSkipButton
        steps={steps}
        styles={{
          options: {
            zIndex: 2000000
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)'
          }
        }}
        tooltipComponent={Tooltip}
      />
    </>
  );
});

export default Intro;
