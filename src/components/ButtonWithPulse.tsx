import React, { FC } from 'react';
import { Button, ButtonProps } from '@material-ui/core';

interface ButtonWithPulseProps extends ButtonProps {
  pulseEffect?: boolean;
}

const ButtonWithPulse: FC<ButtonWithPulseProps> = ({ children, disabled, pulseEffect = true, ...others }) => {
  return (
    <div className="relative isolate">
      {!disabled && pulseEffect && (
        <span className="animate-ripple bg-white dark-bg-[var(--dark-primary)] rounded-[3px]">
          <span></span>
          <span></span>
        </span>
      )}
      <Button {...others} disabled={disabled}>
        {children}
      </Button>
    </div>
  );
};

export default ButtonWithPulse;
