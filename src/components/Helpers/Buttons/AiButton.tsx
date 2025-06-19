import React from 'react';
import RippleButton from 'src/components/RippleButton';
import { cn } from 'src/constants/helpers';

const AiButton = React.forwardRef<
  HTMLButtonElement,
  { children: string; variant?: 'dark' | 'light' } & React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ children, className, variant = 'light', ...rest }, ref) => {
  return (
    <RippleButton
      children={
        <span className="gradient-text [--text-gradient:91deg,_#1588CB_0.01%,_#A066B1_33.01%,_#FD3295_66%,_rgba(255,_69,_0,_0.50)_100%] [-webkit-text-fill-color:transparent] [background:linear-gradient(var(--text-gradient))]">
          {children}
        </span>
      }
      className={cn(
        variant === 'dark' ? `[--surface:var(--dark-primary,_white)]` : '[--surface:var(--dark-secondary,_white)]',
        `ai-ring`,
        `h-[32px] rounded-[4px] border-2 border-transparent p-[4px_8px] text-[13px] font-medium md:text-[13.5px]`,
        className
      )}
      {...rest}
      ref={ref}
    />
  );
});

export default AiButton;
