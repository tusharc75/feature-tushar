import React, { useState } from 'react';
import { Menu, MenuItem } from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const SendMailMenu = ({ exportData, isProcessing }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <HtmlTooltip title={'Send Mail'} placement="top" arrow enterTouchDelay={0}>
        <span>
          <ThemeButton
            disabled={isProcessing === 'sendMail'}
            buttonType='theme'
            isLoading={isProcessing}
            onClick={(e) => handleClick(e)}
          >
            Send Mail
          </ThemeButton>
        </span>
      </HtmlTooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
      >
        <MenuItem
          onClick={() => {
            exportData('excel', 'sendMail');
            handleClose();
          }}
        >
          Excel Attach
        </MenuItem>
        <MenuItem
          onClick={() => {
            exportData('pdf', 'sendMail');
            handleClose();
          }}
        >
          PDF Attach
        </MenuItem>
        <MenuItem
          onClick={() => {
            exportData('html', 'sendMail');
            handleClose();
          }}
        >
          Email Content Attach
        </MenuItem>
      </Menu>
    </>
  );
};

export default SendMailMenu;
