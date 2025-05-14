import { Info } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import React, { useCallback } from 'react';
import { InfoSidebarState, useInforSidebar } from 'src/components/InfoSidebar';

type InfoSidebarButtonProps = {
  resource: InfoSidebarState['data']['resource'];
  actionId: InfoSidebarState['data']['actionId'];
  children?: React.ReactNode | Element[];
  element?: keyof HTMLElementTagNameMap | React.ComponentType<any>;
  tooltip?: React.ReactNode;
};

const InfoSidebarButton = ({
  actionId,
  resource,
  children = <Info fontSize="small" />,
  element = IconButton,
  tooltip = ''
}: InfoSidebarButtonProps) => {
  const [, setStore] = useInforSidebar((state) => state.data);

  const handleClick = useCallback(() => {
    console.log({ actionId, resource });
    setStore({ data: { actionId, resource } });
  }, [actionId, resource, setStore]);

  return React.createElement(element, { onClick: handleClick, size: 'small', color: 'primary' }, children);
};

export default InfoSidebarButton;
