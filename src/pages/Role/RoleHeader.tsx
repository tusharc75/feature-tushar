import { useState } from "react";
import { Box, Grid, MenuItem, Button, Menu } from "@material-ui/core";
import { AddOutlined, ExpandMore } from "@material-ui/icons";
import SearchBox from "../../components/Helpers/SearchBox";

import { BsPersonBoundingBox } from 'react-icons/bs';

import styles from "../Leads/Header.module.scss";
import { useData } from "../../StateProvider/Provider";
import { localStorageKeys } from "../../constants/helpers";
import routes from "../../components/Helpers/Routes";
import {isMobile, isTablet} from "react-device-detect";
import {MdAdd} from "react-icons/all";

const RoleHeader = (props) => {
  const {
    onTypeChange,
    options,
    onSearch,
    searchVal,
    onCreate,
    rolePermissions,
    showConfirmBox,
    canDelete,
    selectedRecords,
    userDialogOpen
  } = props;
  const [anchorEl, setAnchorEl] = useState(null);
  const [filter, setFilter] = useState(localStorage.getItem(localStorageKeys.currentSelectedRoleType) ?
    localStorage.getItem(localStorageKeys.currentSelectedRoleType) : "Global");

  const {
    state: { selectedEntity },
  }: any = useData();

  const handleFilter = (event, newFilter) => {
    if (newFilter != null) {
      setFilter(newFilter);
      onTypeChange(options.find((d) => d.key === newFilter).value);
      localStorage.setItem("currentSelectedRoleType", newFilter)
    }
  };
  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  return (
    <Grid container className={styles.filter_side_container}>
      <Grid item xs={12} md={6} sm={6} className="d-flex align-items-center gap-1">
        <BsPersonBoundingBox /> <span className="listingHeader">{routes.role.title}</span>
        {/* {options && (
          <ToggleButtonGroup
            size="small"
            value={filter}
            exclusive
            onChange={handleFilter}
          >
            {options.map((k, index) => {
              return (
                <ToggleButton value={k.key} key={index}>
                  {k.key === "Global" ? "Company wide role" : "Region wide functional role"}
                </ToggleButton>
              );
            })}
          </ToggleButtonGroup>
        )} */}
      </Grid>
      <Grid item md={6} sm={12} xs={12} className={styles.filter_side}>
        <Box component="div" className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header}>
          <Grid style={{display: "flex", flex:1}}>
          <SearchBox
            searchbox={styles.search_box_input}
            onSearch={onSearch}
            value={searchVal}
            size="small"
            placeholder="Search Role"
            width={isMobile && !isTablet ? "200px" : "242px"}
            style={isMobile && !isTablet ? {flex:1} : {}}
          />
          </Grid>

          <Grid style={{display: "flex" , gap:"5px"}}>
          {rolePermissions.isCreate && (filter === "Global" || (filter === "Regional" && selectedEntity)) && (
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

          {(rolePermissions.isDelete || rolePermissions.isUpdate) && (
            <>
              <Button
                disabled={selectedRecords.length === 0}
                className={isMobile && !isTablet ? "mobile_button" : styles.action_submit_btn}
                variant={isMobile && !isTablet ? "text" : "contained"}
                color="default"
                size="small"
                onClick={openActions}
                aria-controls="action-menu"
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
                <MenuItem
                  disabled={Boolean(!canDelete)}
                  onClick={() => {
                    closeActions();
                    showConfirmBox(null);
                  }}
                >
                  Delete
                </MenuItem>
                <MenuItem
                  disabled={!rolePermissions.isUpdate}
                  onClick={() => {
                    closeActions();
                    userDialogOpen();
                  }}
                >
                  Assign users
                </MenuItem>
              </Menu>
            </>
          )}
          </Grid>
        </Box>
      </Grid>
    </Grid>
  );
};

export default RoleHeader;
