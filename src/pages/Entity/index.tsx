import { Box, Dialog, IconButton, MenuItem } from '@mui/material';
import DeleteIcon from '@material-ui/icons/Delete';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { camelCase } from 'lodash';
import { FC, useContext, useEffect, useState } from 'react';
import { FaUser } from 'react-icons/fa';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { cloneDisable } from 'src/constants/messageHelpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import AssignEntityDialog from '../../components/AssignRolesDialog/AssignEntityDialog';
import CustomContainer from '../../components/CustomContainer';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import ResourceTransferDialog from '../../components/ResourceTransferDialog';
import { CustomDialogTransition, entity, gridLoadingTimeout, isObjectEmpty, prepareDataForGrid, sidebarResource } from '../../constants/helpers';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import ManageEntity from './ManageEntity';
import axios, { CancelTokenSource } from 'axios';
import { isMobile, isTablet } from 'react-device-detect';

const Entity: FC = () => {
  const renderedFrom = camelCase(sidebarResource.entity);
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { generateColumns } = useColumns();

  const {
    state: { user, permissions, resources }
  }: any = useData();

  const [isOpen, setIsOpen] = useState({ open: false, isClone: false, entityId: null });
  const [renderCount, setRenderCount] = useState(0);
  const [usersDialogOpen, setUsersDialogOpen] = useState(false);
  const [usersDialogLoding, setUsersDialogLoding] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [columns, setColumns] = useState(null);
  const [deleteEntity, setDeleteEntity] = useState<any>({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [roleAccessOfLoggedInUser, setRoleAccessOfLoggedInUser] = useState([]);

  const { entityResource, entityApi } = entity;

  useEffect(() => {
    fetchLoggedInUserRole();
  }, []);

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

  useEffect(() => {
    if (renderCount > 0) {
      const cancelTokenSource = axios.CancelToken.source();
      fetchEntity(cancelTokenSource);
      return () => cancelTokenSource.cancel();
    } else setRenderCount((preCount) => preCount + 1);
  }, [search, page, limit, filters, sorting, showFilteredRecordsOnly]);

  useEffect(() => {
    if (selectedRecords?.length === 1) {
      fetchEntityUser(selectedRecords[0].id);
    } else {
      setUsers([]);
    }
  }, [selectedRecords]);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = () => {
    axiosInstance()
      .get('/field?resource=Entity')
      .then(({ data: { data } }) => {
        const newColumns = generateColumns(renderedFrom, data, routes.entityDetail.path, true);
        setColumns([...newColumns, ...getStaticFields(), ActionsRenderer]);
      });
  };

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 130,
    width: 140,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
        <HtmlTooltip title={permissions[entityResource]?.isCreate ? 'Clone' : cloneDisable}>
          <span>
            <IconButton
              size="small"
              aria-label="Clone"
              disabled={!permissions[entityResource]?.isCreate}
              onClick={() => {
                setIsOpen({ open: true, isClone: true, entityId: row?.original?._id });
              }}
            >
              <FileCopyIcon fontSize="small" color={permissions[entityResource]?.isCreate ? 'primary' : 'inherit'} />
            </IconButton>
          </span>
        </HtmlTooltip>

        <HtmlTooltip
          title={
            permissions[entityResource]?.isUpdate && permissions?.role.isRead && permissions?.user.isRead
              ? 'Assign users'
              : `You don't have permission to update this entity`
          }
        >
          <span>
            <IconButton
              size="small"
              aria-label="Delete"
              disabled={!(permissions[entityResource]?.isUpdate && permissions?.role.isRead && permissions?.user.isRead)}
              onClick={() => {
                fetchEntityUser(row?.original?._id);
                setSelectedEntity(row?.original?._id);
                setUsersDialogOpen(true);
              }}
            >
              <FaUser className="dark:text-white" />
            </IconButton>
          </span>
        </HtmlTooltip>

        <HtmlTooltip title={!permissions[entityResource]?.isDelete ? `You do not have permission to delete entity` : 'Delete'}>
          <span>
            <IconButton
              size="small"
              aria-label="Delete"
              disabled={!permissions[entityResource]?.isDelete}
              onClick={() => {
                setDeleteEntity(row?.original);
                setShowDeleteDialog(true);
              }}
            >
              <DeleteIcon fontSize="small" color={permissions[entityResource]?.isDelete ? 'error' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
      </>
    )
  };

  const fetchEntityUser = async (entityId) => {
    setUsersDialogLoding(true);
    await axiosInstance()
      .get(`/user?filterById=[{"field": "entities.entity", "term": "${entityId}"}]`)
      .then(({ data: { data } }) => {
        setUsers(data);
        setUsersDialogLoding(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setUsersDialogLoding(false);
      });
  };

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}`;

    if (isExport) {
      deepFilter = `?`;
    }

    const { filterByIds, deepFilters } = gridFilterParser(filters);

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
    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || [])?.map((m) => m._id))}`;
    }
    return deepFilter;
  };

  const fetchEntity = (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();

    axiosInstance()
      .get(`${entityApi}${queryString}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data, count } }) => {
        let rows = data.map((u) => {
          return prepareDataForGrid(u);
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

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const handleClose = () => {
    setIsOpen({ open: false, isClone: false, entityId: null });
  };

  const handleCloseDialog = () => {
    setUsersDialogOpen(false);
  };

  const ActionMenuItems = () => {
    return (
      <>
        <MenuItem
          disabled={permissions[entityResource]?.isDelete && selectedRecords.length ? false : true}
          onClick={() => {
            if (selectedRecords[0] && selectedRecords[0]?._id) {
              setDeleteEntity(selectedRecords[0]);
              setShowDeleteDialog(true);
            }
          }}
        >
          {`Delete (${selectedRecords.length})`}
        </MenuItem>
        <MenuItem
          disabled={!(permissions[entityResource]?.isUpdate && selectedRecords?.length)}
          onClick={() => {
            setUsersDialogOpen(true);
          }}
        >
          Assign User
        </MenuItem>
      </>
    );
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ ...routes.entity, title: resources?.entity?.titlePlural }]} />
        <ImportExportLinks
          permissions={permissions[entityResource]}
          module="entity(s)"
          api={entityApi}
          afterImportCompleted={() => {
            fetchEntity();
          }}
          isExportAllOrSomeFeature={true}
          total={rowCount}
          recordsToExport={selectedRecords.length}
          ids={selectedRecords.length ? selectedRecords.map((obj) => obj._id) : []}
          onExportToExcelSuccess={() => {
            fetchEntity();
          }}
          additionalParams={getQueryString(true)}
        />
      </div>
      <CustomContainer>
        <ListingPageHeader
          searchValue={search}
          onSearch={handleSearch}
          isActionButtonVisible={true}
          actionButtonProps={{ disabled: selectedRecords?.length === 0 }}
          actionMenuItems={<ActionMenuItems />}
          addButtonProps={{ disabled: !permissions[entityResource].isCreate }}
          addButtonOnclick={() => {
            setIsOpen({ open: true, isClone: false, entityId: null });
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
            refreshGrid={fetchEntity}
            showOnlyShowFilteredRecordSwitch={true}
            showFilters={true}
            resource={sidebarResource.entity}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomContainer>

      {isOpen?.open && (
        <ManageEntity open={isOpen} close={handleClose} fetchData={fetchEntity} isNew={true} entityId={isOpen?.entityId} isClone={isOpen?.isClone} />
      )}

      {usersDialogOpen && !usersDialogLoding && (
        <Dialog
          TransitionComponent={CustomDialogTransition}
          fullScreen={isMobile || isTablet}
          fullWidth
          maxWidth="sm"
          open={usersDialogOpen}
          onClose={handleCloseDialog}
          aria-labelledby="assign-roles-dialog"
        >
          <AssignEntityDialog
            entitiesDialogOpen={usersDialogOpen}
            handleCloseDialog={handleCloseDialog}
            type="user"
            ids={selectedEntity ? [selectedEntity] : selectedRecords.map((rec) => rec._id)}
            assignedEntity={users}
            regionalRole={false}
            onSuccess={() => {
              setSelectedEntity(null);
              handleCloseDialog();
            }}
            roleAccessIds={roleAccessOfLoggedInUser}
          />
        </Dialog>
      )}

      {showDeleteDialog ? (
        <ResourceTransferDialog
          open={true}
          fromResource={{ ...deleteEntity, name: deleteEntity.entityName ?? '' }}
          allResourceData={user?.entity
            ?.filter((entity) => entity._id !== deleteEntity?._id)
            .map((e) => ({ ...e, optionLabel: e?.entityName, optionValue: e?._id }))}
          onClose={() => {
            setDeleteEntity({});
            setShowDeleteDialog(false);
          }}
          handleDelete={() => {
            setDeleteEntity({});
            setShowDeleteDialog(false);
            fetchEntity();
          }}
          resource="Entity"
          selectedRecords={selectedRecords}
        />
      ) : null}
    </section>
  );
};

export default Entity;
