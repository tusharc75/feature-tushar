import { IconButton, Tooltip, tooltipClasses, TooltipProps } from '@mui/material';
import React, { useCallback } from 'react';
import { InfoSidebarState, useInforSidebar } from 'src/components/InfoSidebar';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { styled } from '@mui/styles';
import Zoom from '@mui/material/Zoom';

type InfoSidebarButtonProps = {
  resource: InfoSidebarState['data']['resource'];
  actionId: InfoSidebarState['data']['actionId'];
  children?: React.ReactNode | Element[];
  element?: keyof HTMLElementTagNameMap | React.ComponentType<any>;
  tooltip?: React.ReactNode;
  props?: React.HTMLAttributes<HTMLButtonElement>;
};

const TooltipWithStyle = styled(({ className, ...props }: TooltipProps) => <Tooltip {...props} classes={{ popper: className }} />)(
  ({ theme }: any) => ({
    [`& .${tooltipClasses.tooltip}`]: {
      backgroundColor: '#121212',
      color: '#ffffff',
      maxWidth: 300,
      fontSize: theme.typography.pxToRem(15),
      fontWeight: 'normal'
    }
  })
);

const InfoSidebarButton = ({
  actionId,
  resource,
  children = <HelpOutlineIcon fontSize="small" />,
  element = IconButton,
  tooltip = 'Information',
  props
}: InfoSidebarButtonProps) => {
  const [, setStore] = useInforSidebar((state) => state.data);

  const handleClick = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setStore({ data: { actionId, resource } });
    },
    [actionId, resource, setStore]
  );

  return (
    <TooltipWithStyle
      title={tooltip}
      enterTouchDelay={0}
      placement={'top'}
      arrow
      slots={{
        transition: Zoom
      }}
    >
      {React.createElement(element, { onClick: handleClick, size: 'small', color: 'primary', ...props }, children)}
    </TooltipWithStyle>
  );
};

export default InfoSidebarButton;
