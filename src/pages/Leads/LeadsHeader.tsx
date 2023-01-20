import React, { useState, useEffect } from 'react'
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
import { MdAdd, MdSort, MdFilterList } from "react-icons/all";
import MobileSortDialog from '../../components/MobileSortDialog';
import MobileFilterDialog from '../../components/MobileFilterDialog'
import routes from 'src/components/Helpers/Routes';

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

    const [isOpenDialog, setisOpenDialog] = useState(false)



    const handleOpen = () => {
        setisOpenDialog(true);
    };

    const handleClose = () => {
        setisOpenDialog(false);
    };

    const [open, setOpen] = React.useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClickClose = () => {
        setOpen(false);

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
        showTransferEntityDialog,
        columns,
        dispatch,
        children,
        filters
    } = props;


    let toggleInner = options && (
        <ToggleButtonGroup
            size="small"
            className=" toggle-button-layout"
            value={filter}
            exclusive
            onChange={handleFilter}
        >
            {options.map((k, index) => {
                return (
                    <ToggleButton value={k.key} key={index}>
                        {k.key}
                    </ToggleButton>
                );
            })}
        </ToggleButtonGroup>
    );

    return <Grid className={styles.filter_side_container} container >
        <Grid item xs={12} md={6} sm={12} className={isMobile ? styles.mobile_panel : "d-flex align-items-center gap-1"}>
            {isMobile && !isTablet ?
                <div className="d-flex ">
                    <Button
                        onClick={handleClickOpen}
                        id="demo-customized-button"
                        aria-controls="demo-customized-menu"
                        aria-haspopup="true"
                        // aria-expanded={open ? 'true' : undefined}
                        color="secondary"
                        variant="text"
                        disableElevation
                        startIcon={<MdSort />}
                    >
                        Sort
                    </Button>

                    <MobileSortDialog
                        isOpen={open}
                        handleClose={handleClickClose}
                        contentPart={toggleInner}
                        secHeading={["Sort Leads"]}
                        columns={columns}
                        dispatch={dispatch}
                    />



                    <Button
                        id="demo-customized-button"
                        aria-controls="demo-customized-menu"
                        aria-haspopup="true"
                        // aria-expanded={open ? 'true' : undefined}
                        variant="text"
                        color="secondary"
                        disableElevation
                        startIcon={<MdFilterList />}
                        onClick={handleOpen}
                    >
                        Filter
                    </Button>
                    <MobileFilterDialog
                        isOpen={isOpenDialog}
                        handleClose={handleClose}
                        contentPart={toggleInner}
                        columns={columns}
                        dispatch={dispatch}
                        title={routes?.lead?.title}
                        filters={filters}
                    />
                </div> : options && (
                    <ToggleButtonGroup
                        size="small"
                        className="ml-2"
                        value={filter}
                        exclusive
                        onChange={handleFilter}
                    >
                        {options.map((k, index) => {
                            return (
                                <ToggleButton value={k.key} key={index}>
                                    {k.key}
                                </ToggleButton>
                            );
                        })}
                    </ToggleButtonGroup>
                )}


            {children}
        </Grid>
        <Grid item md={6} sm={12} xs={12} className={styles.filter_side}>
            <Box className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} component="div">

                <Grid style={{ display: "flex", flex: 1 }}>
                    <SearchBox
                        onSearch={onSearch}
                        searchbox={styles.search_box_input}
                        value={searchVal}
                        size="small"
                        placeholder="Search Leads"
                        width={isMobile && !isTablet ? "200px" : "242px"}
                        style={isMobile && !isTablet ? { flex: 1 } : {}}
                    />

                </Grid>

                <Grid style={{ display: "flex", gap: "5px" }}>
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
                            {isMobile && !isTablet ? <MdAdd size={23} /> : "Add"}
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
                                {isMobile && !isTablet ? "" : "Actions"} <ExpandMore />
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
