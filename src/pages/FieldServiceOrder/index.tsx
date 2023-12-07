import { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import { useHistory } from 'react-router-dom';
import { IconButton, Box, Button, Menu, MenuItem } from '@material-ui/core';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import queryString from 'query-string';
import {
  gridLoadingTimeout,
  fieldServiceOrder,
  prepareDataForGrid,
  sidebarResource
} from '../../constants/helpers';
import routes from '../../components/Helpers/Routes';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import { isMobile } from 'react-device-detect';
import { camelCase } from 'lodash';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import DeleteIcon from '@material-ui/icons/Delete';
import ManageServiceOrder from './ManageServiceOrder';
import CustomReactTable, { checkStaticField, getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTableNew';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import SearchBox from 'src/components/Helpers/SearchBox';
import styles from '../Leads/Header.module.scss';
import { cloneDisable, deleteDisable } from 'src/constants/messageHelpers';

let serviceOrderTimeout;

const ServiceOrder = () => {

  const types = [
    {
      key: `My ${routes.fieldServiceOrder.title}`,
      value: 1
    },
    {
      key: `All ${routes.fieldServiceOrder.title}`,
      value: 2
    }
  ];

  const renderedFrom = camelCase(routes?.fieldServiceOrder.title);

  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();
  const { type }: any = queryString.parse(history.location.search);
  const [selectedType, setSelectedType] = useState(type ? parseInt(type) : 1);
  const [renderCount, setRenderCount] = useState(0);
  const [deleteRecord, setDeleteRecord] = useState<any>({});
  const [showManageDialog, setShowManageDialog] = useState({ open: false, isClone: false, idToClone: null });
  const { state, dispatch } = useTableReducer();

  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const [columns, setColumns] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);

  const { getColumnData } = useColumns();

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=${sidebarResource.fieldServiceOrder}`);
    data = response?.data?.data;
    let columns = [];
    data.forEach((o) => {
      let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.fieldServiceOrderDetail.path, true);
      if (currentColumn !== null) {
        columns = [...columns, currentColumn?.columnData];
      }
      return o?.fieldData;
    });
    let staticFields = getStaticFields();
    staticFields.forEach((field) => {
      columns.push(checkStaticField(renderedFrom, field));
    });
    setColumns([...columns, ActionsRenderer]);
  };

  //  Grid Variables - End
  const [locationKeys, setLocationKeys] = useState([]);
  useEffect(() => {
    return history.listen((location) => {
      const { type }: any = queryString.parse(history.location.search);
      if (history.action === 'PUSH') {
        setLocationKeys([location.key]);
      }
      if (history.action === 'POP') {
        if (locationKeys[1] === location.key) {
          setLocationKeys(([_, ...keys]) => keys);
          // Handle forward event
          setSelectedType(type ? parseInt(type) : 1);
        } else {
          setLocationKeys((keys) => [location.key, ...keys]);
          // Handle back event
          setSelectedType(type ? parseInt(type) : 1);
        }
      }
    });
  }, [locationKeys]);

  useEffect(() => {
    let millisec = Object.keys(search).length > 0 ? 600 : 5;
    if (serviceOrderTimeout) {
      clearTimeout(serviceOrderTimeout);
    }
    serviceOrderTimeout = setTimeout(() => {
      fetchData();
    }, millisec);
  }, [search]);

  useEffect(() => {
    if (renderCount > 0) {
      fetchData();
    } else setRenderCount((preCount) => preCount + 1);
  }, [page, limit, selectedType, filters, sorting, selectedEntity, showFilteredRecordsOnly]);

  const handleDelete = async () => {
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords.map((d) => d._id);
    }
    axiosInstance()
      .put(`${fieldServiceOrder.api}/remove`, {
        ids
      })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        dispatch({ type: 'selection', selectedRecords: [] });
        fetchData();
        setShowDeleteConfirmBox(false);
        setDeleteRecord(null);
        setAnchorEl(null);
      })
      .catch((error) => {
        dispatch({ type: 'loading', loading: false });
        toastConfig.setToastConfig(error);
      });
  };

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 100,
    width: 100,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
        <HtmlTooltip title={permissions?.fieldServiceOrder?.isCreate ? "Clone" : cloneDisable}  >
          <span>
            <IconButton
              size="small"
              aria-label="Clone"
              disabled={permissions?.fieldServiceOrder?.isCreate ? false : true}
              onClick={() => {
                setShowManageDialog({ open: true, isClone: true, idToClone: row?.original._id });
              }}
            >
              <FileCopyIcon fontSize="small" color={permissions?.fieldServiceOrder?.isCreate ? 'primary' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
        <HtmlTooltip title={row?.original?.canDelete ? "Delete" : deleteDisable}>
          <span>
            <IconButton
              size="small"
              aria-label="Delete"
              disabled={row?.original?.canDelete ? false : true}
              onClick={() => {
                setDeleteRecord(row.original);
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

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}`;

    if (isExport) {
      deepFilter = `?`;
    }

    if (selectedType === 1) {
      deepFilter = deepFilter + `&myRecords=1`;
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

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    axiosInstance()
      .get(`${fieldServiceOrder.api}${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data?.map((u) => {
          let finalObject: any = prepareDataForGrid(u);
          finalObject['isChecked'] = selectedRecords.some((s) => s._id === u._id);
          finalObject['canDelete'] = permissions?.fieldServiceOrder?.isDelete && finalObject?.ownerId === user?.user?._id && u?.canDelete;
          return finalObject;
        });
        dispatch({ type: 'initialize', data: rows, count: count });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const onTypeChange = (event, type) => {
    dispatch({ type: 'pageChange', page: 0 });
    const value = types.find((d) => d.key === type).value;
    setSelectedType(value);
    history.push(`?type=${value}`);
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
        <CustomBreadCrumbs routes={[routes.fieldServiceOrder]} />
        <ImportExportLinks
          permissions={permissions?.fieldServiceOrder}
          module="fieldServiceOrder"
          api={fieldServiceOrder.api}
          afterImportCompleted={() => {
            fetchData();
          }}
          isExportAllOrSomeFeature={true}
          total={rowCount}
          recordsToExport={selectedRecords?.length}
          ids={selectedRecords?.map((obj) => obj._id)}
          onExportToExcelSuccess={() => {
            fetchData();
          }}
          additionalParams={getQueryString(true)}
        />
      </div>
      <div className="main-container">
        <div className="header-panel">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            <div className={'d-flex flex-wrap align-items-center gap-2'}>
              <div className={`flex flex-wrap items-center gap-2 `}>
                {types && (
                  <ToggleButtonGroup
                    size="small"
                    className="ml-2"
                    value={types[selectedType - 1].key}
                    exclusive
                    onChange={onTypeChange}
                  >
                    {types.map((k, index) => {
                      return (
                        <ToggleButton value={k.key} key={index}>
                          {k.key}
                        </ToggleButton>
                      );
                    })}
                  </ToggleButtonGroup>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-[8px]  justify-end">
              <SearchBox
                onChange={handleSearch}
                className={isMobile ? styles.search_box_input : ''}
                width="242px"
                size="small"
                value={search}
                style={isMobile ? { flex: 1 } : {}}
              />
              <div className="flex gap-[8px] flex-wrap items-center">
                {permissions?.fieldServiceOrder?.isCreate && (
                  <Button
                    onClick={() => {
                      setShowManageDialog({ open: true, isClone: false, idToClone: null });
                    }}
                    variant={'contained'}
                    size="small"
                    color="primary"
                    className={`no-shadow`}
                    startIcon={<AddOutlined />}
                  >
                    Add
                  </Button>
                )}
                <Button
                  variant={'outlined'}
                  color="default"
                  size="small"
                  onClick={openActions}
                  disabled={selectedRecords.length ? false : true}
                  aria-controls="action-menu"
                  className={`new-dropdown-v1`}
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
                  <MenuItem
                    disabled={selectedRecords.every((e) => e.canDelete) ? false : true}
                    onClick={() => {
                      closeActions();
                      setShowDeleteConfirmBox(true);
                    }}
                  >
                    {`Delete (${selectedRecords.length})`}
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
            refreshGrid={fetchData}
            showOnlyShowFilteredRecordSwitch={true}
            showFilters={true}
            resource={sidebarResource.fieldServiceOrder}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}

        {showDeleteConfirmBox && (
          <ConfirmationDialog
            open={showDeleteConfirmBox}
            message={`Are you sure you want to delete the ${routes?.fieldServiceOrder.title?.toLowerCase()}${selectedRecords.length ? "s" : ""} ${deleteRecord?.fieldServiceOrderNumber || ''} ? `}
            onClose={() => {
              setDeleteRecord(null);
              setShowDeleteConfirmBox(false);
            }}
            onOk={handleDelete}
          />
        )}
      </div>
      {
        showManageDialog.open && (
          <ManageServiceOrder
            isClone={showManageDialog.isClone}
            serviceOrderId={showManageDialog.idToClone}
            onClose={() => setShowManageDialog({ open: false, isClone: false, idToClone: null })}
            onSuccess={(data) => {
              history.push(`${routes.fieldServiceOrderDetail.path}/${data._id}`);
              setShowManageDialog({ open: false, isClone: false, idToClone: null });
            }}
            open={showManageDialog.open}
          />
        )
      }
    </section >
  );
};

export default ServiceOrder;
