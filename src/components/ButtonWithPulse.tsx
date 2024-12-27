import { FC } from 'react';
import { ButtonProps } from '@mui/material';
import { ThemeButton } from 'src/components/Helpers/Buttons';

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
      <ThemeButton {...others} disabled={disabled}>
        {children}
      </ThemeButton>
    </div>
  );
};

export default ButtonWithPulse;
