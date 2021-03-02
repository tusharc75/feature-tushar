import React from "react";
import {
    IconButton,
    MenuItem,
    Paper,
    Grow,
    MenuList,
    ClickAwayListener,
    Popper,
} from "@material-ui/core";
import { useData } from "./../StateProvider/Provider";
import { AccountCircle } from "@material-ui/icons";

export default function UserProfile(props) {
    const {
        state: { user },
    } = useData();

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
                        <Paper>
                            <ClickAwayListener onClickAway={onClose}>
                                <MenuList
                                    autoFocusItem={open}
                                    id="menu-list-grow"
                                    onKeyDown={onListKeyDown}
                                >
                                    {/* <MenuItem onClick={onClose}>My account</MenuItem> */}
                                    {/* <MenuItem onClick={(e) => onClose(e, { profile: true })}>
                                        Profile
                                    </MenuItem> */}
                                    <MenuItem onClick={(e) => onClose(e, { logout: true })}>
                                        Logout
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
