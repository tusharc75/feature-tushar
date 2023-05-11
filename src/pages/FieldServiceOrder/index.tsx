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
  fieldServiceOrder,
  prepareDataForGrid,
  getLocalStorageArrayData,
  removeLocalStorage,
  sidebarResource
} from '../../constants/helpers';
import CustomContainer from '../../components/CustomContainer';
import routes from '../../components/Helpers/Routes';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import MessageDialog from '../../components/Helpers/MessageDialog';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import CustomAgGrid, { reducer, intialState } from '../../components/AgGridComponents/CustomAgGrid';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import { isMobile, isTablet } from 'react-device-detect';
import CustomSwipableList from '../../components/SwipableListComponents/CustomSwipableList';
import useColumns, { getStaticFields, getFrameworkComponents, checkStaticField } from '../../constants/useColumns';
import { camelCase } from 'lodash';
import {
  SiStatuspage,
} from 'react-icons/all';
import ServiceOrderHeader from './FieldServiceOrderHeader';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import DeleteIcon from '@material-ui/icons/Delete';
import ManageServiceOrder from './ManageServiceOrder';

let serviceOrderTimeout;


const ServiceOrder = () => {

  const ServiceOrderType = [
    {
      key: `All ${routes.fieldServiceOrder.title}`,
      value: 1
    },
    {
      key: `My ${routes.fieldServiceOrder.title}`,
      value: 2
    }
  ];

  const renderedFrom = camelCase(routes?.fieldServiceOrder.title);
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
  const [showManageServiceOrderDialog, setShowManageServiceOrderDialog] = useState({ open: false, isClone: false, idToClone: null });
  const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] = useState(false);
  const [singleServiceOrderDelete, setSingleServiceOrderDelete] = useState({
    id: null,
    show: false,
    fieldServiceOrderNumber: ''
  });

  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows, showFilteredRecordsOnly } =
    state;
  const [frameworkComponents, setFrameworkComponents] = useState({});
  const [columns, setColumns] = useState([]);

  const { getColumnData } = useColumns();

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=${sidebarResource.fieldServiceOrder}`);
    data = response?.data?.data;
    let columns = [];
    let rendererNames = [];
    data.forEach((o) => {
      let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.fieldServiceOrderDetail.path);
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
    if (serviceOrderTimeout) {
      clearTimeout(serviceOrderTimeout);
    }
    serviceOrderTimeout = setTimeout(() => {
      fetchServiceOrders();
    }, millisec);
  }, [search]);

  useEffect(() => {
    if (renderCount > 0) {
      fetchServiceOrders();
    } else setRenderCount((preCount) => preCount + 1);
  }, [page, limit, selectedType, filters, sorting, selectedEntity, showFilteredRecordsOnly]);

  const handleSingleDeleteServiceOrder = async () => {
    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .put(`${fieldServiceOrder.api}/remove`, {
        ids: [singleServiceOrderDelete.id]
      })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchServiceOrders();
        dispatch({ type: 'loading', loading: false });
        setSingleServiceOrderDelete({ id: null, show: false, fieldServiceOrderNumber: '' });
      })
      .catch((error) => {
        dispatch({ type: 'loading', loading: false });
        toastConfig.setToastConfig(error);
      });
  };

  const ActionsRenderer = (params) => (
    <>
      {permissions?.fieldServiceOrder?.isCreate ? (
        <Tooltip title="Clone">
          <IconButton
            size="small"
            aria-label="Clone"
            onClick={() => {
              setShowManageServiceOrderDialog({ open: true, isClone: true, idToClone: params.data._id });
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
              setSingleServiceOrderDelete({
                show: true,
                id: params.data._id,
                fieldServiceOrderNumber: `${params.data.fieldServiceOrderNumber}`
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
    let deepFilter = `?page=${page}&limit=${limit}&filterServiceOrders=${selectedType}`;
    if (isExport) {
      deepFilter = `filterServiceOrders=${selectedType}`;
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

  const fetchServiceOrders = async () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    if (gridApi) {
      gridApi.setRowData([]);
    }
    try {
      let data: any = [],
        count;
      const response: any = await axiosInstance().get(`${fieldServiceOrder.api}${queryString}`);
      data = response?.data?.data;
      count = response?.data?.count;
      let rows = data.map((u) => {
        let finalObject: any = prepareDataForGrid(u, user);
        finalObject['isChecked'] = false;
        finalObject['allowedToEdit'] = permissions?.fieldServiceOrder?.isUpdate;
        finalObject['canDelete'] = permissions?.fieldServiceOrder?.isDelete && finalObject?.ownerId === user?.user?._id && u?.canDelete;
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

  const handleServiceOrderTypeSel = (filterValues) => {
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
    setShowManageServiceOrderDialog({ open: true, isClone: false, idToClone: null });
  };

  const handleDeleteServiceOrder = async () => {
    setDeleteLoading(true);
    let recordsToDelete = [];
    if (deleteRecord?._id) {
      recordsToDelete.push(deleteRecord?._id);
    } else {
      recordsToDelete = getLocalStorageArrayData(localStorageSelectedRecords)?.map((o) => o._id);
    }
    if (recordsToDelete.length > 0) {
      axiosInstance()
        .put(`${fieldServiceOrder.api}/remove`, {
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
          fetchServiceOrders();
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
          <CustomBreadCrumbs routes={[routes.fieldServiceOrder]} />
        </Grid>
        <Grid item md={8} sm={1} xs={2}>
          <Grid container direction="row">
            <Grid item xs={12} sm={12}>
              <Grid container justify="flex-end">
                <ImportExportLinks
                  permissions={permissions?.fieldServiceOrder}
                  module="fieldServiceOrder"
                  api={fieldServiceOrder.api}
                  afterImportCompleted={() => {
                    fetchServiceOrders();
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
                    else fetchServiceOrders();
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
          <ServiceOrderHeader
            selectedType={selectedType}
            selectedRecords={getLocalStorageArrayData(localStorageSelectedRecords)}
            onTypeChange={handleServiceOrderTypeSel}
            options={ServiceOrderType}
            onSearch={handleSearch}
            columns={columns}
            dispatch={dispatch}
            searchVal={search}
            ServiceOrderPermissions={permissions?.fieldServiceOrder}
            onCreate={clickCreateNew}
            showConfirmBox={showConfirmBox}
            canDelete={getLocalStorageArrayData(localStorageSelectedRecords)?.length === 0}
            icon={<FaRegistered className="headerLogo" />}
            heading={routes.fieldServiceOrder.title}
            showTransferEntityDialog={handleTransferEntityDialog}
            filters={filters}
          // showCloneServiceOrderDialog={() => {
          //   handleShowCloneServiceOrderDialog()
          // }}
          ></ServiceOrderHeader>
        </div>
        {Object.keys(frameworkComponents).length > 0 ? (
          isMobile && !isTablet ? (
            <CustomSwipableList
              allowSelection={true}
              allowSwipe={true}
              permissions={permissions?.fieldServiceOrder}
              primaryField={columns?.find((d) => d.primaryField)}
              onClick={(data) => {
                history.push(`${routes.fieldServiceOrderDetail.path}/${data._id}`);
              }}
              dataRows={dataRows}
              selectedRecords={getLocalStorageArrayData(localStorageSelectedRecords)}
              dispatch={dispatch}
              onEdit={(data) => {
                history.push(`${routes.fieldServiceOrderDetail.path}/${data._id}?openEdit=true`);
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
                setShowManageServiceOrderDialog({ open: true, isClone: true, idToClone: data._id });
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
              refreshGrid={fetchServiceOrders}
              showOnlyShowFilteredRecordSwitch={true}
              showFilters={true}
              resource={sidebarResource.fieldServiceOrder}
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
            message={`Are you sure you want to delete ${deleteRecord?.fieldServiceOrderNumber ? 'Service Order' : 'Service Orders'}   ${deleteRecord.fieldServiceOrderNumber || ''
              }?`}
            onClose={() => {
              if (deleteRecord) setDeleteRecord({});
              setIsConformDialogVisible(false);
            }}
            okBtnLoading={deleteLoading}
            onOk={handleDeleteServiceOrder}
          />
        ) : null}

        {singleServiceOrderDelete.show ? (
          <ConfirmationDialog
            open={singleServiceOrderDelete.show}
            message={`Are you sure you want to delete : ${singleServiceOrderDelete.fieldServiceOrderNumber}?`}
            onClose={() =>
              setSingleServiceOrderDelete({
                id: null,
                show: false,
                fieldServiceOrderNumber: ''
              })
            }
            onOk={handleSingleDeleteServiceOrder}
          />
        ) : null}
      </CustomContainer>
      {showManageServiceOrderDialog.open && (
        <ManageServiceOrder
          isClone={showManageServiceOrderDialog.isClone}
          serviceOrderId={showManageServiceOrderDialog.idToClone}
          onClose={() => setShowManageServiceOrderDialog({ open: false, isClone: false, idToClone: null })}
          onSuccess={(data) => {
            history.push(`${routes.fieldServiceOrderDetail.path}/${data._id}`);
            setShowManageServiceOrderDialog({ open: false, isClone: false, idToClone: null });
          }}
          open={showManageServiceOrderDialog.open}
        />
      )}
    </Fragment>
  );
};

export default ServiceOrder;
