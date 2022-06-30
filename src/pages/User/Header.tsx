import { useState } from "react";
import { Box, Grid, MenuItem, Button, Menu, Chip } from "@material-ui/core";
import { AddOutlined, ExpandMore } from "@material-ui/icons";
import SearchBox from "../../components/Helpers/SearchBox";
import { FaUsers } from "react-icons/fa";
import MobileSortDialog from '../../components/MobileSortDialog';
import MobileFilterDialog from '../../components/MobileFilterDialog';
import styles from "../Leads/Header.module.scss";
import routes from "../../components/Helpers/Routes";
import { isMobile, isTablet } from "react-device-detect";
import { MdAdd, MdSort, MdFilterList } from "react-icons/all";

const Header = (props) => {
  const {
    onSearch,
    searchVal,
    onCreate,
    userPermissions,
    showConfirmBox,
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
    handleResetPassword,
    userSetupDisabled,
    selectedRecordsLength = 0,
    manageDeleteUser,
    isAssignBrandAdmin,
    handleAssignBrandAdmin,
    isUserSetupPermission,
    isUnAssignBrandAdmin,
    handleUnAssignBrandAdmin,
    columns,
    dispatch,
    filters
  } = props;
  const [anchorEl, setAnchorEl] = useState(null);
  const [isOpenDialog, setisOpenDialog] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };


  const handleClickOpen = () => {
    setSortOpen(true);
  };

  const handleFilterClose = () => {
    setisOpenDialog(false);
  };


  const handleOpen = () => {
    setisOpenDialog(true);
  };

  const handleClickClose = () => {
    setSortOpen(false);
  };

  return (
    <Grid container className={styles.filter_side_container}>
      <Grid item xs={12} md={6} sm={12} className={isMobile ? styles.mobile_panel : 'd-flex align-items-center gap-1'}>
        <div className="d-flex align-items-center">
          <FaUsers className="headerLogo" />{" "}
          <span id="resourceHeader" className="listingHeader">{routes.user.title}</span>
        </div>
        {isMobile && (
          <>
            <Grid style={{ display: 'inline-flex' }}>
              <Button
                onClick={handleClickOpen}
                id="demo-customized-button"
                aria-controls="demo-customized-menu"
                aria-haspopup="true"
                aria-expanded={'true'}
                color="secondary"
                variant="text"
                disableElevation
                startIcon={<MdSort />}
                className={'sort-filter-tablet'}
                style={isTablet ? { marginLeft: '50px' } : {}}
              >
                Sort
              </Button>
              <MobileSortDialog
                isOpen={sortOpen}
                handleClose={handleClickClose}
                contentPart={null}
                secHeading={['Sort Users']}
                columns={columns}
                dispatch={dispatch}
              />

              <Button
                id="demo-customized-button"
                aria-controls="demo-customized-menu"
                aria-haspopup="true"
                aria-expanded={'true'}
                variant="text"
                color="secondary"
                disableElevation
                className={'sort-filter-tablet'}
                startIcon={<MdFilterList />}
                onClick={handleOpen}
              >
                Filter
              </Button>

              <MobileFilterDialog
                isOpen={isOpenDialog}
                handleClose={handleFilterClose}
                contentPart={null}
                columns={columns}
                dispatch={dispatch}
                title={routes?.user?.title}
                filters={filters}
              />
            </Grid>
          </>
        )}


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
      <Grid item md={6} sm={12} xs={12} className={styles.filter_side}>
        <Box component="div" className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} id="resourceOperations">
          <Grid style={{ display: "flex", flex: 1 }}>
            <SearchBox
              searchbox={styles.search_box_input}
              onSearch={onSearch}
              value={searchVal}
              size="small"
              placeholder="Search Users"
              width={isMobile && !isTablet ? "200px" : "242px"}
              style={isMobile && !isTablet ? { flex: 1 } : {}}
            />
          </Grid>


          <Grid style={{ display: "flex", gap: "5px" }}>
            {userPermissions.isCreate && (
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

            {userPermissions.isDelete || userPermissions.isUpdate ? (
              <>
                <Button
                  className={isMobile && !isTablet ? "mobile_button" : styles.action_submit_btn}
                  variant={isMobile && !isTablet ? "text" : "contained"}
                  color="default"
                  size="small"
                  onClick={openActions}
                  aria-controls="action-menu"
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
                  {userPermissions.isDelete && selectedRecordsLength > 0 && (
                    <MenuItem
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
                      onClick={handleAssignBrandAdmin}
                    >
                      Assign Brand Admin
                    </MenuItem>
                  }
                  {
                    isUnAssignBrandAdmin &&
                    <MenuItem
                      onClick={handleUnAssignBrandAdmin}
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
                  {
                    userPermissions.isUpdate && <MenuItem
                      disabled={userSetupDisabled}
                      onClick={() => {
                        handleResetPassword();
                        closeActions();
                      }}
                    >
                      Reset Password
                    </MenuItem>
                  }

                </Menu>

              </>
            ) : null}
          </Grid>
        </Box>
      </Grid>
    </Grid>
  );
};

export default Header;
