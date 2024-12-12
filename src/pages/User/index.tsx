import { Box, Chip, Dialog, IconButton, MenuItem, Typography } from '@material-ui/core';
import { Delete as DeleteIcon } from '@material-ui/icons';
import axios, { CancelTokenSource } from 'axios';
import { camelCase, uniqBy } from 'lodash';
import { FC, useContext, useEffect, useState } from 'react';
import { FaUserAltSlash, FaUserCheck } from 'react-icons/fa';
import { Link, useHistory } from 'react-router-dom';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { deleteDisable } from 'src/constants/messageHelpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import AssignEntityDialog from '../../components/AssignRolesDialog/AssignEntityDialog';
import AssignRolesDialog from '../../components/AssignRolesDialog/AssignRolesDialog';
import CustomContainer from '../../components/CustomContainer';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import MessageDialog from '../../components/Helpers/MessageDialog';
import NoDataCell from '../../components/Helpers/NoDataCell';
import ResourceTransferDialog from '../../components/ResourceTransferDialog';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import {
  checkSuperAdminAccess,
  CustomDialogTransition,
  gridLoadingTimeout,
  prepareDataForGrid,
  sidebarResource,
  userType
} from './../../constants/helpers';
import GenerateAutoPassword from './GenerateAutoPassword';
import ManageUserDialog from './ManageUserDialog';
import { isMobile, isTablet } from 'react-device-detect';

const renderedFrom = camelCase(sidebarResource.user);

