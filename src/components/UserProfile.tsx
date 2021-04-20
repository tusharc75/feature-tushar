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
} from "@material-ui/core";
import { useData } from "./../StateProvider/Provider";
import { AccountCircle } from "@material-ui/icons";
import { FiLogOut, FiUser } from 'react-icons/fi'
import "./sidebar.scss"

export default function UserProfile(props) {
    const {
        state: { user },
    }: any = useData();

    const { anchorRef, open, onToggle, onClose, onListKeyDown } = props;
    return (
        <>
            <IconButton
                edge="end"
                ref={anchorRef}
                aria-label="account of current user"
                aria-haspopup="true"
                color="inherit"
                onClick={onToggle}
            >
                <AccountCircle />
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
                        <Paper className="userLinks">
                            <ClickAwayListener onClickAway={onClose}>
                                <MenuList
                                    autoFocusItem={open}
                                    id="menu-list-grow"
                                    onKeyDown={onListKeyDown}>
                                    <MenuItem onClick={(e) => onClose(e, { logout: true })}>
                                        <ListItemIcon style={{ minWidth: '30px' }}><FiLogOut /></ListItemIcon>
                                        <Typography className="logoutProfile">Logout</Typography>
                                    </MenuItem>
                                </MenuList>
                            </ClickAwayListener>
                            <ClickAwayListener onClickAway={onClose}>
                                <MenuList
                                    autoFocusItem={open}
                                    id="menu-list-grow"
                                    onKeyDown={onListKeyDown}>
                                    <MenuItem onClick={(e) => onClose(e, { profile: true })}>
                                        <ListItemIcon style={{ minWidth: '30px' }}><FiUser /></ListItemIcon>
                                        <Typography className="logoutProfile"> Profile</Typography>
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
