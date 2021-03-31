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

const useStyles = makeStyles((theme) => ({
    filter_side: {
        display: "flex",
        justifyContent: "flex-end",
    },
}));

function OpportunitiesHeader(props) {
    const classes = useStyles();
    const [anchorEl, setAnchorEl] = useState(null);

    const openActions = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const closeActions = () => {
        setAnchorEl(null);
    };

    const { selectedType, onTypeChange, options, onSearch, searchVal, onCreate,
        opportunityPermissions, showConfirmBox, canDelete } = props
    return <Grid className={styles.filter_side_container}  container>
        <Grid item xs={6}>
            <FormControl style={{ minWidth: "170px" }}>
                {
                    Object.keys(options).length ? <Select
                        style={{ width: '160px' }}
                        displayEmpty
                        labelId="demo-simple-select-outlined-label"
                        inputProps={{ "aria-label": "Without label" }}
                        id="demo-simple-select-outlined"
                        disableUnderline
                        MenuProps={{
                            anchorOrigin: {
                                vertical: "bottom",
                                horizontal: "left"
                            },
                            getContentAnchorEl: null
                        }}
                        value={selectedType}
                        onChange={onTypeChange}
                        label="Select Type"
                    >
                        {
                            Object.keys(options).map((k, index) => {
                                return <MenuItem key={index} value={options[k]}>{k}</MenuItem>
                            })
                        }
                    </Select>
                        : null
                }
            </FormControl>
        </Grid>
        <Grid item xs={6} className={styles.filter_side}>
            <Box  className={styles.filter_side_header} component="div">
                <SearchBox
                    onSearch={onSearch}
                    searchbox={styles.search_box_input}
                    value={searchVal}
                    size="small"
                    placeholder="Search Opportunity"
                    width='242px'
                />

                {
                    opportunityPermissions.isCreate &&
                    <Button
                        variant="contained"
                        color="primary"
                        className={styles.add_submit_btn}
                        onClick={onCreate}
                        startIcon={<AddOutlined />}
                    >
                        Add
                </Button>
                }
                {
                    opportunityPermissions.isDelete && <>
                        <Button
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

                            <MenuItem onClick={() => { showConfirmBox(null) }}
                            >Delete</MenuItem>
                        </Menu>
                    </>
                }
            </Box>
        </Grid>
    </Grid>
}
export default OpportunitiesHeader;
