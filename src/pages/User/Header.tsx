import { useState } from "react";
import { Box, Grid, MenuItem, Button, Menu, Chip } from "@material-ui/core";
import { AddOutlined, ExpandMore } from "@material-ui/icons";
import SearchBox from "../../components/Helpers/SearchBox";
import { FaUsers } from "react-icons/fa";

import styles from "../Leads/Header.module.scss";
import routes from "../../components/Helpers/Routes";

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
    openDOADialog,
    entityRoleRedirectDetails,
    onEntityRoleRedirectDetailRemove,
    unAssignUsersFromEntity,
    openUserSetupDialog,
    assignDoaDisabled,
    userSetupDisabled,
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
        <span id="userResourceTitle" className="listingHeader">{routes.user.title}</span>
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
      <Grid item xs={6} className={styles.filter_side}>
        <Box component="div" className={styles.filter_side_header} id="userOperations">
          <SearchBox
            searchbox={styles.search_box_input}
            onSearch={onSearch}
            value={searchVal}
            size="small"
            placeholder="Search Users"
            width="242px"
          />
          {userPermissions.isCreate && (
            <Button
              className={styles.add_submit_btn}
              variant="contained"
              color="primary"
              size="small"
              onClick={onCreate}
              startIcon={<AddOutlined />}
            >
              Add
            </Button>
          )}

          {userPermissions.isDelete || userPermissions.isUpdate ? (
            <>
              <Button
                className={styles.action_submit_btn}
                variant="outlined"
                color="default"
                size="small"
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
                  horizontal: "left",
                }}
                id="action-menu"
                open={Boolean(anchorEl)}
                onClose={closeActions}
              >
                {userPermissions.isDelete && (
                  <MenuItem
                    disabled={Boolean(canDelete)}
                    onClick={() => {
                      showConfirmBox(null);
                      closeActions();
                    }}
                  >
                    Delete
                  </MenuItem>
                )}

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

                {
                  userPermissions.isUpdate && <MenuItem
                    disabled={rolesActionDisabled}
                    onClick={() => {
                      openGlobalRolesDialog();
                      closeActions();
                    }}
                  >
                    Assign Company Wide Roles
                  </MenuItem>
                }

                {
                  userPermissions.isUpdate && <MenuItem
                    disabled={rolesActionDisabled}
                    onClick={() => {
                      openRegionalRolesDialog();
                      closeActions();
                    }}
                  >
                    Assign Region Wide Functional Roles
                  </MenuItem>
                }

                {
                  userPermissions.isUpdate && <MenuItem
                    disabled={assignDoaDisabled}
                    onClick={() => {
                      openDOADialog();
                      closeActions();
                    }}
                  >
                    Assign DOA's
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
                  userPermissions.isUpdate && <MenuItem
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
