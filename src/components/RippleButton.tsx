import React, { useState } from 'react';
import { cn } from 'src/constants/helpers';

const RippleButton = React.forwardRef<HTMLButtonElement, { children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ children, className, onClick, ...rest }, ref) => {
    const [ripples, setRipples] = useState<Array<JSX.Element>>([]);

    const createRipple = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      const button = event.currentTarget;
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = event.clientX - rect.left - size / 2;
      const y = event.clientY - rect.top - size / 2;

      const rippleStyle = {
        width: size,
        height: size,
        top: y,
        left: x
      };

      const ripple = <span key={Date.now()} className="ripple" style={rippleStyle}></span>;

      setRipples((prevRipples) => [...prevRipples, ripple]);

      // Clean up the ripple after animation
      setTimeout(() => {
        setRipples((prevRipples) => prevRipples.slice(1));
      }, 600);
    };

    return (
      <button
        onClick={(e) => {
          createRipple(e);
          onClick?.(e);
        }}
        ref={ref}
        className={cn(
          'relative cursor-pointer overflow-hidden bg-transparent outline-none transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[--new-theme-color] dark:text-[white]',
          className
        )}
        {...rest}
      >
        {children}
        {ripples}
      </button>
    );
  }
);

export default RippleButton;
