import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import ImportExportLinks from 'src/components/Helpers/ImportExportLinks';
import routes from 'src/components/Helpers/Routes';
import SearchBox from 'src/components/Helpers/SearchBox';
import styles from '../Leads/Header.module.scss';
import { Button, IconButton, Menu, MenuItem } from '@material-ui/core';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import CustomReactTable, {
  getStaticFields,
  gridFilterParser,
  useColumns,
  useTableReducer
} from 'src/components/CustomReactTableNew';
import axiosInstance from 'src/axios/axiosInstance';
import { camelCase } from 'lodash';
import { gridLoadingTimeout, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import ManageDeviceTemplates from './ManageDeviceTemplates';
import DeleteIcon from '@material-ui/icons/Delete';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import EditIcon from '@material-ui/icons/Edit';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { cloneDisable, deleteDisable, updateDisable } from 'src/constants/messageHelpers';

let searchTimeout;

export default function DeviceTemplates() {
  const renderedFrom = camelCase(routes?.deviceTemplates.title);
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { permissions, user, selectedEntity }
  }: any = useData();
  const { getColumnData } = useColumns();

  const { state, dispatch } = useTableReducer();
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;

  const [columns, setColumns] = useState(null);
  const [renderCount, setRenderCount] = useState(0);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [open, setOpen] = useState({ open: false, isClone: false, id: null });
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = () => {
    axiosInstance()
      .get('/field?resource=Device Templates')
      .then(({ data: { data } }) => {
        let columns = [];
        data.forEach((o) => {
          let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.deviceTemplatesDetail.path, true);
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
    minWidth: 100,
    width: 110,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
        <HtmlTooltip title={row?.original?.allowedToEdit ? 'Update' : updateDisable}>
          <span>
            <IconButton
              size="small"
              aria-label="Clone"
              disabled={!row?.original?.allowedToEdit}
              onClick={() => {
                setOpen({ open: true, isClone: false, id: row?.original?._id });
              }}
            >
              <EditIcon fontSize="small" color={row?.original?.allowedToEdit ? 'primary' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>

        <HtmlTooltip title={permissions?.deviceTemplates?.isCreate ? 'Clone' : cloneDisable}>
          <span>
            <IconButton
              size="small"
              aria-label="Clone"
              disabled={permissions?.deviceTemplates?.isCreate ? false : true}
              onClick={() => {
                setOpen({ open: true, isClone: true, id: row?.original?._id });
              }}
            >
              <FileCopyIcon fontSize="small" color={permissions?.deviceTemplates?.isCreate ? 'primary' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>

        <HtmlTooltip title={row?.original?.canDelete ? 'Delete' : deleteDisable}>
          <span>
            <IconButton
              size="small"
              aria-label="Delete"
              disabled={!row?.original?.canDelete}
              onClick={() => {
                setDeleteRecord(row?.original);
                setShowDeleteConfirmBox(true);
              }}
            >
              <DeleteIcon fontSize="small" color={row?.original?.canDelete ? 'error' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
      </>
    )
  };

  useEffect(() => {
    let millisec = Object.keys(search).length > 0 ? 600 : 5;
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    searchTimeout = setTimeout(() => {
      fetchData();
    }, millisec);
    // eslint-disable-next-line
  }, [search]);

  useEffect(() => {
    if (renderCount > 0) {
      fetchData();
    } else setRenderCount((preCount) => preCount + 1);
  }, [page, limit, filters, sorting, selectedEntity, showFilteredRecordsOnly]);

  const getQueryString = (isExport = false) => {
    let deepFilter = !isExport ? `?page=${page}&limit=${limit}` : '?';

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
      deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || []).map((m) => m._id))}`;
    }
    return deepFilter;
  };

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();

    axiosInstance()
      .get(`${routes.deviceTemplates.path}${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data.map((u) => {
          let finalObject: any = prepareDataForGrid(u, user);
          finalObject['canDelete'] = permissions?.deviceTemplates?.isDelete;
          finalObject['isSelected'] = selectedRecords?.some((s) => s._id === u._id);
          finalObject['allowedToEdit'] = permissions?.deviceTemplates?.isUpdate;
          return finalObject;
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

  const handleDelete = () => {
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords?.map((m) => m._id);
    }
    axiosInstance()
      .put(`${routes.deviceTemplates.path}/remove`, { ids: ids })
      .then(() => {
        dispatch({ type: 'selection', selectedRecords: [] });
        fetchData();
        setShowDeleteConfirmBox(false);
        setDeleteRecord(null);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
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
        <CustomBreadCrumbs routes={[{ title: routes.deviceTemplates.title }]} />
        <ImportExportLinks
          permissions={permissions?.warehouse}
          module={routes.warehouse.title}
          api={routes?.warehouse.path}
          afterImportCompleted={() => {
            fetchData();
          }}
          isExportAllOrSomeFeature={true}
          total={rowCount}
          recordsToExport={4}
          ids={selectedRecords?.map((obj) => obj._id)}
          onExportToExcelSuccess={() => {
            fetchData();
          }}
          additionalParams={getQueryString(true)}
          title={routes.deviceTemplates.title}
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
                  disabled={!permissions?.warehouse?.isCreate}
                  color="primary"
                  size="small"
                  className={`no-shadow`}
                  onClick={() => {
                    setOpen({ open: true, isClone: false, id: null });
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
                  disabled={selectedRecords?.length ? false : true}
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
                    disabled={selectedRecords.every((e) => e.canDelete) ? false : true}
                    onClick={() => {
                      closeActions();
                      setShowDeleteConfirmBox(true);
                    }}
                  >
                    {`Delete (${selectedRecords?.length})`}
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
            onSelect={() => {}}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            isClientSideGrid={false}
            refreshGrid={fetchData}
            showOnlyShowFilteredRecordSwitch={true}
            showFilters={true}
            resource={sidebarResource.deviceTemplates}
          />
        ) : null}
      </CustomContainer>

      {open?.open && (
        <ManageDeviceTemplates
          deviceTemplatesId={open.id}
          open={open?.open}
          onClose={() => setOpen({ open: false, isClone: false, id: null })}
          onSuccess={() => {
            setOpen({ open: false, isClone: false, id: null });
            fetchData();
          }}
          isClone={open?.isClone}
        />
      )}

      {showDeleteConfirmBox && (
        <ConfirmationDialog
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete ${routes?.deviceTemplates?.title?.toLowerCase()} ${
            deleteRecord ? (deleteRecord?._id ? deleteRecord?.templateName : '') : ''
          }?`}
          onClose={() => {
            setDeleteRecord(null);
            setShowDeleteConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
    </section>
  );
}
