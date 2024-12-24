import React, { FC } from 'react';
import { Button, ButtonProps } from '@mui/material';

interface ButtonWithPulseProps extends ButtonProps {
  pulseEffect?: boolean;
}

const ButtonWithPulse: FC<ButtonWithPulseProps> = ({ children, disabled, pulseEffect = true, ...others }) => {
  return (
    <div className="relative isolate">
      {!disabled && pulseEffect && (
        <span className="animate-ripple dark-bg-[var(--dark-primary)] rounded-[3px] bg-white">
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
