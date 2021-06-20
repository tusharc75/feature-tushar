import React, { useState } from 'react'
import SearchBox from '../../components/Helpers/SearchBox'
import { AddOutlined } from "@material-ui/icons";
import {
    Grid,
    MenuItem,
    Button,
    Menu,
    Box
} from "@material-ui/core";
import { ExpandMore } from "@material-ui/icons";
import styles from "./Header.module.scss"

import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import MessageDialog from '../../components/Helpers/MessageDialog';
import { processFieldName } from '../../constants/helpers';

function LeadsHeader(props) {
    const [anchorEl, setAnchorEl] = useState(null);
    const [messageDialog, setMessageDialog] = useState({ open: false, message: "" });

    const openActions = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const closeActions = () => {
        setAnchorEl(null);
    };

    const [filter, setFilter] = useState("All Leads");

    const handleFilter = (event, newFilter) => {
        if (newFilter !== null) {
            setFilter(newFilter);
            onTypeChange(options.find((d) => d.key === newFilter).value);
        }
    };

    const {
        userId,
        selectedType,
        onTypeChange,
        options,
        onSearch,
        searchVal,
        onCreate,
        leadPermissions,
        showConfirmBox,
        icon,
        heading,
        allowToConvertLeadToOpportunity,
        showLeadToOpportunityConfirmationDialog,
        selectedLeads
    } = props;

    return <Grid className={styles.filter_side_container} container>
        <Grid item xs={12} md={6} sm={6} className="d-flex align-items-center gap-1">
            {icon} <span className="listingHeader">{heading}
            </span>
            {
                options && <ToggleButtonGroup size="small" className="ml-2"
                    value={filter}
                    exclusive
                    onChange={handleFilter}>
                    {options.map((k, index) => {
                        return (
                            <ToggleButton value={k.key} key={index}>{k.key}
                            </ToggleButton>
                        );
                    })}
                </ToggleButtonGroup>
            }
        </Grid>
        <Grid item xs={6} className={styles.filter_side}>
            <Box className={styles.filter_side_header} component="div">

                <SearchBox
                    onSearch={onSearch}
                    searchbox={styles.search_box_input}
                    value={searchVal}
                    size="small"
                    placeholder="Search Leads"
                    width='242px'
                />
                {
                    leadPermissions.isCreate &&
                    <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        className={styles.add_submit_btn}
                        onClick={onCreate}
                        startIcon={<AddOutlined />}
                    >
                        Add
                    </Button>
                }

                {
                    (leadPermissions.isDelete || allowToConvertLeadToOpportunity) && <>
                        <Button
                            variant="outlined"
                            color="default"
                            size="small"
                            className={styles.action_submit_btn}
                            onClick={openActions}
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
                            onClose={closeActions}
                        >
                            {
                                leadPermissions.isDelete && <MenuItem
                                    onClick={() => {
                                        closeActions();
                                        showConfirmBox(null)
                                    }}
                                    disabled={selectedLeads.length === 0 || selectedLeads.some(d => d.ownerId !== userId)}
                                >Delete</MenuItem>
                            }

                            {
                                allowToConvertLeadToOpportunity && <MenuItem
                                    onClick={() => {
                                        closeActions();
                                        if (selectedLeads.some((d) => d.convertedToOpportunity)) {
                                            setMessageDialog({ open: true, message: `You are trying to convert already converted lead, Please unselect those records and try again.` })
                                        }
                                        else if (selectedLeads.some((d) => (!d[processFieldName] || d[processFieldName].toLowerCase() !== "qualified"))) {
                                            setMessageDialog({ open: true, message: `You have selected lead(s) which are not qualified yet to be converted into opportunity` })
                                        }
                                        else {
                                            if (selectedLeads.some(d => d.isAllowedToUpdate === false)) {
                                                setMessageDialog({ open: true, message: `You are trying to convert lead which you do not have permission, Please unselect those records and try again.` })
                                            }
                                            else {
                                                showLeadToOpportunityConfirmationDialog();
                                            }
                                        }
                                    }}
                                >Convert To Opportunity</MenuItem>
                            }
                        </Menu>
                    </>
                }
                {
                    messageDialog.open ? (
                        <MessageDialog
                            open={messageDialog.open}
                            message={messageDialog.message}
                            onClose={() => setMessageDialog({ open: false, message: null })}
                        />
                    ) : null}
            </Box>
        </Grid>
    </Grid>
}
export default LeadsHeader
