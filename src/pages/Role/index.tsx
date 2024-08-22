import { Box, IconButton, MenuItem } from '@material-ui/core';
import { Delete as DeleteIcon } from '@material-ui/icons';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { camelCase } from 'lodash';
import { FC, useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CustomReactTable, { getStaticFields, gridFilterParser, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { cloneDisable, deleteDisable } from 'src/constants/messageHelpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import AssignRegionalRolesUserDialog from '../../components/AssignRolesDialog/AssignRegionalRolesUserDialog';
import AssignUserDialog from '../../components/AssignRolesDialog/AssignUserDialog';
import CustomContainer from '../../components/CustomContainer';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import MessageDialog from '../../components/Helpers/MessageDialog';
import { PERMISSION } from '../../constants/Roles';
import {
  ROLE_TIER,
  gridLoadingTimeout,
  isObjectEmpty,
  localStorageKeys,
  prepareDataForGrid,
  roleTypes,
  sidebarResource
} from '../../constants/helpers';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import AssignUnassignResourceDialog from './AssignUnassignResource';
import CreateRole from './CreateRole';
import axios, { CancelTokenSource } from 'axios';

const rolePermissionArray = [PERMISSION.superAdmin, PERMISSION.brandAdmin];


const Roles: FC = () => {
  const renderedFrom = camelCase(routes.role.title);
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer();
  const { page, limit, search, filters, sorting, selectedRecords } = state;

  const {
    state: { permissions, selectedEntity }
  }: any = useData();

  const [selectedType, setSelectedType] = useState(
    localStorage.getItem(localStorageKeys.currentSelectedRoleType)
      ? roleTypes.find((d) => d.key === localStorage.getItem(localStorageKeys.currentSelectedRoleType)).value
      : roleTypes.find((d) => d.key === 'Global')?.value
  );
  const [isOpen, setIsOpen] = useState({ open: false, isClone: false, idToClone: null });
  const [deleteRecord, setDeleteRecord] = useState<any>({});
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [renderCount, setRenderCount] = useState(0);
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
  const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] = useState(false);
  const [showAssignUserDialog, setShowAssignUserDialog] = useState(false);
  const [showUpdateResourceDialog, setShowUpdateResourceDialog] = useState({ open: false, action: null });

  const columns = [
    {
      accessor: 'name',
      Header: 'Name',
      minWidth: 150,
      width: 150,
      primaryField: true,
      disabled: true,
      Cell: ({ row }) => (
        <>
          {row?.original?.name ? (
            <Link title={row?.original?.name} className="text-truncate link" to={`${routes.roleDetail.path}/${row?.original?.id}`}>
              {row?.original?.name}
            </Link>
          ) : (
            <NoDataCell />
          )}
        </>
      )
    },
    {
      accessor: 'description',
      Header: 'Description',
      minWidth: 150,
      width: 150,
      Cell: ({ row }) => (
        <>
          {row?.original?.description ? (
            <h5 className="text-truncate" title={row?.original?.description}>
              {row?.original?.description}
            </h5>
          ) : (
            <NoDataCell />
          )}
        </>
      )
    },
    {
      accessor: 'tier',
      Header: 'Tier',
      minWidth: 150,
      width: 150,
      Cell: ({ row }) => (
        <>
          {row?.original?.tier ? (
            <h5 className="text-truncate" title={row?.original?.tier}>
              {row?.original?.tier}
            </h5>
          ) : (
            <NoDataCell />
          )}
        </>
      )
    },
    ...getStaticFields(),
    {
      accessor: 'action',
      Header: 'Actions',
      minWidth: 100,
      width: 110,
      sticky: 'right',
      disableFilters: true,
      disableSortBy: true,
      canDrag: false,
      Cell: ({ row }) => (
        <>
          <HtmlTooltip title={permissions?.role.isCreate ? 'Clone' : cloneDisable}>
            <span>
              <IconButton
                size="small"
                aria-label="Clone"
                disabled={!permissions?.role.isCreate}
                onClick={() => {
                  setIsOpen({ open: true, isClone: true, idToClone: row?.original?._id });
                }}
              >
                <FileCopyIcon fontSize="small" color={permissions?.role.isCreate ? 'primary' : 'disabled'} />
              </IconButton>
            </span>
          </HtmlTooltip>

          <HtmlTooltip
            title={
              permissions?.role.isDelete
                ? rolePermissionArray.indexOf(row?.original?.permission) >= 0
                  ? row?.original?.type === 'Global Role'
                    ? 'Global brand admin role can not be deleted'
                    : 'Regional brand admin role can not be deleted'
                  : 'Delete'
                : deleteDisable
            }
          >
            <span>
              <IconButton
                size="small"
                aria-label="Delete"
                disabled={!(permissions?.role.isDelete && rolePermissionArray.indexOf(row?.original?.permission) < 0)}
                onClick={() => {
                  showConfirmBox(row?.original);
                }}
              >
                <DeleteIcon
                  fontSize="small"
                  color={permissions?.role.isDelete && rolePermissionArray.indexOf(row?.original?.permission) < 0 ? 'error' : 'disabled'}
                />
              </IconButton>
            </span>
          </HtmlTooltip>
        </>
      )
    }
  ];

  useEffect(() => {
    if (renderCount > 0) {
      const cancelTokenSource = axios.CancelToken.source();
      fetchRoles(cancelTokenSource);
      return () => cancelTokenSource.cancel();
    } else setRenderCount((preCount) => preCount + 1);
  }, [search, page, limit, selectedType, filters, sorting]);

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}&type=2`;

    const { deepFilters } = gridFilterParser(filters);
    if (deepFilters?.length) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(deepFilters))}&filterType=and`;
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }

    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURIComponent(search)}`;
    }

    return deepFilter;
  };

  const fetchRoles = async (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();

    axiosInstance()
      .get(`/role/${queryString}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data, count } }) => {
        let rows = data.map((u) => {
          let finalObject = prepareDataForGrid(u);
          finalObject['canDelete'] = permissions?.role.isDelete;
          finalObject['isChecked'] = selectedRecords.some((s) => s._id === u._id);
          finalObject['allowedToEdit'] = permissions?.role.isUpdate;
          finalObject['tier'] = u?.tier ? u?.tier : ROLE_TIER.tier1;
          return {
            ...finalObject,
            type: `${u.type === roleTypes.find((d) => d.key === 'Global')?.value ? 'Global' : 'Regional'} Role`
          };
        });
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
  };

  const showConfirmBox = (row) => {
    if (row) {
      setIsConformDialogVisible(true);
      if (row && row.id) {
        setDeleteRecord(row);
      }
    } else {
      if (selectedRecords.find((d) => d.allowToDelete === false)) {
        setShowDeleteWarningConfirmBox(true);
      } else {
        setIsConformDialogVisible(true);
      }
    }
  };

  const handleDeleteRole = async () => {
    setDeleteLoading(true);
    let records = [];
    if (deleteRecord?.id) {
      records.push(deleteRecord?.id);
    } else {
      selectedRecords.forEach((obj) => {
        records.push(obj.id);
      });
    }

    if (records.length > 0) {
      axiosInstance()
        .put(`/role/remove`, { ids: [...records] })
        .then(({ data }) => {
          dispatch({ type: 'selection', selectedRecords: [] });
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          setIsConformDialogVisible(false);
          setDeleteLoading(false);
          if (deleteRecord) setDeleteRecord({});
          fetchRoles();
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

  const userDialogOpen = () => {
    setShowAssignUserDialog(true);
  };

  const userDialogClose = () => {
    setShowAssignUserDialog(false);
  };

  const updateResourceOpen = (props: any) => {
    setShowUpdateResourceDialog({ open: true, action: props.action });
  };

  return (
    <>
      {isOpen?.open && (
        <CreateRole
          open={isOpen?.open}
          close={handleClose}
          fetchData={fetchRoles}
          roleType={2}
          setToastConfig={toastConfig.setToastConfig}
          selectedEntity={selectedEntity || ''}
          roleId={isOpen?.idToClone}
          isClone={isOpen?.isClone}
        />
      )}
      {showAssignUserDialog &&
        (selectedType === roleTypes.find((d) => d.key === 'Global')?.value ? (
          <AssignUserDialog
            usersDialogOpen={showAssignUserDialog}
            handleCloseDialog={userDialogClose}
            roleIds={selectedRecords.map((d) => d._id)}
            assignedUsers={[]}
            onSuccess={() => {
              userDialogClose();
            }}
            selectedEntity={[selectedEntity] || []}
          />
        ) : (
          <AssignRegionalRolesUserDialog
            entitiesDialogOpen={showAssignUserDialog}
            handleCloseDialog={userDialogClose}
            ids={selectedRecords.map((d) => d._id)}
            assignedUsers={[]}
            onSuccess={() => {
              userDialogClose();
            }}
          />
        ))}
      {showUpdateResourceDialog && (
        <AssignUnassignResourceDialog
          showUpdateResourceDialog={showUpdateResourceDialog}
          handleCloseDialog={() => {
            setShowUpdateResourceDialog({ open: false, action: null });
          }}
          roleIds={selectedRecords.map((d) => d._id)}
          onSuccess={() => {
            setShowUpdateResourceDialog({ open: false, action: null });
            fetchRoles();
          }}
          selectedEntity={selectedEntity || ''}
          setToastConfig={toastConfig.setToastConfig}
          roleType={2}
        />
      )}
      <section className="main-container-v1">
        <div className="headerbox-v1">
          <CustomBreadCrumbs routes={[routes.role]} />
        </div>
        <CustomContainer>
          <ListingPageHeader
            searchValue={search}
            onSearch={handleSearch}
            isActionButtonVisible={true}
            actionButtonProps={{ disabled: selectedRecords?.length === 0 }}
            actionMenuItems={<ActionMenuItems {...{ selectedRecords, showConfirmBox, permissions, userDialogOpen, updateResourceOpen }} />}
            addButtonProps={{ disabled: !(permissions?.role?.isCreate && (selectedType === 1 || (selectedType === 2 && selectedEntity))) }}
            addButtonOnclick={() => {
              setIsOpen({ open: true, isClone: false, idToClone: null });
            }}
            isAddButtonVisible={true}
          />

          {columns ? (
            <CustomReactTable
              height={'calc(100vh - 200px)'}
              columns={columns}
              state={state}
              dispatch={dispatch}
              renderedFrom={renderedFrom}
              refreshGrid={fetchRoles}
              resource={sidebarResource.role}
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
            message={`Are you sure you want to delete role ${deleteRecord?.name || ''}?`}
            onClose={() => {
              setDeleteRecord(null);
              setIsConformDialogVisible(false);
            }}
            okBtnLoading={deleteLoading}
            onOk={handleDeleteRole}
          />
        ) : null}
      </section>
    </>
  );
};

export default Roles;

const ActionMenuItems = ({ selectedRecords, showConfirmBox, permissions, userDialogOpen, updateResourceOpen }) => {
  const disableDelete = selectedRecords.some((o) => rolePermissionArray.indexOf(o?.permission) >= 0);
  return (
    <>
      <MenuItem
        disabled={!(permissions.role.isDelete && Boolean(!disableDelete))}
        onClick={() => {
          showConfirmBox(null);
        }}
      >
        Delete
      </MenuItem>
      <MenuItem
        disabled={!permissions?.role?.isUpdate}
        onClick={() => {
          userDialogOpen();
        }}
      >
        Assign Users
      </MenuItem>
      <MenuItem
        disabled={
          permissions?.role?.isUpdate &&
            permissions?.role?.isDelete &&
            selectedRecords?.some((e) => e?.permission === PERMISSION.brandAdmin || [ROLE_TIER.tier2, ROLE_TIER.tier3]?.includes(e?.tier))
            ? true
            : false
        }
        onClick={() => {
          updateResourceOpen({ action: 'Assign' });
        }}
      >
        Assign Resource
      </MenuItem>
      <MenuItem
        disabled={
          permissions?.role?.isUpdate &&
            permissions?.role?.isDelete &&
            selectedRecords?.some((e) => e?.permission === PERMISSION.brandAdmin || [ROLE_TIER.tier2, ROLE_TIER.tier3]?.includes(e?.tier))
            ? true
            : false
        }
        onClick={() => {
          updateResourceOpen({ action: 'Remove' });
        }}
      >
        Remove Resource
      </MenuItem>
    </>
  );
};
