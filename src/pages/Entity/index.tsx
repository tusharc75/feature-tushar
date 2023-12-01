import { Box, Button, Dialog, IconButton, Menu, MenuItem, Tooltip } from '@material-ui/core';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import DeleteIcon from '@material-ui/icons/Delete';
import { camelCase } from 'lodash';
import { FC, useContext, useEffect, useState } from 'react';
import { FaUser } from 'react-icons/all';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomReactTable, { getStaticFields, useColumns, useTableReducer } from 'src/components/CustomReactTableNew';
import AssignEntityDialog from '../../components/AssignRolesDialog/AssignEntityDialog';
import CustomContainer from '../../components/CustomContainer';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import ResourceTransferDialog from '../../components/ResourceTransferDialog';
import { entity, gridLoadingTimeout, isObjectEmpty, prepareDataForGrid, sidebarResource } from '../../constants/helpers';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import ManageEntity from './ManageEntity';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { cloneDisable } from 'src/constants/messageHelpers';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import styles from '../Leads/Header.module.scss';
import SearchBox from 'src/components/Helpers/SearchBox';
import { AddOutlined, ExpandMore } from '@material-ui/icons';

let searchTimeout;

const Entity: FC = () => {
  const renderedFrom = camelCase(routes?.entity.title);
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer();
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { getColumnData } = useColumns();

  const {
    state: { user, permissions }
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
  const [anchorEl, setAnchorEl] = useState(null);

  const { entityResource, entityApi } = entity;

  useEffect(() => {
    let millisec = Object.keys(search).length > 0 ? 600 : 5;
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    searchTimeout = setTimeout(() => {
      fetchEntity();
    }, millisec);
  }, [search]);

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
      fetchEntity();
    } else setRenderCount((preCount) => preCount + 1);
  }, [page, limit, filters, sorting, showFilteredRecordsOnly]);

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
        let columns = [];
        data.forEach((o) => {
          let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.entityDetail.path, true);

          if (currentColumn !== null) {
            columns = [...columns, currentColumn?.columnData];
          }
        });
        columns = [...columns, ...getStaticFields(), ActionsRenderer];
        setColumns(columns);
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

        <HtmlTooltip
          title={
            !permissions[entityResource]?.isDelete
              ? `You do not have permission to delete entity`
              : row?.original?.createdById === user?.user?._id
              ? 'Delete'
              : `You must be the owner of this entity to get the delete functionality`
          }
        >
          <span>
            <IconButton
              size="small"
              aria-label="Delete"
              disabled={!(permissions[entityResource]?.isDelete && row?.original?.createdById === user?.user?._id)}
              onClick={() => {
                setDeleteEntity(row?.original);
                setShowDeleteDialog(true);
              }}
            >
              <DeleteIcon
                fontSize="small"
                color={permissions[entityResource]?.isDelete && row?.original?.createdById === user?.user?._id ? 'error' : 'disabled'}
              />
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

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}`;

    if (!isObjectEmpty(filters)) {
      const updatedFilters = [];

      Object.keys(filters).forEach((field) => {
        updatedFilters.push({
          field: field,
          term: filters[field].filter
        });
      });
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(updatedFilters))}&filterType=and`;
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }

    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURIComponent(search)}`;
    }
    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || []).map((m) => m._id))}`;
    }
    return deepFilter;
  };

  const fetchEntity = () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();

    axiosInstance()
      .get(`${entityApi}${queryString}`)
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

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[routes.entity]} />
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
        />
      </div>

      <CustomContainer>
        <div className="header-panel">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={'flex justify-between align-items-center gap-1 w-full'}></div>
            <div className="flex flex-wrap gap-[8px] justify-end">
              <SearchBox onChange={handleSearch} className={styles.search_box_input} value={search} size="small" />
              <div className="flex gap-[8px] flex-wrap items-center">
                <Button
                  variant={'contained'}
                  color="primary"
                  size="small"
                  className={`no-shadow`}
                  disabled={!permissions[entityResource].isCreate}
                  onClick={() => {
                    setIsOpen({ open: true, isClone: false, entityId: null });
                  }}
                  startIcon={<AddOutlined />}
                >
                  Add
                </Button>
                <Button
                  variant={'outlined'}
                  color="default"
                  size="small"
                  onClick={openActions}
                  className={`new-dropdown-v1`}
                  aria-controls="action-menu"
                  endIcon={<ExpandMore />}
                  disabled={selectedRecords?.length === 0}
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
                  <MenuItem
                    disabled={
                      permissions[entityResource]?.isDelete && selectedRecords.length > 1
                        ? true
                        : Boolean(!(selectedRecords[0] && selectedRecords[0].createdById === user?.user?._id))
                        ? true
                        : false
                    }
                    onClick={() => {
                      if (selectedRecords[0] && selectedRecords[0]?._id) {
                        setDeleteEntity(selectedRecords[0]);
                        setShowDeleteDialog(true);
                      }
                      closeActions();
                    }}
                  >
                    Delete
                  </MenuItem>
                  <MenuItem
                    disabled={!(permissions[entityResource]?.isUpdate && selectedRecords?.length)}
                    onClick={() => {
                      setUsersDialogOpen(true);
                      closeActions();
                    }}
                  >
                    Assign User
                  </MenuItem>
                </Menu>
              </div>
            </div>
          </div>
        </div>

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
        <Dialog fullWidth maxWidth="sm" open={usersDialogOpen} onClose={handleCloseDialog} aria-labelledby="assign-roles-dialog">
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
