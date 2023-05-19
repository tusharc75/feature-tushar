import { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { Chip, Grid, IconButton, Tooltip, Box } from '@material-ui/core';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { BsListCheck } from 'react-icons/all';
import {
  isObjectEmpty,
  gridLoadingTimeout,
  prepareDataForGrid,
  getLocalStorageArrayData,
  removeLocalStorage,
  demandOrder
} from '../../constants/helpers';
import CustomContainer from '../../components/CustomContainer';
import routes from './../../components/Helpers/Routes';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import MessageDialog from '../../components/Helpers/MessageDialog';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import GridDeleteIcon from '../../components/Helpers/GridDeleteIcon';
import CustomAgGrid, { reducer, intialState } from '../../components/AgGridComponents/CustomAgGrid';
import SalesOrderHeader from './DemandOrderHeader';
import CustomSwipableList from '../../components/SwipableListComponents/CustomSwipableList';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import useColumns, { getStaticFields, getFrameworkComponents, checkStaticField, gridFilterParser } from '../../constants/useColumns';
import ManageSalesOrderDialog from './ManageDemandOrderDialog';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { camelCase } from 'lodash';

let searchTimeout;



const DemandOrder = () => {

  const DemandOrderType = [
    {
      key: `All ${routes.demandOrder.title}`,
      value: 1
    },
    {
      key: `My ${routes.demandOrder.title}`,
      value: 2
    }
  ];

  const renderedFrom = camelCase(routes?.demandOrder.title);
  const localStorageSelectedRecords = `${renderedFrom}_selected`;
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();
  const [selectedType, setSelectedType] = useState(1);
  const [renderCount, setRenderCount] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showTransferEntityDialog, setShowTransferEntityDialog] = useState(false);
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState<any>({});
  const [showManageSalesOrderDialog, setShowManageSalesOrderDialog] = useState({ open: false, isClone: false, idToClone: null });
  const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] = useState(false);
  const [singleSalesOrderDelete, setSingleSalesOrderDelete] = useState({
    id: null,
    show: false,
    demandOrderNumber: ''
  });
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;

  const { getColumnData } = useColumns();
  const [frameworkComponent, setFrameworkComponent] = useState({});
  const [columns, setColumns] = useState(null);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=Demand Order`);
    data = response?.data?.data;
    let columns = [];
    let rendererNames = [];
    data.forEach((o) => {
      let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.demandOrderDetail.path);
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
      demandOrderRenderer: DemandOrderRenderer,
      actionsRenderer: ActionsRenderer
    };
    setFrameworkComponent({ ...tempFrameworkComponent });
    let staticFields = getStaticFields();
    staticFields.forEach((field) => {
      columns.push(checkStaticField(routes.projectSales.title, field));
    });
    setColumns([...columns]);
    if (JSON.parse(sessionStorage.getItem('filters')) !== null) {
      let savedFilter = JSON.parse(sessionStorage.getItem('filters'));
      dispatch({ type: 'filter', filters: savedFilter });
    }
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
  }, [page, limit, selectedType, filters, sorting, selectedEntity, showFilteredRecordsOnly]);

  const handleSingleDeleteSalesOrder = async () => {
    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .put(`${demandOrder.api}/remove`, {
        ids: [singleSalesOrderDelete.id]
      })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchData();
        dispatch({ type: 'loading', loading: false });
        setSingleSalesOrderDelete({ id: null, show: false, demandOrderNumber: '' });
      })
      .catch((error) => {
        dispatch({ type: 'loading', loading: false });
        toastConfig.setToastConfig(error);
      });
  };

  const DemandOrderRenderer = (params) => (
    <Link className="link" title={params.value} to={`${routes.demandOrder.path}/detail/${params.data._id}`}>
      {params.value}
    </Link>
  );

  const ActionsRenderer = (params) => (
    <>
      {permissions?.demandOrder?.isCreate ? (
        <Tooltip title="Clone">
          <IconButton
            size="small"
            aria-label="Clone"
            onClick={() => {
              setShowManageSalesOrderDialog({ open: true, isClone: true, idToClone: params.data._id });
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
      <GridDeleteIcon
        hasDeletePermission={permissions?.demandOrder?.isDelete}
        ownerId={user?.user?._id}
        userId={user?.user?._id}
        onDelete={() =>
          setSingleSalesOrderDelete({
            show: true,
            id: params.data._id,
            demandOrderNumber: `${params.data.demandOrderNumber}`
          })
        }
        entity="demand order"
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
    let deepFilter = `?page=${page}&limit=${limit}`;
    if (selectedType === 2) {
      deepFilter = deepFilter + `&myRecords=1`;
    }
    if (isExport) {
      deepFilter = `?`;
    }
    if (selectedEntity) {
      deepFilter = `${deepFilter}&entity=${selectedEntity}`;
    }

    const { filterByIds, deepFilters } = gridFilterParser(filters);

    if (filterByIds?.length) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterByIds)}`;
    }
    if (deepFilters?.length) {
      deepFilter = `${deepFilter}&deepFilter=${JSON.stringify(deepFilters)}`;
    }
    if (filterByIds?.length || deepFilters?.length) {
      deepFilter = `${deepFilter}&filterType=and`;
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }
    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURI(search)}`;
    }
    if (showFilteredRecordsOnly) {
      const savedRecords = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : [];
      deepFilter = `${deepFilter}&getById=${JSON.stringify(savedRecords.map((m) => m._id))}`;
    }
    return deepFilter;
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();

    if (gridApi) {
      gridApi.setRowData([]);
    }

    axiosInstance().get(`${demandOrder.api}${queryString}`).then(({ data: { data, count } }) => {
      let rows = data.map((u) => {
        let finalObject = prepareDataForGrid(u, user);
        finalObject['isChecked'] = false;
        finalObject['allowedToEdit'] = permissions?.demandOrder?.isUpdate;
        finalObject['canDelete'] = permissions?.demandOrder?.isDelete;
        return finalObject;
      });
      dispatch({ type: 'initialize', data: rows, count: count });
      setTimeout(() => {
        dispatch({ type: 'loading', loading: false });
      }, gridLoadingTimeout);
    })
      .catch((error) => {
        dispatch({ type: 'loading', loading: false });
        toastConfig.setToastConfig(error);
      });
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const handleSalesOrderTypeSel = (filterValues) => {
    setSelectedType(filterValues);
    history.push(`?type=${filterValues}`)
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
      if (selectedRecords.find((d) => d.canDelete === false)) {
        setShowDeleteWarningConfirmBox(true);
      } else {
        setIsConformDialogVisible(true);
      }
    }
  };

  const clickCreateNew = () => {
    setShowManageSalesOrderDialog({ open: true, isClone: false, idToClone: null });
  };

  const handleDeleteSalesOrder = async () => {
    setDeleteLoading(true);
    let recordsToDelete = [];
    if (deleteRecord?._id) {
      recordsToDelete.push(deleteRecord?._id);
    } else {
      recordsToDelete = selectedRecords.map((o) => o._id);
    }
    if (recordsToDelete.length > 0) {
      axiosInstance()
        .put(`${demandOrder.api}/remove`, {
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
          fetchData();
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
          <CustomBreadCrumbs routes={[routes.demandOrder]} />
        </Grid>
        <Grid item md={8} sm={1} xs={2}>
          <Grid container direction="row">
            <Grid item xs={12} sm={12}>
              <Grid container justify="flex-end">
                <ImportExportLinks
                  permissions={permissions?.demandOrder}
                  module="demandOrder"
                  api={demandOrder.api}
                  afterImportCompleted={() => { }}
                  isExportAllOrSomeFeature={true}
                  total={rowCount}
                  recordsToExport={getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length}
                  ids={
                    getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length
                      ? getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.map((obj) => obj._id)
                      : []
                  }
                  onExportToExcelSuccess={() => {
                    if (gridApi) gridApi.deselectAll();
                    else fetchData();
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
          {columns && (
            <SalesOrderHeader
              selectedType={selectedType}
              selectedRecords={selectedRecords}
              onTypeChange={handleSalesOrderTypeSel}
              options={DemandOrderType}
              onSearch={handleSearch}
              searchVal={search}
              SalesOrderPermissions={permissions?.demandOrder}
              onCreate={clickCreateNew}
              showConfirmBox={showConfirmBox}
              canDelete={selectedRecords.length === 0}
              icon={<BsListCheck className="headerLogo" />}
              heading={routes.demandOrder.title}
              showTransferEntityDialog={handleTransferEntityDialog}
              columns={columns}
              dispatch={dispatch}
              filters={filters}
            ></SalesOrderHeader>
          )}
        </div>
        {Object.keys(frameworkComponent).length > 0 && columns ? (
          isMobile && !isTablet ? (
            <CustomSwipableList
              allowSelection={true}
              allowSwipe={true}
              permissions={permissions?.demandOrder}
              primaryField={columns?.find((d) => d.field === 'demandOrderNumber')}
              onClick={(data) => {
                history.push(`${routes.demandOrderDetail.path}/${data._id}`);
              }}
              dataRows={dataRows}
              selectedRecords={selectedRecords}
              dispatch={dispatch}
              onEdit={(data) => {
                history.push(`${routes.demandOrderDetail.path}/${data._id}?openEdit=true`);
              }}
              extraParamsToCheckDelete={true}
              onDelete={(data) => {
                setSingleSalesOrderDelete({
                  show: true,
                  id: data._id,
                  demandOrderNumber: `${data.demandOrderNumber}`
                });
              }}
              rowCount={rowCount}
              page={page}
              loading={loading}
              chips={[]}
              owerCollaboratorInitialsOrImages="owerCollaboratorInitialsOrImages"
              onCreate={false}
              showClone={true}
              onClone={(data) => {
                setShowManageSalesOrderDialog({ open: true, isClone: true, idToClone: data._id });
              }}
              renderedFrom={renderedFrom}
            />
          ) : (
            <CustomAgGrid
              columns={columns}
              dataRows={dataRows}
              frameworkComponents={frameworkComponent}
              setGridApi={setGridApi}
              dispatch={dispatch}
              rowCount={rowCount}
              limit={limit}
              pageSizes={pageSizes}
              page={page}
              actionWidth={100}
              loading={loading}
              renderedFrom={renderedFrom}
              refreshGrid={fetchData}
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
            message={`Are you sure you want to delete ${routes?.demandOrder?.title?.toLowerCase()} ${deleteRecord?.salesOrderName || ''} ?`}
            onClose={() => {
              setDeleteRecord(null);
              setIsConformDialogVisible(false);
            }}
            okBtnLoading={deleteLoading}
            onOk={handleDeleteSalesOrder}
          />
        ) : null}
        {singleSalesOrderDelete.show ? (
          <ConfirmationDialog
            open={singleSalesOrderDelete.show}
            message={`Are you sure you want to delete Demand Order: ${singleSalesOrderDelete.demandOrderNumber}?`}
            onClose={() =>
              setSingleSalesOrderDelete({
                id: null,
                show: false,
                demandOrderNumber: ''
              })
            }
            onOk={handleSingleDeleteSalesOrder}
          />
        ) : null}
      </CustomContainer>
      {showManageSalesOrderDialog.open && (
        <ManageSalesOrderDialog
          isClone={showManageSalesOrderDialog.isClone}
          open={showManageSalesOrderDialog.open}
          salesOrderId={showManageSalesOrderDialog.idToClone}
          onClose={() => setShowManageSalesOrderDialog({ open: false, isClone: false, idToClone: null })}
          onSuccess={() => {
            fetchData();
            setShowManageSalesOrderDialog({ open: false, isClone: false, idToClone: null });
          }}
        />
      )}
    </Fragment>
  );
};

export default DemandOrder;
