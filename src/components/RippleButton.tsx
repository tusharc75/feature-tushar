import React, { forwardRef, useRef } from 'react';
import { cn } from 'src/constants/helpers';

type Component = React.ElementType;

type ElementTypeProps<T extends React.ElementType> = React.ComponentPropsWithoutRef<T>;
type PolymorphicRef<T extends React.ElementType> = React.ComponentPropsWithRef<T>['ref'];

export type RippleButtonProps<T extends Component> = {
  component?: T;
  children?: React.ReactChild;
} & Omit<ElementTypeProps<T>, 'component' | 'children'>;

const createRipple = (event: React.MouseEvent<HTMLElement>, container: HTMLDivElement) => {
  const button = event.currentTarget;
  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;
  const ripple = document.createElement('span');
  ripple.classList.add('ripple');
  Object.assign(ripple.style, {
    width: `${size}px`,
    height: `${size}px`,
    top: `${y}px`,
    left: `${x}px`
  });

  container?.appendChild(ripple);

  setTimeout(() => {
    try {
      container?.removeChild(ripple);
    } catch (error) {
      console.error('Error removing ripple: ', error);
    }
  }, 600);
};

const RippleButton = forwardRef(<T extends Component = 'button'>(props: RippleButtonProps<T>, ref: PolymorphicRef<T>) => {
  const { component = 'button', children, className, onClick = () => {}, onClickCapture = () => {}, ...rest } = props;
  const rippleContainerRef = useRef<HTMLDivElement>(null);

  return React.createElement(
    component,
    {
      onClickCapture: (e: any) => {
        createRipple(e, rippleContainerRef.current);
        if (typeof onClickCapture === 'function') {
          (onClickCapture as any)(e);
        }
      },
      onClick: (e: any) => {
        if (typeof onClick === 'function') {
          (onClick as any)(e);
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
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]" ref={rippleContainerRef}></div>
    </>
  );
}) as <T extends React.ElementType = 'button'>(props: RippleButtonProps<T> & { ref?: PolymorphicRef<T> }) => React.ReactElement | null;

export default React.memo(RippleButton) as typeof RippleButton;