const User: FC = () => {
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { generateColumns } = useColumns();

  const {
    state: { user, permissions, resources }
  }: any = useData();

  const [globalRolesDialogOpen, setGlobalRolesDialogOpen] = useState(false);
  const [regionalRolesDialogOpen, setRegionalRolesDialogOpen] = useState(false);
  const [renderCount, setRenderCount] = useState(0);
  const [isOpen, setIsOpen] = useState({ open: false, isClone: false, idToClone: null });
  const [showBrandAssignConfirmation, setShowBrandAssignConfirmation] = useState(false);
  const [brandAssigningLoading, setBrandAssigningLoading] = useState(false);
  const [showBrandUnAssignConfirmation, setShowBrandUnAssignConfirmation] = useState(false);
  const [brandUnAssigningLoading, setBrandUnAssigningLoading] = useState(false);
  const [deleteRec, setDeleteRec] = useState<any>({});
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [unAssignLoading, setUnAssignLoading] = useState(false);
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
  const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] = useState(false);
  const [entityRoleRedirectDetails, setEntityRoleRedirectDetails] = useState({
    id: history.location?.state?.id,
    name: history.location?.state?.name,
    type: history.location?.state?.type,
    text: history.location?.state?.text
  });
  const [userList, setUserList] = useState<any[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteUser, setDeleteUser] = useState<any>([]);
  const [allUsers, setAllUsers] = useState([]);
  const [entityAccess, setEntityAccess] = useState([]);
  const [roleAccessOfLoggedInUser, setRoleAccessOfLoggedInUser] = useState([]);
  const [columns, setColumns] = useState(null);
  const [generateAutoPassword, setGenerateAutoPassword] = useState(false);

  const extraColumns = [
    {
      accessor: 'regionalWideRole',
      Header: 'Assigned Roles',
      minWidth: 180,
      width: 180,
      disableFilters: true,
      disableSortBy: true,
      Cell: ({ row }) =>
        row?.original?.regionalWideRole ? (
          <>
            <h5 className="createBy d-flex">
              <Link className="link" title={row?.original?.regionalWideRole} to={`${routes.roleDetail.path}/${row?.original?.regionalWideRoleId}`}>
                {row?.original?.regionalWideRole}
              </Link>
              {row?.original?.restRegionalWideRoles.length > 0 && (
                <span className="createdAtTime badge-date">
                  <span className="hidden">&nbsp;&nbsp;</span>
                  {`+${row?.original?.restRegionalWideRoles.length} more..`}
                </span>
              )}
            </h5>
          </>
        ) : (
          <NoDataCell />
        )
    },
    {
      accessor: 'status',
      Header: 'Status',
      minWidth: 150,
      width: 150,
      disableFilters: true,
      disableSortBy: true,
      Cell: ({ row }) => (
        <div style={{ width: 150 }}>
          {row?.original?.status ? (
            <HtmlTooltip title="Inactive">
              <Typography>
                <FaUserAltSlash className="text-error ml-2" />
              </Typography>
            </HtmlTooltip>
          ) : (
            <HtmlTooltip title="Active">
              <Typography>
                <FaUserCheck className="text-success ml-2" />
              </Typography>
            </HtmlTooltip>
          )}{' '}
        </div>
      )
    }
  ];

  useEffect(() => {
    fetchFields();
    fetchLoggedInUserEntities();
    fetchLoggedInUserRole();
  }, []);

  const fetchFields = () => {
    axiosInstance()
      .get(`/field?resource=User&view=true`)
      .then(({ data: { data } }) => {
        const newColumns = generateColumns(renderedFrom, data, routes.userDetail.path, true);
        setColumns([...newColumns, ...extraColumns, ...getStaticFields(), ActionsRenderer]);
      });
  };

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 100,
    width: 110,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) =>
      user?.user._id === row?.original?.id ? (
        <p title="There is no action for currently logged in user">No Actions</p>
      ) : (
        <>
          <HtmlTooltip title={!row?.original?.canDelete ? deleteDisable : row?.original?.isBrandAdmin ? 'Brand Admin Can not be Deleted' : 'Delete'}>
            <span>
              <IconButton
                size="small"
                aria-label="Delete"
                disabled={row?.original?.canDelete && !row?.original?.isBrandAdmin ? false : true}
                onClick={() => {
                  setDeleteUser([row?.original]);
                  setShowDeleteDialog(true);
                }}
              >
                <DeleteIcon fontSize="small" color={row?.original?.canDelete && !row?.original?.isBrandAdmin ? 'error' : 'disabled'} />
              </IconButton>
            </span>
          </HtmlTooltip>
        </>
      )
  };

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}&withoutRoleLookup=true`;

    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || []).map((m) => m._id))}`;
    }

    const { filterByIds, deepFilters } = gridFilterParser(filters);

    if (entityRoleRedirectDetails?.id) {
      switch (entityRoleRedirectDetails?.type) {
        case 'entity':
          filterByIds.push({ field: 'entities.entity', term: entityRoleRedirectDetails?.id });
          break;

        case 'globalRole':
          filterByIds.push({ field: 'role', term: entityRoleRedirectDetails?.id });
          break;

        case 'regionalRole':
          filterByIds.push({ field: 'entities.role', term: entityRoleRedirectDetails?.id });
          break;
      }
    }

    if (filterByIds?.length) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterByIds)}`;
    }
    if (deepFilters?.length) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(deepFilters))}`;
    }

    if (filterByIds?.length || deepFilters?.length) {
      deepFilter = `${deepFilter}&filterType=and`;
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }

    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURIComponent(search)}`;
    }
    return deepFilter;
  };

  useEffect(() => {
    if (renderCount > 0) {
      const cancelTokenSource = axios.CancelToken.source();
      fetchUsers(cancelTokenSource);
      return () => cancelTokenSource.cancel();
    } else setRenderCount((preCount) => preCount + 1);
  }, [search, page, limit, filters, sorting, entityRoleRedirectDetails, showFilteredRecordsOnly]);

  const fetchLoggedInUserRole = async () => {
    let roleIds = [];
    await axiosInstance()
      .get(`/user/${user.user?._id}`)
      .then(({ data: { data } }) => {
        data.entities.map((item) => {
          item.role.forEach((role) => {
            if (roleIds.includes(role?._id)) {
            } else {
              roleIds.push(role?._id);
            }
          });
        });
        setRoleAccessOfLoggedInUser(roleIds);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const fetchLoggedInUserEntities = async () => {
    const entityIds = user.entity?.map((e) => e._id);
    setEntityAccess(entityIds);
  };

  const fetchAllUsers = () => {
    axiosInstance()
      .get(`/user`)
      .then(({ data: { data, count } }) => {
        let tempAllUsers = data.map((o) => ({ optionValue: o?._id, optionLabel: o?.concatedName }));
        setAllUsers(tempAllUsers);
      });
  };

  const fetchUsers = (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();

    axiosInstance()
      .get(`/user${queryString}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data, count } }) => {
        let rows = data.map((u) => {
          const { createdBy, updatedBy, role, entities, ...restProperties } = u;

          const [firstCompanyWideRole, ...restCompanyWideRoles] = role;
          const allRegionalWideRoles = uniqBy(entities.map((d) => d.role).flat(), '_id') as any[];

          const [firstRegionalWideRole, ...restRegionalWideRoles] = allRegionalWideRoles;

          let finalObject = prepareDataForGrid(u);
          finalObject['canDelete'] = permissions?.user?.isDelete;
          finalObject['isChecked'] = selectedRecords.some((s) => s._id === u._id);
          finalObject['email'] = u.hideEmail ? null : u?.email;
          let res = {
            ...finalObject,
            status: u.blocked ? u.blocked : false,
            isBrandAdmin: u.userType === userType.brandAdmin,
            companyWideRoleId: firstCompanyWideRole?._id ?? '',
            companyWideRole: firstCompanyWideRole?.name ?? '',
            restCompanyWideRoles: restCompanyWideRoles,
            regionalWideRoleId: firstRegionalWideRole?._id ?? '',
            regionalWideRole: firstRegionalWideRole?.name ?? '',
            restRegionalWideRoles: restRegionalWideRoles
          };
          return res;
        });

        if (userList.length === 0) {
          let tempUsers = [{ id: 'self', name: 'Self' }];
          rows.map((user: any) =>
            tempUsers.push({
              id: user.id,
              name: user.concatedName
            })
          );

          setUserList(tempUsers);
        }

        dispatch({ type: 'initialize', data: rows, count: count });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      })
      .finally(() => {
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      });

    fetchAllUsers();
  };

  const handleAssignBrandAdmin = () => {
    setShowBrandAssignConfirmation(true);
  };

  const assignBrandAdmin = async () => {
    setBrandAssigningLoading(true);
    const records = selectedRecords.map((record) => record._id);
    axiosInstance()
      .put(`/user/make-user-admin`, { users: records })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setShowBrandAssignConfirmation(false);
        setBrandAssigningLoading(false);
        fetchUsers();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setShowBrandAssignConfirmation(false);
        setBrandAssigningLoading(false);
      });
  };

  const unAssignBrandAdmin = async () => {
    setBrandUnAssigningLoading(true);
    const records = selectedRecords.map((record) => record._id);
    axiosInstance()
      .put('/user/unassign-user-admin', { users: records })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setShowBrandUnAssignConfirmation(false);
        setBrandUnAssigningLoading(false);
        fetchUsers();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setShowBrandUnAssignConfirmation(false);
        setBrandUnAssigningLoading(false);
      });
  };

  const handleDeleteUser = async () => {
    setDeleteLoading(true);
    let recs = [];
    if (deleteRec?.id) {
      recs.push(deleteRec?.id);
    } else {
      recs = selectedRecords.map((o) => o.id);
    }

    if (recs && recs.length > 0) {
      axiosInstance()
        .put(`/user/remove`, { ids: [...recs] })
        .then(({ data }) => {
          dispatch({ type: 'selection', selectedRecords: [] });
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          setIsConformDialogVisible(false);
          setDeleteLoading(false);
          if (deleteRec) setDeleteRec({});
          fetchUsers();
          setUserList([]);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setIsConformDialogVisible(false);
          setDeleteLoading(false);
        });
    }
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const handleClose = () => {
    setIsOpen({ open: false, isClone: false, idToClone: null });
  };

  const handleGlobalRolesCloseDialog = () => {
    setGlobalRolesDialogOpen(false);
  };

  const handleRegionalRolesOpenDialog = () => {
    setRegionalRolesDialogOpen(true);
  };

  const handleRegionalRolesCloseDialog = () => {
    setRegionalRolesDialogOpen(false);
  };

  const unAssignUsersFromEntity = () => {
    setIsConformDialogVisible(true);

    let recs = selectedRecords.map((o) => o.id);

    if (recs && recs.length > 0 && entityRoleRedirectDetails.id) {
      let dataObj = {
        users: recs,
        entity: entityRoleRedirectDetails.id
      };
      axiosInstance()
        .put(`/user/unassign-users`, dataObj)
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          setIsConformDialogVisible(false);
          fetchUsers();
          setUserList([]);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setIsConformDialogVisible(false);
        });
    }
  };

  const handleResetPassword = () => {
    let recs = selectedRecords.map((o) => o?.email);
    if (recs && recs.length > 0) {
      axiosInstance()
        .post(`/user/forget-passwords`, { emails: [...recs] })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleEmailVisibility = (data) => {
    let userIds = selectedRecords.map((o) => o?._id);
    if (userIds && userIds.length > 0) {
      axiosInstance()
        .post(`/user/hide-email`, { users: [...userIds], hideEmail: data })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          fetchUsers();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const isLoggedInUserBrandAdmin = 'userType' in user?.user && user?.user?.userType === userType.brandAdmin;
  const isRoleSetUpPermission = permissions?.role?.isUpdate && permissions?.entity?.isUpdate && permissions?.user?.isUpdate;
  const isUserSetupPermission = isLoggedInUserBrandAdmin || isRoleSetUpPermission;

  const leftSideContents = () => {
    return (
      <>
        {entityRoleRedirectDetails.id && (
          <Chip
            className="ml-3"
            color="primary"
            label={`${entityRoleRedirectDetails.text} : ${entityRoleRedirectDetails.name}`}
            onDelete={() => {
              setEntityRoleRedirectDetails({ id: null, name: null, type: null, text: null });
            }}
          />
        )}
      </>
    );
  };

  const actionMenuItems = () => {
    return (
      <>
        <MenuItem
          disabled={selectedRecords.every((e) => e.canDelete) ? false : true}
          onClick={() => {
            if (selectedRecords) {
              setDeleteUser(selectedRecords);
              setShowDeleteDialog(true);
            }
          }}
        >
          {`Delete (${selectedRecords?.length})`}
        </MenuItem>
        <MenuItem
          disabled={
            !(
              user?.user?.userType === userType.brandAdmin &&
              selectedRecords?.length &&
              selectedRecords.some((records) => 'userType' in records && records.userType === userType.brandAdmin)
            )
          }
          onClick={handleAssignBrandAdmin}
        >
          Assign Brand Admin
        </MenuItem>
        <MenuItem
          disabled={!(permissions?.user?.isUpdate && selectedRecords?.length)}
          onClick={() => {
            handleRegionalRolesOpenDialog();
          }}
        >
          Assign Entities - Roles
        </MenuItem>
        <MenuItem
          disabled={!(permissions?.user?.isUpdate && entityRoleRedirectDetails.id && selectedRecords?.length)}
          onClick={() => {
            unAssignUsersFromEntity();
          }}
        >
          Un-assign Entity
        </MenuItem>
        {user?.user?.userType === userType.brandAdmin && (
          <MenuItem
            onClick={() => {
              setGenerateAutoPassword(true);
            }}
          >
            Generate Password
          </MenuItem>
        )}
        <MenuItem
          disabled={!permissions?.user?.isUpdate}
          onClick={() => {
            handleResetPassword();
          }}
        >
          Reset Password
        </MenuItem>
        <MenuItem
          disabled={!checkSuperAdminAccess(user, sidebarResource.user)}
          onClick={() => {
            handleEmailVisibility(true);
          }}
        >
          Hide Email
        </MenuItem>
        <MenuItem
          disabled={!checkSuperAdminAccess(user, sidebarResource.user)}
          onClick={() => {
            handleEmailVisibility(false);
          }}
        >
          Unhide Email
        </MenuItem>
      </>
    );
  };

  return (
    <>
      {isOpen?.open && (
        <ManageUserDialog
          open={isOpen?.open}
          isClone={isOpen?.isClone}
          close={handleClose}
          onSuccess={(obj) => {
            setUserList([]);
            fetchUsers();
          }}
          userId={isOpen?.idToClone}
          dataToUpdate={null}
          isNew={isOpen?.isClone ? false : true}
          isUserSetupPermission={isUserSetupPermission}
        />
      )}
      {globalRolesDialogOpen && (
        <Dialog
          fullWidth
          TransitionComponent={CustomDialogTransition}
          maxWidth="xs"
          open={globalRolesDialogOpen}
          onClose={handleGlobalRolesCloseDialog}
          aria-labelledby="assign-roles-dialog"
        >
          <AssignRolesDialog
            rolesDialogOpen={globalRolesDialogOpen}
            handleCloseDialog={handleGlobalRolesCloseDialog}
            userIds={selectedRecords.map((d) => d._id)}
            assignedRoles={null}
            onSuccess={() => {
              handleGlobalRolesCloseDialog();
              fetchUsers();
            }}
          />
        </Dialog>
      )}
      {regionalRolesDialogOpen && (
        <Dialog
          fullScreen={isMobile || isTablet}
          fullWidth
          maxWidth="xs"
          TransitionComponent={CustomDialogTransition}
          open={regionalRolesDialogOpen}
          onClose={handleRegionalRolesCloseDialog}
          aria-labelledby="assign-roles-dialog"
        >
          <AssignEntityDialog
            entitiesDialogOpen={regionalRolesDialogOpen}
            handleCloseDialog={handleRegionalRolesCloseDialog}
            type="entity"
            ids={selectedRecords.map((d) => d._id)}
            assignedEntity={[]}
            regionalRole={false}
            onSuccess={() => {
              handleRegionalRolesCloseDialog();
              fetchUsers();
            }}
            entityAccessIds={entityAccess}
            roleAccessIds={roleAccessOfLoggedInUser}
          />
        </Dialog>
      )}

      <section className="main-container-v1">
        <div className="headerbox-v1">
          <CustomBreadCrumbs routes={[{...routes.user, title: resources?.user?.titlePlural}]} />
          <ImportExportLinks
            permissions={permissions?.user}
            module="user(s)"
            api={'/user'}
            afterImportCompleted={() => {
              fetchUsers();
              setUserList([]);
            }}
            isExportAllOrSomeFeature={true}
            total={rowCount}
            recordsToExport={selectedRecords?.length}
            ids={selectedRecords?.map((obj) => obj._id)}
            onExportToExcelSuccess={() => {
              fetchUsers();
            }}
          />
        </div>
        <CustomContainer>
          <ListingPageHeader
            leftSideContents={leftSideContents()}
            searchValue={search}
            onSearch={handleSearch}
            isActionButtonVisible
            actionButtonProps={{ disabled: selectedRecords?.length ? false : true }}
            actionMenuItems={actionMenuItems()}
            addButtonOnclick={() => {
              setIsOpen({ open: true, isClone: false, idToClone: null });
            }}
            isAddButtonVisible
            setQueryString={false}
          />

          {columns ? (
            <CustomReactTable
              height={'calc(100vh - 200px)'}
              columns={columns}
              state={state}
              dispatch={dispatch}
              renderedFrom={renderedFrom}
              refreshGrid={fetchUsers}
              showOnlyShowFilteredRecordSwitch={true}
              showFilters={true}
              resource={sidebarResource.user}
            />
          ) : (
            <Box p={2} height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </CustomContainer>

        {showDeleteWarningConfirmBox ? (
          <MessageDialog
            open={showDeleteWarningConfirmBox}
            message={`You are trying to delete records which you do not have permission to delete, Please remove those records from selection and try again.`}
            onClose={() => setShowDeleteWarningConfirmBox(false)}
          />
        ) : null}

        {isConfirmDialogVisible ? (
          <ConfirmationDialog
            open={isConfirmDialogVisible}
            message={
              unAssignLoading
                ? `Are you sure you want to un-assign user from entity ${entityRoleRedirectDetails?.name || ''}?`
                : `Are you sure you want to delete user ${deleteRec?.name || ''}?`
            }
            onClose={() => {
              if (deleteRec) setDeleteRec({});
              setIsConformDialogVisible(false);
            }}
            okBtnLoading={deleteLoading}
            onOk={unAssignLoading ? unAssignUsersFromEntity : handleDeleteUser}
          />
        ) : null}

        {showBrandAssignConfirmation && (
          <ConfirmationDialog
            open={showBrandAssignConfirmation}
            message={`Are you sure you want to assign the selected user(s) Brand Admin?`}
            onClose={() => {
              setShowBrandAssignConfirmation(false);
              fetchUsers();
            }}
            okBtnLoading={brandAssigningLoading}
            onOk={assignBrandAdmin}
          />
        )}

        {showBrandUnAssignConfirmation && (
          <ConfirmationDialog
            open={showBrandUnAssignConfirmation}
            onClose={() => {
              setShowBrandUnAssignConfirmation(false);
              fetchUsers();
            }}
            message={`Are you sure want to unassign the user from Brand Admin role`}
            okBtnLoading={brandUnAssigningLoading}
            onOk={unAssignBrandAdmin}
          />
        )}

        {showDeleteDialog ? (
          <ResourceTransferDialog
            open={true}
            fromResource={deleteUser}
            allResourceData={allUsers?.filter((user) => !deleteUser?.some?.((e) => e._id === user.optionValue))}
            onClose={() => {
              setDeleteUser([]);
              setShowDeleteDialog(false);
            }}
            handleDelete={() => {
              dispatch({ type: 'selection', selectedRecords: [] });
              setDeleteUser([]);
              setShowDeleteDialog(false);
              fetchUsers();
            }}
            resource="User"
            selectedRecords={selectedRecords}
          />
        ) : null}

        {generateAutoPassword && (
          <GenerateAutoPassword
            onClose={() => {
              setGenerateAutoPassword(false);
            }}
            ids={selectedRecords?.map((d) => d?._id)}
          />
        )}
      </section>
    </>
  );
};

export default User;
