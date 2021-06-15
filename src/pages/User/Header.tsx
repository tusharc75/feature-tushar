import { useState } from "react";
import { Box, Grid, MenuItem, Button, Menu, Chip } from "@material-ui/core";
import { AddOutlined, ExpandMore } from "@material-ui/icons";
import SearchBox from "../../components/Helpers/SearchBox";
import { FaUsers } from "react-icons/fa";

import styles from "../Leads/Header.module.scss";

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
    openDOADialog,
    entityRoleRedirectDetails,
    onEntityRoleRedirectDetailRemove
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
        <span className="listingHeader">Users</span>

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
        <Box component="div" className={styles.filter_side_header}>
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
                {userPermissions.isUpdate && (
                  <>

                    <MenuItem
                      disabled={rolesActionDisabled}
                      onClick={() => {
                        openApprovalProcessDialog();
                        closeActions();
                      }}
                    >
                      Set Approval Process
                    </MenuItem>

                    <MenuItem
                      disabled={rolesActionDisabled}
                      onClick={() => {
                        openGlobalRolesDialog();
                        closeActions();
                      }}
                    >
                      Assign company wide roles
                    </MenuItem>
                    <MenuItem
                      disabled={rolesActionDisabled}
                      onClick={() => {
                        openRegionalRolesDialog();
                        closeActions();
                      }}
                    >
                      Assign region wide functional roles
                    </MenuItem>
                    <MenuItem
                      disabled={rolesActionDisabled}
                      onClick={() => {
                        openDOADialog();
                        closeActions();
                      }}
                    >
                      Assign DOA's
                    </MenuItem>
                  </>
                )}
              </Menu>
            </>
          ) : null}
        </Box>
      </Grid>
    </Grid>
  );
};

export default Header;
