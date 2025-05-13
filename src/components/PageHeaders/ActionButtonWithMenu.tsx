import { ExpandMore } from '@mui/icons-material';
import { Menu, useMediaQuery } from '@mui/material';
import React, { useState } from 'react';
import { FaCircleChevronDown } from 'react-icons/fa6';
import { useGetWalkmeInstance } from 'src/components/CustomIntro';
import { ThemeButton, ThemeButtonProps } from 'src/components/Helpers/Buttons';

type ActionButtonProps = {
  tooltip?: string;
  showSearchInMobile?: boolean;
  disabeled?: boolean;
  actionButtonIconsEnabled?: boolean;
  actionMenuItems: React.ReactNode | Element[];
} & ThemeButtonProps;

const ActionButtonWithMenu = ({
  tooltip,
  showSearchInMobile,
  disabeled,
  actionButtonIconsEnabled = true,
  actionMenuItems,
  loading,
  ...rest
}: ActionButtonProps) => {
  const walkmeInstance = useGetWalkmeInstance();
  const isMobile = useMediaQuery('(max-width:600px)');

  const [anchorEl, setAnchorEl] = useState(null);
  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <ThemeButton
        tooltip={tooltip ?? 'Actions'}
        id={showSearchInMobile ? 'dialog-action-button' : 'action-button'}
        disabled={disabeled}
        {...rest}
        onClick={openActions}
        aria-controls="action-menu"
        buttonType="yellow"
        endIcon={isMobile ? null : actionButtonIconsEnabled ? <ExpandMore /> : null}
        iconForMobile={<FaCircleChevronDown size={16} />}
        isLoading={loading}
      >
        Actions
      </ThemeButton>
      <Menu
        anchorEl={anchorEl}
        keepMounted
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
        id="action-menu"
        open={Boolean(anchorEl)}
        onClose={closeActions}
        slotProps={{
          transition: { timeout: walkmeInstance ? 0 : 200 }
        }}
      >
        <span onClick={() => closeActions()}>{actionMenuItems}</span>
      </Menu>
    </>
  );
};

export default ActionButtonWithMenu;
