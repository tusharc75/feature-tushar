import React from 'react';
import { IconButton, MenuItem, Paper, Grow, MenuList, ClickAwayListener, Popper, ListItemIcon, Typography, Avatar } from '@mui/material';
import { useData } from './../StateProvider/Provider';
import { FiLogOut, FiUser, FiSettings } from 'react-icons/fi';
import './sidebar.scss';
import { userType } from '../constants/helpers';
import { MdOutlineSupportAgent } from 'react-icons/md';

export default function UserProfile(props) {
  const {
    state: { user }
  }: any = useData();

  const { anchorRef, open, onToggle, onClose, onListKeyDown } = props;
  return (
    <>
      <IconButton
        id="userProfileIcon"
        edge="end"
        ref={anchorRef}
        aria-label="account of current user"
        aria-haspopup="true"
        color="inherit"
        onClick={onToggle}
        style={{ padding: 0, marginRight: 0 }}
      >
        <Avatar style={{ height: 25, width: 25 }} src={user?.user?.avatar}></Avatar>
      </IconButton>
      <Popper open={open} anchorEl={anchorRef.current} role={undefined} transition style={{ zIndex: 1200 }} disablePortal>
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom'
            }}
            in={open}
          >
            <Paper>
              <ClickAwayListener onClickAway={onClose}>
                <MenuList autoFocusItem={open} id="menu-list-grow" onKeyDown={onListKeyDown}>
                  <MenuItem onClick={(e) => onClose(e, { profile: true })}>
                    <ListItemIcon style={{ minWidth: '30px' }}>
                      <FiUser />
                    </ListItemIcon>
                    <Typography> Profile</Typography>
                  </MenuItem>
                </MenuList>
              </ClickAwayListener>
              {user?.user?.userType === userType.brandAdmin ? (
                <ClickAwayListener onClickAway={onClose}>
                  <MenuList autoFocusItem={open} id="menu-list-grow" onKeyDown={onListKeyDown}>
                    <MenuItem onClick={(e) => onClose(e, { brandConfiguration: true })}>
                      <ListItemIcon style={{ minWidth: '30px' }}>
                        <FiSettings />
                      </ListItemIcon>
                      <Typography>Brand Configuration</Typography>
                    </MenuItem>
                  </MenuList>
                </ClickAwayListener>
              ) : null}
              <ClickAwayListener onClickAway={onClose}>
                <MenuList autoFocusItem={open} id="menu-list-grow" onKeyDown={onListKeyDown}>
                  <MenuItem onClick={(e) => onClose(e, { supportTicket: true })}>
                    <ListItemIcon style={{ minWidth: '30px' }}>
                      <MdOutlineSupportAgent />
                    </ListItemIcon>
                    <Typography>Support Ticket</Typography>
                  </MenuItem>
                </MenuList>
              </ClickAwayListener>
              <ClickAwayListener onClickAway={onClose}>
                <MenuList autoFocusItem={open} id="menu-list-grow" onKeyDown={onListKeyDown}>
                  <MenuItem onClick={(e) => onClose(e, { logout: true })}>
                    <ListItemIcon style={{ minWidth: '30px' }}>
                      <FiLogOut />
                    </ListItemIcon>
                    <Typography>Logout</Typography>
                  </MenuItem>
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  );
}
