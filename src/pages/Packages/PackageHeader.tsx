import { useState, useEffect } from "react";
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
import { MdAdd, MdSort, MdFilterList } from "react-icons/all";
import MobileSortDialog from "../../components/MobileSortDialog";
import MobileFilterDialog from "../../components/MobileFilterDialog"
import routes from "src/components/Helpers/Routes";



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
    const [isOpenDialog, setisOpenDialog] = useState(false)



    const handleOpen = () => {
        setisOpenDialog(true);
    };

    const handleClose = () => {
        setisOpenDialog(false);
    };

    const [open, setOpen] = useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClickClose = () => {
        setOpen(false);

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
        columns,
        dispatch,
        // showClonePackageDialog
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

    return (
        <Grid className={styles.filter_side_container} container>
            <Grid item xs={12} md={6} sm={12} className="d-flex align-items-center gap-1">
                <Grid item xs={12} md={6} sm={12} className={isMobile ? styles.mobile_panel : "d-flex align-items-center gap-1"}>
                    <div className="d-flex align-items-center">
                        {icon} <span className="listingHeader">{heading}</span>

                    </div>
                    {isMobile && !isTablet &&
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
                                secHeading={["Sort Opportunities"]}
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
                                title={routes?.packages?.title}
                                filters={filters}
                            />
                        </div>
                    }

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

                    <Grid style={{ display: "flex", flex: 1 }}>
                        <HideWhenOffline>
                            <SearchBox
                                onSearch={onSearch}
                                searchbox={styles.search_box_input}
                                value={searchVal}
                                size="small"
                                placeholder="Search Packages"
                                width={isMobile && !isTablet ? "200px" : "242px"}
                                style={isMobile && !isTablet ? { flex: 1 } : {}}
                            />
                        </HideWhenOffline>
                    </Grid>

                    <Grid style={{ display: "flex", gap: "5px" }}>
                        {packagePermissions.isCreate && packagePermissions.isUpdate && (
                            <Button
                                variant={isMobile && !isTablet ? "text" : "contained"}
                                color="primary"
                                size="small"
                                onClick={onCreate}
                                className={isMobile && !isTablet ? "mobile_button" : styles.add_submit_btn}
                                startIcon={isMobile && !isTablet ? null : <AddOutlined />}
                            >
                                {isMobile && !isTablet ? <MdAdd size={23} /> : "Add"}
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
                                    {isMobile && !isTablet ? "" : "Actions"} <ExpandMore />
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
