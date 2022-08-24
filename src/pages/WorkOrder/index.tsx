import { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';
import { useHistory } from 'react-router-dom';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import MessageDialog from '../../components/Helpers/MessageDialog';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import { isObjectEmpty, gridLoadingTimeout, workOrder, getLocalStorageArrayData } from '../../constants/helpers';
import CustomContainer from '../../components/CustomContainer';
import GridDeleteIcon from '../../components/Helpers/GridDeleteIcon';
import CustomAgGrid, { reducer, intialState } from '../../components/AgGridComponents/CustomAgGrid';
import styles from '../Leads/Header.module.scss';
import { GiAbstract055 } from 'react-icons/gi';
import SearchBox from '../../components/Helpers/SearchBox';
import ManageWorkOrder from './ManageWorkOrder';
import { sidebarResource, prepareDataForGrid } from '../../constants/helpers';
import useColumns, { getStaticFields, getFrameworkComponents } from '../../constants/useColumns';
import { isMobile, isTablet } from 'react-device-detect';
import CustomSwipableList from '../../components/SwipableListComponents/CustomSwipableList';
import { CustomOfflineContext } from "../../StateProvider/OfflineContext/OfflineContext";
import { objectStore, findOne, findAll } from '../../constants/indexdbhelper';
import { camelCase } from 'lodash';
import queryString from 'query-string';
import HideWhenOffline from 'src/components/HideWhenOffline';
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import { Button, IconButton, Menu, MenuItem, Tooltip } from '@material-ui/core';
import { ExpandMore } from '@material-ui/icons';
import { AddOutlined } from '@material-ui/icons';
import FileCopyIcon from '@material-ui/icons/FileCopy';

let workOrderTimeout;

const WorkOrder = () => {
  const WorkOrderType = [
    {
      key: `All ${routes.workOrder.title}`,
      value: 1,
    },
    {
      key: `My ${routes.workOrder.title}`,
      value: 2,
    },
  ];
  let renderedFrom = camelCase(routes?.workOrder.title)
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const { type }: any = queryString.parse(history.location.search);
  const [selectedType, setSelectedType] = useState(type ? parseInt(type) : 1);
  const [filter, setFilter] = useState(`All ${routes.workOrder.title}`);
  const { state: { user, selectedEntity, permissions } }: any = useData();
  const { getColumnData } = useColumns();
  const [renderCount, setRenderCount] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState<any>({});
  const [workOrderPermissions, setworkOrderPermissions] = useState({
    isCreate: permissions?.workOrder?.isCreate,
    isUpdate: permissions?.workOrder?.isUpdate,
    isRead: permissions?.workOrder?.isRead,
    isDelete: permissions?.workOrder?.isDelete
  });

  const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] = useState(false);
  const [showManageWorkOrder, setShowManageWorkOrder] = useState({ open: false, isClone: false, idToClone: null });
  const [columns, setColumns] = useState([]);
  const [frameWorkComponent, setFrameWorkComponent] = useState({});

  //  Grid Variables - Start
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows, showFilteredRecordsOnly } = state;
  const { isOffline } = useContext(CustomOfflineContext);
  const localStorageSelectedRecords = `${renderedFrom}_selected`
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = async () => {
    let data;
    if (isOffline) {
      data = await findOne(objectStore.resource, objectStore.workOrder)
    }
    else {
      const response = await axiosInstance().get(`/field?resource=${sidebarResource['workOrder']}&view=true`)
      data = response?.data?.data
    }
    let columns = [];
    let rendererNames = [];
    data.forEach((o) => {
      let currentColumn = getColumnData(renderedFrom, o?.fieldData, `${routes.workOrder.path}/detail`);
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
      let data: any = [], count;
      if (!isOffline) {
        const queryString = getQueryString();
        const response: any = await axiosInstance().get(`${workOrder.api}${queryString}`);
        data = response?.data?.data;
        count = response?.data?.count;
      }
      else {
        data = await findAll(objectStore.workOrder);
        count = data?.length || 0;
      }
      let rows = data.map((u) => {
        let res = {
          ...prepareDataForGrid(u, user)
        };
        res["isChecked"] = false;
        return res;
      });
      if (appendRows) {
        dispatch({ type: 'initialize', data: [...dataRows, ...rows], count: count });
      } else {
        dispatch({ type: 'initialize', data: rows, count: count });
      }
      setTimeout(() => { dispatch({ type: 'loading', loading: false }); }, gridLoadingTimeout);
    }
    catch (error) {
      dispatch({ type: 'loading', loading: false });
      toastConfig.setToastConfig(error);
    }
  };

  useEffect(() => {
    if (permissions && permissions.workOrder) {
      setworkOrderPermissions(permissions.workOrder);
    }
    return () => {
      setworkOrderPermissions(null);
    };
  }, [permissions]);

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
  }, [page, limit, filters, sorting, isOffline, selectedType, showFilteredRecordsOnly]);

  const ActionsRenderer = (params) => (
    <>
      {workOrderPermissions?.isCreate ? (
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
        <Tooltip className="cursor-stop" title="You do not have permission to clone/create an account">
          <IconButton aria-label="Clone" size="small">
            <FileCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      <GridDeleteIcon
        hasDeletePermission={workOrderPermissions?.isDelete }
        ownerId={params.data.ownerId}
        userId={user?.user?._id}
        onDelete={() => {
          setDeleteRecord(params.data);
          setIsConformDialogVisible(true);
        }}
        entity="Work Order"
      />
    </>
  );

  const replaceFieldName = (field) => {
    switch (field) {
      case 'createdBy':
        return 'createdBy.user.concatedName';
      case 'updatedBy':
        return 'updatedBy.user.concatedName';
      default:
        return field;
    }
  };

  const replaceFieldNameForSorting = (field) => {
    const updatedField = replaceFieldName(field);
    if (field !== updatedField) return updatedField;
    switch (field) {
      case 'customerAccount':
        return 'customerAccount.optionLabel';
      default:
        return field;
    }
  };

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}&filterWorkOrders=${selectedType}`;
    if (isExport) {
      deepFilter = `filterWorkOrders=${selectedType}`;
    }

    if (!isObjectEmpty(filters)) {
      const updatedFilters = [];
      Object.keys(filters).forEach((field) => {
        updatedFilters.push({
          field: replaceFieldName(field),
          term: filters[field].filter
        });
      });
      deepFilter = `${deepFilter}&deepFilter=${encodeURI(JSON.stringify(updatedFilters))}&filterType=and`;
    }
    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${replaceFieldNameForSorting(sorting[0].colId)}&orderBy=${sorting[0].sort}`;
    }
    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURI(search)}`;
    }
    if (showFilteredRecordsOnly) {
      const savedRecords = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : [];
      deepFilter = `${deepFilter}&getById=${JSON.stringify(savedRecords.map(m => m._id))}`;
    }
    return deepFilter;
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const handleWorkOrderTypeSel = (filterValues) => {
    setSelectedType(filterValues);
    history.push(`?type=${filterValues}`)
  }

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
      recordsToDelete = selectedRecords.map((o) => o._id);
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


  return (
    <>
      <Fragment>
        <Grid container className="headerbox">
          <Grid item md={4} sm={11} xs={10}>
            <CustomBreadCrumbs routes={[routes.workOrder]} />
          </Grid>
          <Grid item md={8} sm={1} xs={2}>
            <Grid container direction="row">
              <Grid item xs={12} sm={12}>
                <Grid container justify="flex-end">
                  <ImportExportLinks
                    permissions={workOrderPermissions}
                    module="workOrder"
                    api={workOrder.api}
                    afterImportCompleted={fetchWorkOrder}
                    isExportAllOrSomeFeature={true}
                    onlyExport={true}
                    total={rowCount}
                    recordsToExport={getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length}
                    ids={
                      getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length
                        ? getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.map((obj) => obj._id)
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
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        {/* Tables Begins Here */}
        <CustomContainer>
          <div className="header-panel">
            <Grid container className={isMobile ? styles.mobile_filter_side_container_workOrder_ticket : styles.filter_side_container_workOrder_ticket}>
              <Grid item xs={isMobile && !isTablet ? 12 : 6} className="d-flex align-items-center gap-1">
                <Grid>
                  <GiAbstract055 className="headerLogo" />
                  <span className="listingHeader">{routes.workOrder.title} </span>
                </Grid>
                <HideWhenOffline>
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


              </Grid>
              <Grid item xs={isMobile && !isTablet ? 12 : 6} container className={isMobile ? styles.filter_side : styles.filter_side_deck}>
                <Box className={isMobile && !isTablet ? styles.mobile_filter_side_header : styles.filter_side_header} component="div">
                  <Grid style={{ display: 'flex', flex: 1, gap: "5px" }} className={isMobile && !isTablet ? styles.content_box : ""}>
                    <SearchBox
                      onSearch={handleSearch}
                      searchbox={isMobile ? styles.search_box_input : ""}
                      width="242px"
                      size="small"
                      value={search}
                      style={isMobile ? { flex: 1 } : {}}
                    />
                  </Grid>
                  {workOrderPermissions?.isCreate &&
                    <Button className={styles.add_submit_btn}
                      onClick={() => setShowManageWorkOrder({ open: true, isClone: false, idToClone: null })}
                      variant="contained" size="small" color="primary" startIcon={<AddOutlined />}>Add</Button>
                  }
                  {workOrderPermissions?.isDelete &&
                    <Button
                      className={styles.action_submit_btn}
                      variant="outlined"
                      color="default"
                      size="small"
                      onClick={openActions}
                      disabled={selectedRecords.length ? false : true}
                      aria-controls="action-menu"
                    >Actions <ExpandMore />
                    </Button>
                  }
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
                    <MenuItem onClick={() => {
                      setIsConformDialogVisible(true)
                      closeActions()
                    }}>Delete</MenuItem>
                  </Menu>
                </Box>
              </Grid>
            </Grid>
          </div>

          {isMobile && !isTablet ? (
            <CustomSwipableList
              allowSelection={true}
              allowSwipe={true}
              permissions={permissions.workOrder}
              primaryField={columns?.find((d) => d.primaryField)}
              onClick={(data) => {
                history.push(`${routes.workOrderDetail.path}/${data._id}`);
              }}
              dataRows={dataRows}
              selectedRecords={selectedRecords}
              dispatch={dispatch}
              onEdit={() => { }}
              extraParamsToCheckDelete={true}
              onDelete={() => { }}
              rowCount={rowCount}
              page={page}
              loading={loading}
              chips={[
                {
                  label: 'Status: ',
                  field: 'status'
                },
                {
                  label: 'Job Name: ',
                  field: 'ticketName'
                }
              ]}
              onCreate={null}
              showClone={false}
              onClone={() => { }}
              renderedFrom={renderedFrom}
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
              message={`Are you sure you want to delete ${deleteRecord?.ticketName ? ' Work Order' : routes.workOrder.title}   ${deleteRecord.ticketName || ''}?`}
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
      </Fragment>
    </>
  );
};

export default WorkOrder;
