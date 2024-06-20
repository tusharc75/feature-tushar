import { IconButton, Popper } from '@material-ui/core';
import { Close } from '@material-ui/icons';
import { HTMLAttributes, ReactNode, useRef, useState } from 'react';
import Floater from 'react-floater';
import { FaCaretUp } from 'react-icons/fa';
import { cn } from 'src/constants/helpers';

export type Step = {
  title: ReactNode;
  content: ReactNode;
  target?: string | null | HTMLElement;
};

type CustomIntroProps = {
  steps: Step[];
};

const CustomIntroList = ({ steps }: CustomIntroProps) => {
  const [open, setOpen] = useState(steps.map((d) => false));
  return (
    <>
      {steps.map((step, index) => {
        return (
          <>
            <Floater
              key={index}
              disableFlip
              open={open[index]}
              event="hover"
              // hideArrow
              showCloseButton={false}
              target={step.target}
              placement="auto"
              wrapperOptions={{
                placement: 'top-end',
                position: true,
                offset: -5
              }}
              content={<div className="z-[3] p-1 text-gray-600 dark:text-gray-300">{step.content}</div>}
              styles={{
                container: { background: 'var(--dark-secondary, white)', color: 'var(--primary-text)', zIndex: '3', padding: '8px', borderRadius: 5 },
                arrow: { fill: 'var(--dark-secondary, white)' },
                title: { color: 'var(--primary-text)', borderBottom: '1px solid var(--common-border-color)', fontWeight: 600 },
                close: { display: 'none' }
              }}
              title={
                <div className="mb-2 flex items-center justify-between gap-2 pb-1 [border-bottom:1px_solid_var(--common-border-color)]">
                  <p className=" truncate text-[16px] font-semibold ">{step.title}</p>
                  <IconButton
                    size="small"
                    onClick={() => {
                      const newOpen = [...open];
                      newOpen[index] = false;
                      setOpen(newOpen);
                    }}
                  >
                    <Close />
                  </IconButton>
                </div>
              }
            >
              <div
                onClick={() => {
                  const newOpen = [...open];
                  newOpen[index] = true;
                  setOpen(newOpen);
                }}
              ></div>
            </Floater>
          </>
        );
      })}
    </>
  );
};

export default CustomIntroList;

type CustomIntroWrapperProps = {
  title: ReactNode;
  content: ReactNode;
  disabled?: boolean;
} & HTMLAttributes<HTMLSpanElement>;

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
            'absolute right-0 top-0 z-[2] !-mr-[5px] flex size-3 cursor-help items-center justify-center rounded-full border-0 bg-blue-400 focus-within:border-0 focus-within:outline-none',
            open && 'opacity-0'
          )}
        >
          <span className="h-3 w-3 animate-ping rounded-full bg-blue-400 opacity-75"></span>
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
