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
import { isMobile, isTablet } from 'react-device-detect';
import {MdAdd} from "react-icons/all";

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
        selectedLeads,
        showTransferEntityDialog

    } = props;

    return <Grid className={`${styles.filter_side_container} gap-1`} container>
        <Grid item xs={12} md={6} sm={12} className="d-flex align-items-center gap-1">
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
        <Grid item md={6} sm={12} xs={12} className={styles.filter_side}>
            <Box className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} component="div">

                    <Grid style={{display: "flex", flex:1}}>
                    <SearchBox
                        onSearch={onSearch}
                        searchbox={styles.search_box_input}
                        value={searchVal}
                        size="small"
                        placeholder="Search Leads"
                        width='242px'
                        style={isMobile ? {flex:1} : {}}
                    />

                    </Grid>

                        <Grid style={{display: "flex" , gap:"5px"}}>
                        {
                            leadPermissions.isCreate &&
                            <Button
                                variant={isMobile && !isTablet ? "text" : "contained"}
                                color="primary"
                                size="small"
                               // className={styles.add_submit_btn}
                                onClick={onCreate}
                                // startIcon={<AddOutlined />}
                                className={isMobile && !isTablet ? "mobile_button" : styles.add_submit_btn}
                            >
                                {isMobile && !isTablet ? <MdAdd size={23}/> : "Add"}
                            </Button>
                        }

                        {
                            (leadPermissions.isDelete || allowToConvertLeadToOpportunity) && <>
                                <Button
                                    variant={isMobile && !isTablet ? "text" : "contained"}
                                    color="default"
                                    size="small"
                                   // className={styles.action_submit_btn}
                                    onClick={openActions}
                                    aria-controls="action-menu"
                                    className={isMobile && !isTablet ? "mobile_button" : styles.action_submit_btn}
                                >
                                    {isMobile && !isTablet ? "" :  "Actions" } <ExpandMore/>
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
                                            disabled={selectedLeads.length === 0}
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
                                    {
                                        leadPermissions.isUpdate && <MenuItem
                                            onClick={() => {
                                                closeActions();
                                                showTransferEntityDialog();
                                            }}
                                            disabled={selectedLeads.length === 0 || selectedLeads.some(d => d.ownerId !== userId)}
                                        >Transfer Entity</MenuItem>
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
                        </Grid>
            </Box>
        </Grid>
    </Grid>
}
export default LeadsHeader
