import React, { forwardRef, useState } from 'react';
import { cn } from 'src/constants/helpers';

type Component = React.ElementType;

type ExtendType<T> = T extends keyof JSX.IntrinsicElements ? JSX.IntrinsicElements[T] : Record<string, unknown>;

type RippleButtonProps<T extends Component> = {
  component?: T;
  className?: string;
  children: React.ReactNode | Element[];
} & ExtendType<T>;

const RippleButton = <T extends Component = 'button'>(props: RippleButtonProps<T>, ref: React.Ref<HTMLElement>) => {
  const { component = 'button', children, className, onClick = () => {}, ...rest } = props;
  const [ripples, setRipples] = useState<JSX.Element[]>([]);

  const createRipple = (event: React.MouseEvent<HTMLElement>) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    const ripple = <span key={Date.now()} className="ripple" style={{ width: size, height: size, top: y, left: x }} />;

    setRipples((prev) => [...prev, ripple]);
    setTimeout(() => setRipples((prev) => prev.slice(1)), 600);
  };

  return React.createElement(
    component,
    {
      onClick: (e: any) => {
        createRipple(e);
        if (typeof onClick === 'function') {
          onClick(e);
        }
      },
      ref,
      className: cn(
        'relative cursor-pointer bg-transparent outline-none transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[--new-theme-color] dark:text-white dark:disabled:text-gray-500',
        className
      ),
      ...rest
    },
    <>
      {children}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">{ripples}</div>
    </>
  );
};

export default React.memo(forwardRef(RippleButton)) as typeof RippleButton;
