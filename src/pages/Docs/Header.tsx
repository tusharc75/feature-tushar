import React from 'react';
import { AppBar, Toolbar, IconButton, Typography } from '@material-ui/core';
import MenuIcon from '@material-ui/icons/Menu';

interface HeaderProps {
  onToggleSidebar: () => void;
}

const HeaderDocs: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  return (
    <AppBar position="fixed" style={{ zIndex: 1201, backgroundColor: 'white' }}>
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={onToggleSidebar}
        >
          <MenuIcon style={{ color: 'black' }} />
        </IconButton>
        <Typography variant="h6" style={{ color: '#389996' }}>
          Equipt User Manual 
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default HeaderDocs;
