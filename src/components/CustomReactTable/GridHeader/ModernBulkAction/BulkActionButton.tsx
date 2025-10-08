import React, { forwardRef } from 'react';
import RippleButton, { RippleButtonProps } from 'src/components/RippleButton';
import { cva, VariantProps } from 'class-variance-authority';
import { cn } from 'src/constants/helpers';
import HtmlTooltip from 'src/components/CustomTooltipTitle';

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 border-theme whitespace-nowrap rounded-md font-normal text-[13px] transition-all disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive px-[15px] py-[5px]",
  {
    variants: {
      buttonType: {
        outline:
          'border bg-[white] dark:bg-[var(--dark-primary)] disabled:border-[var(--common-border-color)] shadow-xs hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-accent-foreground',
        theme: 'bg-theme text-white hover:bg-[var(--new-theme-color-hover)]',
        red: 'border border-red-500 disabled:border-[var(--common-border-color)] bg-[white] dark:bg-[var(--dark-primary)]'
      },
      variant: {
        rounded: 'rounded-full',
        simple: 'rounded-[4px]'
      }
    },
    defaultVariants: {
      buttonType: 'outline',
      variant: 'rounded'
    }
  }
);

export type BulkActionButtonProps<T extends React.ElementType> = {
  startIcon?: React.ReactChild;
  endIcon?: React.ReactChild;
  tooltip?: React.ReactNode;
} & RippleButtonProps<T> &
  VariantProps<typeof buttonVariants>;

const BulkActionButton = forwardRef(
  <T extends React.ElementType = 'button'>(props: BulkActionButtonProps<T>, ref: React.ComponentPropsWithRef<T>['ref']) => {
    const { className, buttonType, startIcon, endIcon, children, tooltip = '', ...rest } = props as any;
    return (
      <HtmlTooltip title={tooltip}>
        <RippleButton ref={ref} className={cn(buttonVariants({ buttonType, className }))} {...rest}>
          {startIcon && <span>{startIcon}</span>}
          <span>{children}</span>
          {endIcon && <span>{endIcon}</span>}
        </RippleButton>
      </HtmlTooltip>
    );
  }
) as <T extends React.ElementType = 'button'>(
  props: BulkActionButtonProps<T> & { ref?: React.ComponentPropsWithRef<T>['ref'] }
) => React.ReactElement | null;

(BulkActionButton as any).displayName = 'BulkActionButton';

export default BulkActionButton;
