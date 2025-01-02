import { useState } from 'react';
import { Menu, MenuItem } from '@mui/material';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { ExpandMore } from '@mui/icons-material';

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
      <ThemeButton
        disabled={isProcessing === 'sendMail'}
        isLoading={isProcessing}
        onClick={(e) => handleClick(e)}
        endIcon={<ExpandMore />}
      >
        Send Mail
      </ThemeButton>
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
