import React from "react";
import {
  IconButton,
  MenuItem,
  Paper,
  Grow,
  MenuList,
  ClickAwayListener,
  Popper,
  ListItemIcon,
  Typography,
  Avatar,
} from "@material-ui/core";
import { useData } from "./../StateProvider/Provider";
import { FiLogOut, FiUser, FiSettings } from "react-icons/fi";
import "./sidebar.scss";
import { userType } from "../constants/helpers";

export default function UserProfile(props) {
  const {
    state: { user },
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
      >
        <Avatar
          style={{ height: 30, width: 30 }}
          src={user?.user?.avatar}
        ></Avatar>
      </IconButton>
      <Popper
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin:
                placement === "bottom" ? "center top" : "center bottom",
            }}
          >
            <Paper>
              <ClickAwayListener onClickAway={onClose}>
                <MenuList
                  autoFocusItem={open}
                  id="menu-list-grow"
                  onKeyDown={onListKeyDown}
                >
                  <MenuItem onClick={(e) => onClose(e, { profile: true })}>
                    <ListItemIcon style={{ minWidth: "30px" }}>
                      <FiUser />
                    </ListItemIcon>
                    <Typography> Profile</Typography>
                  </MenuItem>
                </MenuList>
              </ClickAwayListener>
              {user?.user?.userType === userType.brandAdmin ? (
                <ClickAwayListener onClickAway={onClose}>
                  <MenuList
                    autoFocusItem={open}
                    id="menu-list-grow"
                    onKeyDown={onListKeyDown}
                  >
                    <MenuItem
                      onClick={(e) => onClose(e, { brandConfiguration: true })}
                    >
                      <ListItemIcon style={{ minWidth: "30px" }}>
                        <FiSettings />
                      </ListItemIcon>
                      <Typography>
                        Brand Configuration
                      </Typography>
                    </MenuItem>
                  </MenuList>
                </ClickAwayListener>
              ) : null}
              <ClickAwayListener onClickAway={onClose}>
                <MenuList
                  autoFocusItem={open}
                  id="menu-list-grow"
                  onKeyDown={onListKeyDown}
                >
                  <MenuItem onClick={(e) => onClose(e, { logout: true })}>
                    <ListItemIcon style={{ minWidth: "30px" }}>
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
