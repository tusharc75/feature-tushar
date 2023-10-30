import { Button, IconButton, Menu, MenuItem } from '@material-ui/core';
import { ExpandMore } from '@material-ui/icons';
import DeleteIcon from '@material-ui/icons/Delete';
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import { camelCase } from 'lodash';
import queryString from 'query-string';
import { useContext, useEffect, useReducer, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { MdOutlineFilterAlt } from 'react-icons/md';
import { TbArrowsSort } from 'react-icons/tb';
import { useHistory } from 'react-router-dom';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import HideWhenOffline from 'src/components/HideWhenOffline';
import MobileFilterDialog, { DisplayFiltersForMobile } from 'src/components/MobileFilterDialog';
import MobileSortDialog from 'src/components/MobileSortDialog';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomAgGrid, { intialState, reducer } from '../../components/AgGridComponents/CustomAgGrid';
import CustomContainer from '../../components/CustomContainer';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import MessageDialog from '../../components/Helpers/MessageDialog';
import SearchBox from '../../components/Helpers/SearchBox';
import CustomSwipableList from '../../components/SwipableListComponents/CustomSwipableList';
import {
  getLocalStorageArrayData,
  gridLoadingTimeout,
  prepareDataForGrid,
  removeLocalStorage,
  sidebarResource,
  workOrder
} from '../../constants/helpers';
import useColumns, { getFrameworkComponents, getStaticFields, gridFilterParser } from '../../constants/useColumns';
import styles from '../Leads/Header.module.scss';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import ManageWorkOrder from './ManageWorkOrder';

let workOrderTimeout;

const WorkOrder = () => {
  const WorkOrderType = [
    {
      key: `My ${routes.workOrder.title}`,
      value: 1
    },
    {
      key: `All ${routes.workOrder.title}`,
      value: 2
    }
  ];

  let renderedFrom = camelCase(routes?.workOrder.title);

  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const { type }: any = queryString.parse(history.location.search);
  const [selectedType, setSelectedType] = useState(type ? parseInt(type) : 1);
  const [filter, setFilter] = useState(`All ${routes.workOrder.title}`);
  const {
    state: { user, selectedEntity, permissions }
  }: any = useData();
  const { getColumnData } = useColumns();
  const [renderCount, setRenderCount] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState<any>({});

  const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] = useState(false);
  const [showManageWorkOrder, setShowManageWorkOrder] = useState({ open: false, isClone: false, idToClone: null });
  const [columns, setColumns] = useState([]);
  const [frameWorkComponent, setFrameWorkComponent] = useState({});

  //  Grid Variables - Start
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows, showFilteredRecordsOnly } =
    state;

  const localStorageSelectedRecords = `${renderedFrom}_selected`;
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=${sidebarResource['workOrder']}&view=true`);
    data = response?.data?.data;
    let columns = [];
    let rendererNames = [];
    data.forEach((o) => {
      let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.workOrderDetail.path, true);
      if (currentColumn !== null) {
        columns = [...columns, currentColumn?.columnData];
        if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
          rendererNames.push(currentColumn?.rendererName);
        }
      }
      return o?.fieldData;
    });
    let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
    tempFrameworkComponent = {
      ...tempFrameworkComponent,
      actionsRenderer: ActionsRenderer
    };
    setFrameWorkComponent({ ...tempFrameworkComponent });
    columns = [...columns, ...getStaticFields()];
    setColumns([...columns]);
  };

  const fetchWorkOrder = async () => {
    try {
      dispatch({ type: 'loading', loading: true });
      if (gridApi) {
        gridApi.setRowData([]);
      }
      let data: any = [],
        count;
      const queryString = getQueryString();
      const response: any = await axiosInstance().get(`${workOrder.api}${queryString}`);
      data = response?.data?.data;
      count = response?.data?.count;
      let rows = data.map((u) => {
        let res = {
          ...prepareDataForGrid(u, user)
        };
        res['isChecked'] = false;
        res['canDelete'] = permissions?.workOrder?.isDelete && u?.canDelete;
        return res;
      });
      if (appendRows) {
        dispatch({ type: 'initialize', data: [...dataRows, ...rows], count: count });
      } else {
        dispatch({ type: 'initialize', data: rows, count: count });
      }
      setTimeout(() => {
        dispatch({ type: 'loading', loading: false });
      }, gridLoadingTimeout);
    } catch (error) {
      dispatch({ type: 'loading', loading: false });
      toastConfig.setToastConfig(error);
    }
  };

  useEffect(() => {
    let millisec = Object.keys(search).length > 0 ? 600 : 5;
    if (workOrderTimeout) {
      clearTimeout(workOrderTimeout);
    }
    workOrderTimeout = setTimeout(() => {
      fetchWorkOrder();
    }, millisec);
  }, [search]);

  useEffect(() => {
    if (renderCount > 0) {
      fetchWorkOrder();
    } else setRenderCount((preCount) => preCount + 1);
  }, [page, limit, filters, sorting, selectedType, selectedEntity, showFilteredRecordsOnly]);

  const ActionsRenderer = (params) => (
    <>
      {/* {permissions?.workOrder?.isCreate ? (
        <Tooltip title="Clone">
          <IconButton
            size="small"
            aria-label="Clone"
            onClick={() => {
              setShowManageWorkOrder({ open: true, isClone: true, idToClone: params.data._id })
            }}
          >
            <FileCopyIcon fontSize="small" color="primary" />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip className="cursor-stop" title="You do not have permission to clone/create an work order">
          <IconButton aria-label="Clone" size="small">
            <FileCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )} */}

      {params?.data?.canDelete && !params?.data?.deleted ? (
        <HtmlTooltip title="Delete">
          <IconButton
            size="small"
            aria-label="Delete"
            onClick={() => {
              setDeleteRecord(params.data);
              setIsConformDialogVisible(true);
            }}
          >
            <DeleteIcon color="error" />
          </IconButton>
        </HtmlTooltip>
      ) : (
        <HtmlTooltip className="cursor-stop" title={`You do not have permission to delete `}>
          <IconButton aria-label="Delete" size="small">
            <DeleteIcon />
          </IconButton>
        </HtmlTooltip>
      )}
    </>
  );

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
      const savedRecords = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : [];
      deepFilter = `${deepFilter}&getById=${JSON.stringify(savedRecords.map((m) => m._id))}`;
    }
    return deepFilter;
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const handleWorkOrderTypeSel = (filterValues) => {
    dispatch({ type: 'setPage', page: 0 });
    setSelectedType(filterValues);
    history.push(`?type=${filterValues}`);
  };

  const handleFilter = (event, newFilter) => {
    if (newFilter != null) {
      setFilter(newFilter);
      handleWorkOrderTypeSel(WorkOrderType.find((d) => d.key === newFilter).value);
    }
  };

  const handleDeleteWorkOrder = async () => {
    setDeleteLoading(true);
    let recordsToDelete = [];
    if (deleteRecord?._id) {
      recordsToDelete.push(deleteRecord?._id);
    } else {
      recordsToDelete = getLocalStorageArrayData(localStorageSelectedRecords)?.map((o) => o._id);
    }
    if (recordsToDelete.length > 0) {
      axiosInstance()
        .put(`${workOrder.api}/remove`, {
          ids: recordsToDelete
        })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          removeLocalStorage(localStorageSelectedRecords);
          setIsConformDialogVisible(false);
          setDeleteLoading(false);
          if (deleteRecord) setDeleteRecord({});
          fetchWorkOrder();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setIsConformDialogVisible(false);
          setDeleteLoading(false);
        });
    }
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };
  const [isOpenDialog, setisOpenDialog] = useState(false);

  const handleOpen = () => {
    setisOpenDialog(true);
  };

  const handleClose = () => {
    setisOpenDialog(false);
  };

  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClickClose = () => {
    setOpen(false);
  };
  let toggleInner = WorkOrderType && (
    <ToggleButtonGroup size="small" className=" toggle-button-layout" value={filter} exclusive onChange={handleFilter}>
      {WorkOrderType.map((k, index) => {
        return (
          <ToggleButton value={k.key} key={index}>
            {k.key}
          </ToggleButton>
        );
      })}
    </ToggleButtonGroup>
  );

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[routes.workOrder]} />
        <ImportExportLinks
          permissions={permissions?.workOrder}
          module="workOrder"
          api={workOrder.api}
          afterImportCompleted={fetchWorkOrder}
          total={rowCount}
          isExportAllOrSomeFeature={true}
          recordsToExport={getLocalStorageArrayData(localStorageSelectedRecords)?.length}
          ids={
            getLocalStorageArrayData(localStorageSelectedRecords)?.length
              ? getLocalStorageArrayData(localStorageSelectedRecords)?.map((obj) => obj._id)
              : []
          }
          onExportToExcelSuccess={() => {
            if (gridApi) {
              gridApi.deselectAll();
            } else {
              fetchWorkOrder();
            }
          }}
          additionalParams={getQueryString(true)}
        />
      </div>
      <CustomContainer>
        <div className="header-panel">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={'d-flex align-items-center gap-1'}>
              <HideWhenOffline>
                {isMobile && !isTablet && (
                  <>
                    <div className="d-flex flex-wrap items-center justify-between w-full">
                      <div>{toggleInner}</div>
                      <div className="flex flex-wrap items-center gap-1">
                        <IconButton
                          onClick={handleClickOpen}
                          id="demo-customized-button"
                          aria-controls="demo-customized-menu"
                          aria-haspopup="true"
                          aria-expanded={open ? 'true' : undefined}
                          size="small"
                          className={'mobileIconButton secondary'}
                        >
                          <TbArrowsSort className="rotate-90" size={16} />
                        </IconButton>

                        <MobileSortDialog
                          isOpen={open}
                          handleClose={handleClickClose}
                          contentPart={toggleInner}
                          secHeading={['Sort Repair Order']}
                          columns={columns}
                          dispatch={dispatch}
                        />

                        <IconButton
                          onClick={handleOpen}
                          id="demo-customized-button"
                          aria-controls="demo-customized-menu"
                          aria-haspopup="true"
                          aria-expanded={open ? 'true' : undefined}
                          size="small"
                          className={'mobileIconButton secondary'}
                        >
                          <MdOutlineFilterAlt size={16} />
                        </IconButton>
                        <MobileFilterDialog
                          isOpen={isOpenDialog}
                          handleClose={handleClose}
                          contentPart={null}
                          columns={columns}
                          dispatch={dispatch}
                          title={routes?.repairOrder?.title}
                          filters={filters}
                          resource={sidebarResource.workOrder}
                        />
                      </div>
                    </div>
                  </>
                )}
                <div className={`align-items-center gap-1 layout-for-mobile `}>
                  {WorkOrderType && (
                    <ToggleButtonGroup size="small" className="ml-2" value={WorkOrderType[selectedType - 1].key} exclusive onChange={handleFilter}>
                      {WorkOrderType.map((k, index) => {
                        return (
                          <ToggleButton value={k.key} key={index}>
                            {k.key}
                          </ToggleButton>
                        );
                      })}
                    </ToggleButtonGroup>
                  )}
                </div>
              </HideWhenOffline>
            </div>
            <div className="flex flex-wrap gap-[8px]  justify-end">
              <SearchBox onChange={handleSearch} className={isMobile ? styles.search_box_input : ''} size="small" value={search} />
              <div className="flex gap-[8px] flex-wrap items-center">
                {permissions?.workOrder?.isDelete && (
                  <Button
                    className={` new-dropdown-v1`}
                    variant="outlined"
                    color="default"
                    size="small"
                    onClick={openActions}
                    disabled={getLocalStorageArrayData(localStorageSelectedRecords)?.length ? false : true}
                    aria-controls="action-menu"
                    endIcon={<ExpandMore />}
                  >
                    Actions
                  </Button>
                )}
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
                      permissions?.workOrder?.isDelete && selectedRecords?.filter((e) => !e.deleted)?.length === selectedRecords?.length
                        ? false
                        : true
                    }
                    onClick={() => {
                      if (selectedRecords.find((d) => d.canDelete === false)) {
                        setShowDeleteWarningConfirmBox(true);
                      } else {
                        setIsConformDialogVisible(true);
                      }
                      closeActions();
                    }}
                  >
                    Delete
                  </MenuItem>
                </Menu>
              </div>
            </div>
            <DisplayFiltersForMobile resource={sidebarResource.workOrder} />
          </div>
        </div>
        {isMobile && !isTablet ? (
          <CustomSwipableList
            key={selectedType}
            allowSelection={true}
            allowSwipe={true}
            permissions={permissions.workOrder}
            primaryField={columns?.find((d) => d.primaryField)}
            onClick={(data) => {
              history.push(`${routes.workOrderDetail.path}/${data._id}`);
            }}
            dataRows={dataRows}
            selectedRecords={getLocalStorageArrayData(localStorageSelectedRecords)}
            dispatch={dispatch}
            onEdit={() => {}}
            extraParamsToCheckDelete={true}
            onDelete={() => {}}
            rowCount={rowCount}
            page={page}
            loading={loading}
            chips={[
              {
                label: 'Status: ',
                field: 'status'
              }
            ]}
            onCreate={null}
            showClone={false}
            onClone={() => {}}
            renderedFrom={renderedFrom}
            backgroundColorClass={(d) => (d.deleted ? 'red-data-row' : '')}
            actionCol={(data) => {
              const params = { data };
              return <ActionsRenderer {...params} />;
            }}
          />
        ) : Object.keys(frameWorkComponent).length > 0 ? (
          <CustomAgGrid
            columns={columns}
            dataRows={dataRows}
            frameworkComponents={frameWorkComponent}
            setGridApi={setGridApi}
            dispatch={dispatch}
            rowCount={rowCount}
            limit={limit}
            pageSizes={pageSizes}
            page={page}
            actionWidth={100}
            loading={loading}
            allowSelection={true}
            allowAction={true}
            renderedFrom={renderedFrom}
            refreshGrid={fetchWorkOrder}
            showOnlyShowFilteredRecordSwitch={true}
            rowClassRules={{
              'red-data-row': function (params) {
                return params.data.deleted;
              }
            }}
            showFilters={true}
            resource={sidebarResource.workOrder}
          />
        ) : null}
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
            message={`Are you sure you want to delete ${deleteRecord?.workOrderName ? ' Work Order' : routes.workOrder.title}   ${
              deleteRecord?.workOrderName || ''
            }?`}
            onClose={() => {
              setDeleteRecord(null);
              setIsConformDialogVisible(false);
            }}
            okBtnLoading={deleteLoading}
            onOk={handleDeleteWorkOrder}
          />
        ) : null}
        {showManageWorkOrder.open ? (
          <ManageWorkOrder
            isClone={showManageWorkOrder.isClone}
            workOrderId={showManageWorkOrder.idToClone}
            onClose={() => setShowManageWorkOrder({ open: false, isClone: false, idToClone: null })}
            onSuccess={() => {
              fetchWorkOrder();
              setShowManageWorkOrder({ open: false, isClone: false, idToClone: null });
            }}
          />
        ) : null}
      </CustomContainer>
    </section>
  );
};

export default WorkOrder;
