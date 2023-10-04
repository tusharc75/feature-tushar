import { useState } from 'react';
import { Box, Grid, MenuItem, Button, Menu, Chip, IconButton } from '@material-ui/core';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import SearchBox from '../../components/Helpers/SearchBox';
import { FaUsers } from 'react-icons/fa';
import MobileSortDialog from '../../components/MobileSortDialog';
import MobileFilterDialog from '../../components/MobileFilterDialog';
import styles from '../Leads/Header.module.scss';
import routes from '../../components/Helpers/Routes';
import { isMobile, isTablet } from 'react-device-detect';
import { MdAdd, MdSort, MdFilterList, TbArrowsSort, MdOutlineFilterAlt } from 'react-icons/all';

const Header = (props) => {
  const {
    onSearch,
    searchVal,
    onCreate,
    userPermissions,
    superAdminAccess,
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
    handleEmailVisibility,
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className={'d-flex align-items-center gap-1'}>
        {isMobile && (
          <div className="d-flex flex-wrap items-center justify-between w-full gap-2">
            <div></div>
            <div className="flex flex-wrap items-center gap-1 ml-auto">
              <IconButton
                onClick={handleClickOpen}
                id="demo-customized-button"
                aria-controls="demo-customized-menu"
                aria-haspopup="true"
                aria-expanded={'true'}
                className={'mobileIconButton secondary'}
                size="small"
              >
                <TbArrowsSort className="rotate-90" size={16} />
              </IconButton>
              <MobileSortDialog
                isOpen={sortOpen}
                handleClose={handleClickClose}
                contentPart={null}
                secHeading={['Sort Users']}
                columns={columns}
                dispatch={dispatch}
              />

              <IconButton
                id="demo-customized-button"
                aria-controls="demo-customized-menu"
                aria-haspopup="true"
                aria-expanded={'true'}
                className={'mobileIconButton secondary'}
                size="small"
                onClick={handleOpen}
              >
                <MdOutlineFilterAlt size={16} />
              </IconButton>

              <MobileFilterDialog
                isOpen={isOpenDialog}
                handleClose={handleFilterClose}
                contentPart={null}
                columns={columns}
                dispatch={dispatch}
                title={routes?.user?.title}
                filters={filters}
              />
            </div>
          </div>
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
      </div>
      <div className="flex flex-wrap gap-[8px]  justify-end">
        <SearchBox onChange={onSearch} className={styles.search_box_input} value={searchVal} size="small" />

        <div className="flex gap-[8px] flex-wrap items-center">
          {userPermissions.isCreate && (
            <Button
              variant={'contained'}
              color="primary"
              size="small"
              onClick={onCreate}
              className={`no-shadow`}
              startIcon={isMobile && !isTablet ? null : <AddOutlined />}
            >
              Add
            </Button>
          )}

          {userPermissions.isDelete || userPermissions.isUpdate ? (
            <>
              <Button
                className={`new-dropdown-v1`}
                variant={'outlined'}
                color="default"
                size="small"
                disabled={selectedRecordsLength === 0}
                onClick={openActions}
                aria-controls="action-menu"
                endIcon={<ExpandMore />}
              >
                Actions
              </Button>
              <Menu
                anchorEl={anchorEl}
                keepMounted
                getContentAnchorEl={null}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left'
                }}
                id="action-menu"
                open={Boolean(anchorEl)}
                onClose={closeActions}
              >
                {userPermissions.isDelete && selectedRecordsLength > 0 && (
                  <MenuItem
                    onClick={() => {
                      manageDeleteUser();
                      closeActions();
                    }}
                  >
                    Delete
                  </MenuItem>
                )}

                {isAssignBrandAdmin && selectedRecordsLength > 0 && <MenuItem onClick={handleAssignBrandAdmin}>Assign Brand Admin</MenuItem>}
                {/* {isUnAssignBrandAdmin && <MenuItem onClick={handleUnAssignBrandAdmin}>Unassign Brand Admin</MenuItem>} */}

                {userPermissions.isUpdate && (
                  <MenuItem
                    disabled={approvalProcessActionDisabled}
                    onClick={() => {
                      openApprovalProcessDialog();
                      closeActions();
                    }}
                  >
                    Set Approval Process
                  </MenuItem>
                )}

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

                {userPermissions.isUpdate && (
                  <MenuItem
                    disabled={rolesActionDisabled}
                    onClick={() => {
                      openRegionalRolesDialog();
                      closeActions();
                    }}
                  >
                    Assign Entities - Roles
                  </MenuItem>
                )}

                {userPermissions.isUpdate && entityRoleRedirectDetails.id && (
                  <MenuItem
                    disabled={rolesActionDisabled}
                    onClick={() => {
                      unAssignUsersFromEntity();
                      closeActions();
                    }}
                  >
                    Un-assign Entity
                  </MenuItem>
                )}

                {isUserSetupPermission && (
                  <MenuItem
                    disabled={userSetupDisabled}
                    onClick={() => {
                      openUserSetupDialog();
                      closeActions();
                    }}
                  >
                    User Setup
                  </MenuItem>
                )}
                {userPermissions.isUpdate && (
                  <MenuItem
                    onClick={() => {
                      handleResetPassword();
                      closeActions();
                    }}
                  >
                    Reset Password
                  </MenuItem>
                )}
                {superAdminAccess && (
                  <MenuItem
                    onClick={() => {
                      handleEmailVisibility(true);
                      closeActions();
                    }}
                  >
                    Hide Email
                  </MenuItem>
                )}
                {superAdminAccess && (
                  <MenuItem
                    onClick={() => {
                      handleEmailVisibility(false);
                      closeActions();
                    }}
                  >
                    Unhide Email
                  </MenuItem>
                )}
              </Menu>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Header;
