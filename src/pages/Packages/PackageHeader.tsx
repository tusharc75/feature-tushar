import { useState } from "react";
import SearchBox from "../../components/Helpers/SearchBox";
import {
    AddOutlined,
} from "@material-ui/icons";
import {
    Box,
    Grid,
    MenuItem,
    Button,
    Menu,
} from "@material-ui/core";
import { ExpandMore } from "@material-ui/icons";
import ToggleButton from "@material-ui/lab/ToggleButton";
import ToggleButtonGroup from "@material-ui/lab/ToggleButtonGroup";
import styles from "../Leads/Header.module.scss";
import HideWhenOffline from "../../components/HideWhenOffline";
import { isMobile, isTablet } from "react-device-detect";
import {MdAdd} from "react-icons/all";

function PackageHeader(props) {
    const [anchorEl, setAnchorEl] = useState(null);

    const openActions = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const closeActions = () => {
        setAnchorEl(null);
    };

    const [filter, setFilter] = useState("All Packages");

    const handleFilter = (event, newFilter) => {
        if (newFilter != null) {
            setFilter(newFilter);
            onTypeChange(options.find((d) => d.key === newFilter).value);
        }
    };

    const {
        openAssingToProduct,
        selectedRecords,
        onTypeChange,
        options,
        onSearch,
        searchVal,
        onCreate,
        packagePermissions,
        showConfirmBox,
        canDelete,
        icon,
        heading,
        children,
        showTransferEntityDialog,
        // showClonePackageDialog

    } = props;
    return (
        <Grid className={styles.filter_side_container} container>
            <Grid item xs={12} md={6} sm={12} className="d-flex align-items-center gap-1">
                <Grid className="d-flex align-item-center">
                {icon} <span className="listingHeader">{heading}</span>
                </Grid>
                <HideWhenOffline>
                    {options && (
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
                </HideWhenOffline>

                {children}
            </Grid>
            <Grid item xs={12} sm={12} md={6} className={styles.filter_side}>
                <Box className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} component="div">

                    <Grid style={{display: "flex", flex:1}}>
                        <HideWhenOffline>
                            <SearchBox
                                onSearch={onSearch}
                                searchbox={styles.search_box_input}
                                value={searchVal}
                                size="small"
                                placeholder="Search Packages"
                                width={isMobile && !isTablet ? "200px" : "242px"}
                                style={isMobile && !isTablet ? {flex:1} : {}}
                            />
                        </HideWhenOffline>
                    </Grid>

                    <Grid style={{display: "flex" , gap:"5px"}}>
                            {packagePermissions.isCreate && packagePermissions.isUpdate && (
                                <Button
                                    variant={isMobile && !isTablet ? "text" : "contained"}
                                    color="primary"
                                    size="small"
                                    onClick={onCreate}
                                    className={isMobile && !isTablet ? "mobile_button" : styles.add_submit_btn}
                                    startIcon={isMobile && !isTablet ? null : <AddOutlined />}
                                >
                                    {isMobile && !isTablet ? <MdAdd size={23}/> : "Add"}
                                </Button>
                            )}

                            <HideWhenOffline>

                                <>
                                    <Button
                                        disabled={canDelete}
                                        variant={isMobile && !isTablet ? "text" : "contained"}
                                        color="default"
                                        size="small"
                                        onClick={openActions}
                                        aria-controls="action-menu"
                                        className={isMobile && !isTablet ? "mobile_button" : styles.add_submit_btn}
                                    >
                                        {isMobile && !isTablet ? "" :  "Actions" } <ExpandMore/>
                                    </Button>
                                    <Menu
                                        anchorEl={anchorEl}
                                        keepMounted
                                        getContentAnchorEl={null}
                                        anchorOrigin={{
                                            vertical: "bottom",
                                            horizontal: "left",
                                        }}
                                        id="action-menu"
                                        open={Boolean(anchorEl)}
                                        onClose={closeActions}
                                    >
                                        {packagePermissions.isDelete && <MenuItem
                                            onClick={() => {
                                                closeActions();
                                                showConfirmBox(null);
                                            }}
                                        >
                                            Delete
                                        </MenuItem>}
                                        {packagePermissions.isUpdate && <MenuItem
                                            onClick={() => {
                                                openAssingToProduct()
                                                closeActions();
                                            }}
                                        >
                                            Assign Products
                                        </MenuItem>}
                                    </Menu>
                                </>

                            </HideWhenOffline>
                    </Grid>
                </Box>
            </Grid>
        </Grid>
    );
}
export default PackageHeader;
