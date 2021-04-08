import React, { useState } from 'react'
import SearchBox from '../../components/Helpers/SearchBox'
import { makeStyles } from "@material-ui/core/styles";
import { FilterList, SortByAlpha, Search, AddOutlined } from "@material-ui/icons";
import {
    Box,
    Grid,
    Select,
    MenuItem,
    FormControl,
    IconButton,
    Button,
    Menu
} from "@material-ui/core";
import { Add, ExpandMore } from "@material-ui/icons";

import styles from "../Leads/Header.module.scss"
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';

const useStyles = makeStyles((theme) => ({
    filter_side: {
        display: "flex",
        justifyContent: "flex-end",
    },
}));

function DoaHeader(props) {
    const classes = useStyles();
    const [anchorEl, setAnchorEl] = useState(null);

    const openActions = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const closeActions = () => {
        setAnchorEl(null);
    };


    const { onSearch, searchVal, onCreate,
        DoaPermissions, showConfirmBox, canDelete, icon, heading } = props
    return <Grid className={styles.filter_side_container} container>
        <Grid item xs={6} className="d-flex align-items-center gap-1">
            {icon} <span className="listingHeader">{heading}
            </span>
        </Grid>
        <Grid item xs={6} className={styles.filter_side}>
            <Box className={styles.filter_side_header} component="div">
                <SearchBox
                    onSearch={onSearch}
                    searchbox={styles.search_box_input}
                    value={searchVal}
                    size="small"
                    placeholder="Search Doa"
                    width='242px'
                />

                
                {
                    DoaPermissions.isDelete && <>
                        <Button
                            disabled={canDelete}
                            variant="outlined"
                            color="default"
                            onClick={openActions}
                            className={styles.action_submit_btn}
                            aria-controls="action-menu"
                        >
                            Actions <ExpandMore />
                        </Button>
                        <Menu
                            anchorEl={anchorEl}
                            keepMounted
                            getContentAnchorEl={null}
                            anchorOrigin={{
                                vertical: "bottom",
                                horizontal: "left"
                            }}
                            id="action-menu"
                            open={Boolean(anchorEl)}
                            onClose={closeActions}>

                            <MenuItem onClick={() => {
                                closeActions();
                                showConfirmBox(null);
                            }}
                            >Delete</MenuItem>
                        </Menu>
                    </>
                }
            </Box>
        </Grid>
    </Grid>
}
export default DoaHeader;
