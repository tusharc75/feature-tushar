import { useState } from "react";
import { Box, Grid, MenuItem, Button, Menu } from "@material-ui/core";
import { AddOutlined, ExpandMore } from "@material-ui/icons";
import styles from "../Leads/Header.module.scss";
import SearchBox from "../../components/Helpers/SearchBox";
import { BiNetworkChart } from "react-icons/bi";
import routes from "../../components/Helpers/Routes";
import {isMobile} from "react-device-detect";
import {MdAdd} from "react-icons/all";

const EntityHeader = (props) => {
  const {
    onSearch,
    searchVal,
    onCreate,
    entityPermissions,
    openUserDialog,
    anyEntitySelected,
    selectedRecords = [],
    manageDeleteEntity,
    canDelete
  } = props;
  const [anchorEl, setAnchorEl] = useState(null);
  const [showDeleteEntityDialog, setShowDeleteEntityDialog] = useState(null);

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };


  return (
    <Grid container className={styles.filter_side_container}>
      <Grid item xs={6} className="d-flex align-items-center gap-1">
        <BiNetworkChart className="headerLogo" />
        <span className="listingHeader">{routes.entity.title}</span>
      </Grid>
      <Grid item xs={isMobile ? 12 : 6} className={styles.filter_side}>
        <Box component="div" className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header}>
          <Grid style={{display: "flex", flex:1}}>
          <SearchBox
            onSearch={onSearch}
            value={searchVal}
            searchbox={styles.search_box_input}
            size="small"
            placeholder="Search Entities"
            width={isMobile ? "200px" : "242px"}
            style={isMobile ? {flex:1} : {}}
          />
          </Grid>

          <Grid style={{display: "flex" , gap:"5px"}}>
          {entityPermissions.isCreate && (
            <Button
              variant={isMobile ? "text" : "contained"}
              color="primary"
              size="small"
              onClick={onCreate}
              className={isMobile ? "mobile_button" : styles.add_submit_btn}
              startIcon={isMobile ? null : <AddOutlined />}
            >
              {isMobile ? <MdAdd size={23}/> : "Add"}
            </Button>
          )}

          {entityPermissions.isUpdate ? (
            <>
              <Button
                  className={isMobile ? "mobile_button" : styles.action_submit_btn}
                variant={isMobile ? "text" : "contained"}
                color="default"
                size="small"
                onClick={openActions}
                aria-controls="action-menu"
              >
                {isMobile ? "" :  "Actions" } <ExpandMore/>
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
                {entityPermissions.isDelete && selectedRecords.length && (
                  <MenuItem
                    disabled={selectedRecords.length > 1 ? true : Boolean(!canDelete) ? true : false}
                    onClick={() => {
                      manageDeleteEntity()
                      closeActions();
                    }}
                  >
                    Delete
                  </MenuItem>
                )}
                {entityPermissions.isUpdate && (
                  <MenuItem
                    disabled={!anyEntitySelected}
                    onClick={() => {
                      openUserDialog();
                      closeActions();
                    }}
                  >
                    Assign User
                  </MenuItem>
                )}
              </Menu>
            </>
          ) : null}
          </Grid>
        </Box>
      </Grid>
    </Grid>
  );
};

export default EntityHeader;
