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
        <span className="gradient-text [-webkit-text-fill-color:transparent] [background:linear-gradient(var(--border-gradient))]">{children}</span>
      }
      className={cn(
        `[--border-gradient:91deg,_#1588CB_0.01%,_#A066B1_33.01%,_#FD3295_66%,_rgba(255,_69,_0,_0.50)_100%]`,
        variant === 'dark' ? `[--background:var(--dark-primary,_white)]` : '[--background:var(--dark-secondary,_white)]',
        `[background:linear-gradient(var(--background)_0_0)_padding-box,_linear-gradient(var(--border-gradient))_border-box]`,
        `ai-button h-[32px] rounded-[4px] border-2 border-transparent p-[4px_8px] text-[13px] font-medium md:text-[13.5px]`,
        className
      )}
      {...rest}
      ref={ref}
    />
  );
});

export default AiButton;
