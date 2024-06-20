import { IconButton } from '@material-ui/core';
import { Close } from '@material-ui/icons';
import { ReactNode, useState } from 'react';
import Floater from 'react-floater';

export type Step = {
  title: ReactNode;
  content: ReactNode;
  target: string | null | HTMLElement;
};

type CustomIntroProps = {
  steps: Step[];
};

const CustomIntro = ({ steps }: CustomIntroProps) => {
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
                className="z-[2] !-mr-[5px] flex size-3 items-center justify-center rounded-full bg-blue-400"
                onClick={() => {
                  const newOpen = [...open];
                  newOpen[index] = true;
                  setOpen(newOpen);
                }}
              >
                <span className="h-3 w-3 animate-ping rounded-full bg-blue-400 opacity-75"></span>
              </div>
            </Floater>
          </>
        );
      })}
    </>
  );
};

export default CustomIntro;
