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
import { AccountCircle } from "@material-ui/icons";
import { FiLogOut, FiUser, FiSettings } from 'react-icons/fi'
import "./sidebar.scss"
import { userType } from "../constants/helpers"

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
                className="pt-0 pb-0"
            >
                {
                    user?.user?.avatar ? <Avatar  onClick={onToggle} className="" src={user?.user?.avatar}></Avatar>
                        :  <AccountCircle  onClick={onToggle}/> 
                }

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
                                    onKeyDown={onListKeyDown}>
                                    <MenuItem onClick={(e) => onClose(e, { profile: true })}>
                                        <ListItemIcon style={{ minWidth: '30px' }}><FiUser /></ListItemIcon>
                                        <Typography className="logoutProfile"> Profile</Typography>
                                    </MenuItem>
                                </MenuList>
                            </ClickAwayListener>
                            {
                                user?.user?.userType === userType.brandAdmin ?
                                    < ClickAwayListener onClickAway={onClose}>
                                        <MenuList
                                            autoFocusItem={open}
                                            id="menu-list-grow"
                                            onKeyDown={onListKeyDown}>
                                            <MenuItem onClick={(e) => onClose(e, { brandConfiguration: true })}>
                                                <ListItemIcon style={{ minWidth: '30px' }}><FiSettings /></ListItemIcon>
                                                <Typography className="logoutProfile">Brand Configuration</Typography>
                                            </MenuItem>
                                        </MenuList>
                                    </ClickAwayListener> : null
                            }
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
                        </Paper>
                    </Grow>
                )}
            </Popper>
        </>
    );
}
