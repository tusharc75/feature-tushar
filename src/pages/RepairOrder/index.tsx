import { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { Chip, Grid, IconButton, Tooltip, Fab } from '@material-ui/core';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { FaRegistered } from 'react-icons/fa';
import queryString from 'query-string';
import {
  isObjectEmpty,
  customerAccount,
  supplierAccount,
  gridLoadingTimeout,
  repairOrder,
  prepareDataForGrid,
  getLocalStorageArrayData,
  removeLocalStorage
} from '../../constants/helpers';
import CustomContainer from '../../components/CustomContainer';
import routes from './../../components/Helpers/Routes';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import MessageDialog from '../../components/Helpers/MessageDialog';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import CustomAgGrid, { reducer, intialState } from '../../components/AgGridComponents/CustomAgGrid';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import { isMobile, isTablet } from 'react-device-detect';
import CustomSwipableList from '../../components/SwipableListComponents/CustomSwipableList';
import useColumns, { getStaticFields, getFrameworkComponents, checkStaticField } from '../../constants/useColumns';
import { camelCase } from 'lodash';
import { CustomOfflineContext } from '../../StateProvider/OfflineContext/OfflineContext';
import {
  FaSuitcase,
  SiStatuspage,
  FaWarehouse,
  GiAutoRepair,
  GrStatusInfo,
  BsFillPersonFill,
  GiCargoShip,
  FaShippingFast,
  RiSpaceShipFill
} from 'react-icons/all';
import ManageRepairOrder from './ManageRepairOrder';
import RepairOrderHeader from './RepairOrderHeader';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import DeleteIcon from '@material-ui/icons/Delete';

let repairOrderTimeout;
const RepairOrderType = [
  {
    key: 'All Repair Order',
    value: 1
  },
  {
    key: 'My Repair Order',
    value: 2
  }
];

const RepairOrder = () => {
  const renderedFrom = camelCase(routes?.repairOrder.title);
  const localStorageSelectedRecords = `${renderedFrom}_selected`;

  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();
  const { type }: any = queryString.parse(history.location.search);
  const [selectedType, setSelectedType] = useState(type ? parseInt(type) : 1);
  const [renderCount, setRenderCount] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showTransferEntityDialog, setShowTransferEntityDialog] = useState(false);
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState<any>({});
  const [showManageRepairOrderDialog, setShowManageRepairOrderDialog] = useState({ open: false, isClone: false, idToClone: null });
  const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] = useState(false);
  const [singleRepairOrderDelete, setSingleRepairOrderDelete] = useState({
    id: null,
    show: false,
    repairOrderNumber: ''
  });

  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows, showFilteredRecordsOnly } =
    state;
  const [frameworkComponents, setFrameworkComponents] = useState({});
  const { isOffline } = useContext(CustomOfflineContext);
  const [columns, setColumns] = useState([]);

  const { getColumnData } = useColumns();

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=Repair Order`);
    data = response?.data?.data;
    let columns = [];
    let rendererNames = [];
    data.forEach((o) => {
      let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.repairOrderDetail.path);
      if (currentColumn !== null) {
        if (isOffline) {
          currentColumn.columnData['filter'] = false;
          currentColumn.columnData['sortable'] = false;
        }
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
    setFrameworkComponents({ ...tempFrameworkComponent });
    let staticFields = getStaticFields();
    staticFields.forEach((field) => {
      columns.push(checkStaticField(renderedFrom, field));
    });
    setColumns([...columns]);
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
    if (repairOrderTimeout) {
      clearTimeout(repairOrderTimeout);
    }
    repairOrderTimeout = setTimeout(() => {
      fetchRepairOrders();
    }, millisec);
  }, [search]);

  useEffect(() => {
    if (renderCount > 0) {
      fetchRepairOrders();
    } else setRenderCount((preCount) => preCount + 1);
  }, [page, limit, selectedType, filters, sorting, selectedEntity, showFilteredRecordsOnly]);

  const handleSingleDeleteRepairOrder = async () => {
    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .put(`${repairOrder.api}/remove`, {
        ids: [singleRepairOrderDelete.id]
      })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchRepairOrders();
        dispatch({ type: 'loading', loading: false });
        setSingleRepairOrderDelete({ id: null, show: false, repairOrderNumber: '' });
      })
      .catch((error) => {
        dispatch({ type: 'loading', loading: false });
        toastConfig.setToastConfig(error);
      });
  };

  const ActionsRenderer = (params) => (
    <>
      {permissions?.repairOrder?.isCreate ? (
        <Tooltip title="Clone">
          <IconButton
            size="small"
            aria-label="Clone"
            onClick={() => {
              setShowManageRepairOrderDialog({ open: true, isClone: true, idToClone: params.data._id });
            }}
          >
            <FileCopyIcon fontSize="small" color="primary" />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip className="cursor-stop" title="You do not have permission to clone/create">
          <IconButton aria-label="Clone" size="small">
            <FileCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {params?.data?.canDelete && (
        <HtmlTooltip title="Delete">
          <IconButton
            size="small"
            aria-label="Delete"
            onClick={() => {
              setSingleRepairOrderDelete({
                show: true,
                id: params.data._id,
                repairOrderNumber: `${params.data.repairOrderNumber}`
              });
            }}
          >
            <DeleteIcon color="error" />
          </IconButton>
        </HtmlTooltip>
      )}
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
      case 'owner':
        return 'owner.optionLabel';

      case 'customerAccount':
        return 'customerAccount.optionLabel';

      case 'supplierAccountName':
        return 'supplierAccountName.optionLabel';

      default:
        return field;
    }
  };

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}&filterRepairOrders=${selectedType}`;
    if (isExport) {
      deepFilter = `filterRepairOrders=${selectedType}`;
    }
    let filterById = [];
    if (filterById.length) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterById)}`;
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
      deepFilter = `${deepFilter}&getById=${JSON.stringify(getLocalStorageArrayData(localStorageSelectedRecords)?.map((m) => m._id))}`;
    }
    return deepFilter;
  };

  const fetchRepairOrders = async () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    if (gridApi) {
      gridApi.setRowData([]);
    }
    try {
      let data: any = [],
        count;
      const response: any = await axiosInstance().get(`${repairOrder.api}${queryString}`);
      data = response?.data?.data;
      count = response?.data?.count;
      let rows = data.map((u) => {
        let finalObject: any = prepareDataForGrid(u, user);
        finalObject['isChecked'] = false;
        finalObject['allowedToEdit'] = permissions?.repairOrder?.isUpdate;
        finalObject['canDelete'] = permissions?.repairOrder?.isDelete && finalObject?.ownerId === user?.user?._id && u?.canDelete;
        return finalObject;
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

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const handleRepairOrderTypeSel = (filterValues) => {
    setSelectedType(filterValues);
    history.push(`?type=${filterValues}`);
  };

  const handleTransferEntityDialog = () => {
    setShowTransferEntityDialog(true);
  };

  const showConfirmBox = (row) => {
    if (row) {
      setIsConformDialogVisible(true);
      if (row && row._id) {
        setDeleteRecord(row);
      }
    } else {
      if (getLocalStorageArrayData(localStorageSelectedRecords)?.find((d) => d.canDelete === false)) {
        setShowDeleteWarningConfirmBox(true);
      } else {
        setIsConformDialogVisible(true);
      }
    }
  };

  const clickCreateNew = () => {
    setShowManageRepairOrderDialog({ open: true, isClone: false, idToClone: null });
  };

  const handleDeleteRepairOrder = async () => {
    setDeleteLoading(true);
    let recordsToDelete = [];
    if (deleteRecord?._id) {
      recordsToDelete.push(deleteRecord?._id);
    } else {
      recordsToDelete = getLocalStorageArrayData(localStorageSelectedRecords)?.map((o) => o._id);
    }
    if (recordsToDelete.length > 0) {
      axiosInstance()
        .put(`${repairOrder.api}/remove`, {
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
          fetchRepairOrders();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setIsConformDialogVisible(false);
          setDeleteLoading(false);
        });
    }
  };

  return (
    <Fragment>
      <Grid container className="headerbox">
        <Grid item md={4} sm={11} xs={10}>
          <CustomBreadCrumbs routes={[routes.repairOrder]} />
        </Grid>
        <Grid item md={8} sm={1} xs={2}>
          <Grid container direction="row">
            <Grid item xs={12} sm={12}>
              <Grid container justify="flex-end">
                <ImportExportLinks
                  permissions={permissions?.repairOrder}
                  module="repairOrder"
                  api={repairOrder.api}
                  afterImportCompleted={() => {
                    fetchRepairOrders();
                  }}
                  isExportAllOrSomeFeature={true}
                  total={rowCount}
                  recordsToExport={getLocalStorageArrayData(localStorageSelectedRecords)?.length}
                  ids={
                    getLocalStorageArrayData(localStorageSelectedRecords)?.length
                      ? getLocalStorageArrayData(localStorageSelectedRecords)?.map((obj) => obj._id)
                      : []
                  }
                  onExportToExcelSuccess={() => {
                    if (gridApi) gridApi.deselectAll();
                    else fetchRepairOrders();
                  }}
                  additionalParams={getQueryString(true)}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      <CustomContainer>
        <div className="header-panel">
          <RepairOrderHeader
            selectedType={selectedType}
            selectedRecords={getLocalStorageArrayData(localStorageSelectedRecords)}
            onTypeChange={handleRepairOrderTypeSel}
            options={RepairOrderType}
            onSearch={handleSearch}
            columns={columns}
            dispatch={dispatch}
            searchVal={search}
            RepairOrderPermissions={permissions?.repairOrder}
            onCreate={clickCreateNew}
            showConfirmBox={showConfirmBox}
            canDelete={getLocalStorageArrayData(localStorageSelectedRecords)?.length === 0}
            icon={<FaRegistered className="headerLogo" />}
            heading={routes.repairOrder.title}
            showTransferEntityDialog={handleTransferEntityDialog}
            filters={filters}

            // showCloneRepairOrderDialog={() => {
            //   handleShowCloneRepairOrderDialog()
            // }}
          ></RepairOrderHeader>
        </div>
        {Object.keys(frameworkComponents).length > 0 ? (
          isMobile && !isTablet ? (
            <CustomSwipableList
              allowSelection={true}
              allowSwipe={true}
              permissions={permissions?.repairOrder}
              primaryField={columns?.find((d) => d.primaryField)}
              onClick={(data) => {
                history.push(`${routes.repairOrderDetail.path}/${data._id}`);
              }}
              dataRows={dataRows}
              selectedRecords={getLocalStorageArrayData(localStorageSelectedRecords)}
              dispatch={dispatch}
              onEdit={(data) => {
                history.push(`${routes.repairOrderDetail.path}/${data._id}?openEdit=true`);
              }}
              extraParamsToCheckDelete={true}
              onDelete={(data) => {
                setDeleteRecord(data._id);
                setIsConformDialogVisible(true);
              }}
              rowCount={rowCount}
              page={page}
              loading={loading}
              chips={[
                {
                  icon: <SiStatuspage />,
                  label: 'Status: ',
                  field: 'status'
                }
              ]}
              onCreate={false}
              showClone={true}
              onClone={(data) => {
                setShowManageRepairOrderDialog({ open: true, isClone: true, idToClone: data._id });
              }}
              renderedFrom={renderedFrom}
            />
          ) : (
            <CustomAgGrid
              columns={columns}
              dataRows={dataRows}
              frameworkComponents={frameworkComponents}
              setGridApi={setGridApi}
              dispatch={dispatch}
              rowCount={rowCount}
              limit={limit}
              pageSizes={pageSizes}
              page={page}
              actionWidth={100}
              loading={loading}
              renderedFrom={renderedFrom}
              refreshGrid={fetchRepairOrders}
              showOnlyShowFilteredRecordSwitch={true}
            />
          )
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
            message={`Are you sure you want to delete ${deleteRecord?.repairOrderNumber ? 'Repair Order' : 'Repair Orders'}   ${
              deleteRecord.repairOrderNumber || ''
            }?`}
            onClose={() => {
              if (deleteRecord) setDeleteRecord({});
              setIsConformDialogVisible(false);
            }}
            okBtnLoading={deleteLoading}
            onOk={handleDeleteRepairOrder}
          />
        ) : null}

        {singleRepairOrderDelete.show ? (
          <ConfirmationDialog
            open={singleRepairOrderDelete.show}
            message={`Are you sure you want to delete Repair Order: ${singleRepairOrderDelete.repairOrderNumber}?`}
            onClose={() =>
              setSingleRepairOrderDelete({
                id: null,
                show: false,
                repairOrderNumber: ''
              })
            }
            onOk={handleSingleDeleteRepairOrder}
          />
        ) : null}
      </CustomContainer>
      {showManageRepairOrderDialog.open && (
        <ManageRepairOrder
          isClone={showManageRepairOrderDialog.isClone}
          repairOrderId={showManageRepairOrderDialog.idToClone}
          onClose={() => setShowManageRepairOrderDialog({ open: false, isClone: false, idToClone: null })}
          onSuccess={(data) => {
            history.push(`${routes.repairOrderDetail.path}/${data._id}`);
            setShowManageRepairOrderDialog({ open: false, isClone: false, idToClone: null });
          }}
        />
      )}
    </Fragment>
  );
};

export default RepairOrder;
