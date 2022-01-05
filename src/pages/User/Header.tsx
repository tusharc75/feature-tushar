import { useState } from "react";
import { Box, Grid, MenuItem, Button, Menu, Chip } from "@material-ui/core";
import { AddOutlined, ExpandMore } from "@material-ui/icons";
import SearchBox from "../../components/Helpers/SearchBox";
import { FaUsers } from "react-icons/fa";

import styles from "../Leads/Header.module.scss";
import routes from "../../components/Helpers/Routes";
import {isMobile} from "react-device-detect";
import {MdAdd} from "react-icons/all";

const Header = (props) => {
  const {
    onSearch,
    searchVal,
    onCreate,
    userPermissions,
    showConfirmBox,
    canDelete,
    openRolesDialog,
    openApprovalProcessDialog,
    openGlobalRolesDialog,
    openRegionalRolesDialog,
    rolesActionDisabled,
    approvalProcessActionDisabled,
    entityRoleRedirectDetails,
    onEntityRoleRedirectDetailRemove,
    unAssignUsersFromEntity,
    openUserSetupDialog,
    userSetupDisabled,
    selectedRecordsLength = 0,
    manageDeleteUser,
    isAssignBrandAdmin,
    handleAssignBrandAdmin,
    isUserSetupPermission,
    isUnAssignBrandAdmin,
    handleUnAssignBrandAdmin
  } = props;
  const [anchorEl, setAnchorEl] = useState(null);

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  return (
    <Grid container className={styles.filter_side_container}>
      <Grid item xs={6} className="d-flex align-items-center gap-1">
        <FaUsers className="headerLogo" />{" "}
        <span id="resourceHeader" className="listingHeader">{routes.user.title}</span>
        {entityRoleRedirectDetails.id && (
          <Chip
            className="ml-3"
            color="primary"
            label={`${entityRoleRedirectDetails.text} : ${entityRoleRedirectDetails.name}`}
            onDelete={() => {
              onEntityRoleRedirectDetailRemove();
            }}
          />
        )}
      </Grid>
      <Grid item xs={isMobile ? 12 : 6} className={styles.filter_side}>
        <Box component="div" className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} id="resourceOperations">
          <Grid style={{display: "flex", flex:1}}>
          <SearchBox
            searchbox={styles.search_box_input}
            onSearch={onSearch}
            value={searchVal}
            size="small"
            placeholder="Search Users"
            width={isMobile ? "200px" : "242px"}
            style={isMobile ? {flex:1} : {}}
          />
          </Grid>
          {userPermissions.isCreate && (
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

          {userPermissions.isDelete || userPermissions.isUpdate ? (
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
                {userPermissions.isDelete && selectedRecordsLength > 0 && (
                  <MenuItem
                    disabled={Boolean(canDelete)}
                    onClick={() => {
                      manageDeleteUser()
                      closeActions();
                    }}
                  >
                    Delete
                  </MenuItem>
                )}

                {
                  isAssignBrandAdmin && selectedRecordsLength > 0 &&
                    <MenuItem
                      onClick = {handleAssignBrandAdmin}
                    >
                      Assign Brand Admin
                    </MenuItem>
                }
                {
                  isUnAssignBrandAdmin && 
                    <MenuItem
                      onClick = {handleUnAssignBrandAdmin}
                    >
                      Unassign Brand Admin
                    </MenuItem>
                }

                {
                  userPermissions.isUpdate && <MenuItem
                    disabled={approvalProcessActionDisabled}
                    onClick={() => {
                      openApprovalProcessDialog();
                      closeActions();
                    }}
                  >
                    Set Approval Process
                  </MenuItem>
                }

                {/* {
                  userPermissions.isUpdate && <MenuItem
                    disabled={rolesActionDisabled}
                    onClick={() => {
                      openGlobalRolesDialog();
                      closeActions();
                    }}
                  >
                    Assign Company Wide Roles
                  </MenuItem>
                } */}

                {
                  userPermissions.isUpdate && <MenuItem
                    disabled={rolesActionDisabled}
                    onClick={() => {
                      openRegionalRolesDialog();
                      closeActions();
                    }}
                  >
                    Assign Entities - Roles
                  </MenuItem>
                }

                {
                  userPermissions.isUpdate && entityRoleRedirectDetails.id && <MenuItem
                    disabled={rolesActionDisabled}
                    onClick={() => {
                      unAssignUsersFromEntity();
                      closeActions();
                    }}
                  >
                    Un-assign Entity
                  </MenuItem>
                }

                {
                  isUserSetupPermission && <MenuItem
                    disabled={userSetupDisabled}
                    onClick={() => {
                      openUserSetupDialog();
                      closeActions();
                    }}
                  >
                    User Setup
                  </MenuItem>
                }

              </Menu>
            </>
          ) : null}
        </Box>
      </Grid>
    </Grid>
  );
};

export default Header;
