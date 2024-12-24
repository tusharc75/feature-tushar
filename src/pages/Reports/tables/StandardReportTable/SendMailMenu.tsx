import React, { useState } from 'react';
import { Menu, MenuItem, Button, CircularProgress } from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import HtmlTooltip from 'src/components/CustomTooltipTitle';

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
          <Button
            onClick={(e) => handleClick(e)}
            endIcon={<ArrowDropDownIcon />}
            variant={'outlined'}
            color="primary"
            aria-controls="simple-menu"
            aria-haspopup="true"
            className="min-h-[32px]"
            size="small"
            disabled={isProcessing === 'sendMail'}
            startIcon={isProcessing === 'sendMail' && <CircularProgress color="inherit" size={18} />}
          >
            Send Mail
          </Button>
        </span>
      </HtmlTooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        getContentAnchorEl={null}
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
