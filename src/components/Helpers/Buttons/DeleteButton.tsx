import DeleteIcon from '@mui/icons-material/Delete';
import { ButtonProps } from '@mui/material';
import React from 'react';
import { ThemeButton } from 'src/components/Helpers/Buttons';

export type DeleteButtonProps = {
  text: string | React.ReactNode;
  mode?: 'dark' | 'light';
  isVisible?: boolean;
  tooltip?: string;
  mobileTooltip?: string;
} & ButtonProps;

function DeleteButton({ text, onClick, children, mode = 'dark', isVisible = true, tooltip = '', mobileTooltip = '', ...rest }: DeleteButtonProps) {
  if (!isVisible) return null;
  return (
    <ThemeButton
      className={` ${mode}`}
      tooltip={tooltip}
      borderColor="red"
      textColor="red"
      mobileTooltip={mobileTooltip}
      onClick={onClick}
      {...rest}
      iconForMobile={<DeleteIcon style={{ fontSize: 18 }} />}
    >
      {children || text}
    </ThemeButton>
  );
}

export default DeleteButton;
