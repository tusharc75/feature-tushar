import DeleteIcon from '@mui/icons-material/Delete';
import { ButtonProps } from '@mui/material';
import React from 'react';
import { ThemeButton } from 'src/components/Helpers/Buttons';

export type DeleteButtonProps = {
  text: string | React.ReactNode;
  tooltip?: string;
  mobileTooltip?: string;
} & ButtonProps;

function DeleteButton({ text, onClick, children, tooltip = '', mobileTooltip = '', ...rest }: DeleteButtonProps) {
  return (
    <ThemeButton
      buttonType="red"
      tooltip={tooltip}
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
