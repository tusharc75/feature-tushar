import { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { Chip, Grid, IconButton, Tooltip, Box } from '@material-ui/core';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { FaRegistered, FaSuitcase } from 'react-icons/fa';
import { MdContactPhone, RiContactsBookUploadFill, RiShip2Fill, FaWarehouse, SiStatuspage } from 'react-icons/all';
import {
  isObjectEmpty,
  customerAccount,
  supplierAccount,
  gridLoadingTimeout,
  invoice,
  sidebarResource,
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
import GridDeleteIcon from '../../components/Helpers/GridDeleteIcon';
import CustomAgGrid, { reducer, intialState } from '../../components/AgGridComponents/CustomAgGrid';
import InvoiceHeader from './InvoiceHeader';
import CustomSwipableList from '../../components/SwipableListComponents/CustomSwipableList';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import useColumns, { getStaticFields, getFrameworkComponents, checkStaticField, gridFilterParser } from '../../constants/useColumns';
import ManageInvoiceDialog from './ManageInvoiceDialog';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { camelCase } from 'lodash';

let invoiceTimeout;

const Invoice = () => {

  const InvoiceType = [
    {
      key: `All ${routes.invoice.title}`,
      value: 1
    },
    {
      key: `My ${routes.invoice.title}`,
      value: 2
    }
  ];

  const renderedFrom = camelCase(routes?.invoice.title);
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
  const [showManageInvoiceDialog, setShowManageInvoiceDialog] = useState({ open: false, isClone: false, idToClone: null });
  const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] = useState(false);
  const [singleInvoiceDelete, setSingleInvoiceDelete] = useState({
    id: null,
    show: false,
    invoiceNumber: ''
  });
  const [accountDetails, setAccountDetails] = useState({
    accountId: history.location?.state?.accountId,
    accountName: history.location?.state?.accountName,
    resource: history.location?.state?.resource
  });
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;

  const { getColumnData } = useColumns();
  const [frameworkComponent, setFrameworkComponent] = useState({});
  const [columns, setColumns] = useState(null);
  const localStorageSelectedRecords = `${renderedFrom}_selected`;

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=Invoice`);
    data = response?.data?.data;
    let columns = [];
    let rendererNames = [];
    data.forEach((o) => {
      let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.invoiceDetail.path);
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
    if (invoiceTimeout) {
      clearTimeout(invoiceTimeout);
    }

    invoiceTimeout = setTimeout(() => {
      fetchInvoiceData();
    }, millisec);
    // eslint-disable-next-line
  }, [search]);

  useEffect(() => {
    if (renderCount > 0) {
      fetchInvoiceData();
    } else setRenderCount((preCount) => preCount + 1);
  }, [page, limit, selectedType, filters, sorting, accountDetails, selectedEntity, showFilteredRecordsOnly]);

  const handleSingleDeleteInvoice = async () => {
    dispatch({ type: 'loading', loading: true });

    axiosInstance()
      .put(`${invoice.api}/remove`, {
        ids: [singleInvoiceDelete.id]
      })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchInvoiceData();
        dispatch({ type: 'loading', loading: false });
        setSingleInvoiceDelete({ id: null, show: false, invoiceNumber: '' });
      })
      .catch((error) => {
        dispatch({ type: 'loading', loading: false });
        toastConfig.setToastConfig(error);
      });
  };

  const ActionsRenderer = (params) => (
    <>
      {permissions?.invoice?.isCreate ? (
        <Tooltip title="Clone">
          <IconButton
            size="small"
            aria-label="Clone"
            onClick={() => {
              setShowManageInvoiceDialog({ open: true, isClone: true, idToClone: params.data._id });
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

      {params?.data?.canDelete && <GridDeleteIcon
        hasDeletePermission={params?.data?.canDelete}
        ownerId={user?.user?._id}
        userId={user?.user?._id}
        onDelete={() =>
          setSingleInvoiceDelete({
            show: true,
            id: params.data._id,
            invoiceNumber: `${params.data.invoiceNumber}`
          })
        }
        entity="invoice"
      />}
    </>
  );

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}`;
    if (selectedType === 2) {
      deepFilter = deepFilter + `&myRecords=1`;
    }
    if (isExport) {
      deepFilter = `?`;
    }
    if (showFilteredRecordsOnly) {
      const savedRecords = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : [];
      deepFilter = `${deepFilter}&getById=${JSON.stringify(savedRecords.map((m) => m._id))}`;
    }

    const { filterByIds, deepFilters } = gridFilterParser(filters)

    if (accountDetails.accountId) {
      if (accountDetails.resource === customerAccount.accountResource) {
        filterByIds.push({
          field: 'customerAccount',
          term: accountDetails.accountId
        })
      } else if (accountDetails.resource === supplierAccount.accountResource) {
        filterByIds.push({
          field: 'supplierAccountName',
          term: { $in: [accountDetails.accountId] }
        })
      }
    }

    if (filterByIds?.length) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterByIds)}`;
    }
    if (deepFilters?.length) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURI(JSON.stringify(deepFilters))}`;
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

    return deepFilter;
  };

  const fetchInvoiceData = async () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();

    if (gridApi) {
      gridApi.setRowData([]);
    }

    axiosInstance()
      .get(`${invoice.api}${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data.map((u) => {
          let finalObject = prepareDataForGrid(u, user);
          finalObject['isChecked'] = false;
          finalObject['allowedToEdit'] = permissions?.invoice?.isUpdate;
          finalObject['canDelete'] = permissions?.invoice?.isDelete && u?.canDelete;

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

  const handleInvoiceTypeSel = (filterValues) => {
    setSelectedType(filterValues);
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
    setShowManageInvoiceDialog({ open: true, isClone: false, idToClone: null });
  };

  const handleDeleteInvoice = async () => {
    setDeleteLoading(true);
    let recordsToDelete = [];
    if (deleteRecord?._id) {
      recordsToDelete.push(deleteRecord?._id);
    } else {
      recordsToDelete = selectedRecords.map((o) => o._id);
    }
    if (recordsToDelete.length > 0) {
      axiosInstance()
        .put(`${invoice.api}/remove`, {
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
          fetchInvoiceData();
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
          <CustomBreadCrumbs routes={[routes.invoice]} />
        </Grid>
        <Grid item md={8} sm={1} xs={2}>
          <Grid container direction="row">
            <Grid item xs={12} sm={12}>
              <Grid container justify="flex-end">
                <ImportExportLinks
                  permissions={permissions?.invoice}
                  module="invoice"
                  api={invoice.api}
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
                    else fetchInvoiceData();
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
            <InvoiceHeader
              selectedRecords={selectedRecords}
              onTypeChange={handleInvoiceTypeSel}
              options={InvoiceType}
              onSearch={handleSearch}
              searchVal={search}
              invoicePermissions={permissions?.invoice}
              onCreate={clickCreateNew}
              showConfirmBox={showConfirmBox}
              canDelete={selectedRecords.length === 0}
              icon={<FaRegistered className="headerLogo" />}
              heading={routes.invoice.title}
              showTransferEntityDialog={handleTransferEntityDialog}
              columns={columns}
              dispatch={dispatch}
              filters={filters}
            >
              {accountDetails.accountId && (
                <Chip
                  className="ml-3"
                  color="primary"
                  label={`Account: ${accountDetails.accountName}`}
                  onDelete={() => {
                    setAccountDetails({
                      accountId: null,
                      accountName: null,
                      resource: null
                    });
                  }}
                />
              )}
            </InvoiceHeader>
          )}
        </div>
        {Object.keys(frameworkComponent).length > 0 && columns ? (
          isMobile && !isTablet ? (
            <CustomSwipableList
              allowSelection={true}
              allowSwipe={true}
              permissions={permissions?.invoice}
              primaryField={columns?.find((d) => d.field === 'invoiceNo')}
              onClick={(data) => {
                history.push(`${routes.invoiceDetail.path}/${data._id}`);
              }}
              dataRows={dataRows}
              selectedRecords={selectedRecords}
              dispatch={dispatch}
              onEdit={(data) => {
                history.push(`${routes.invoiceDetail.path}/${data._id}?openEdit=true`);
              }}
              extraParamsToCheckDelete={true}
              onDelete={(data) => {
                setSingleInvoiceDelete({
                  show: true,
                  id: data._id,
                  invoiceNumber: `${data.invoiceNumber}`
                });
              }}
              rowCount={rowCount}
              page={page}
              loading={loading}
              additionalDetails={[
                {
                  icon: <FaSuitcase size={18} />,
                  field: 'customerAccount'
                }
              ]}
              chips={[
                {
                  icon: <MdContactPhone />,
                  label: 'Customer Contact: ',
                  field: 'customerContact'
                },
                {
                  icon: <RiContactsBookUploadFill />,
                  label: 'Billing Address: ',
                  field: 'billingAddress'
                },
                {
                  icon: <RiShip2Fill />,
                  label: 'Shipping Address: ',
                  field: 'shippingAddress'
                },
                {
                  icon: <FaWarehouse />,
                  label: 'Plants: ',
                  field: 'plants'
                },
                {
                  icon: <SiStatuspage />,
                  label: 'Status: ',
                  field: 'status:'
                }
              ]}
              owerCollaboratorInitialsOrImages="owerCollaboratorInitialsOrImages"
              onCreate={false}
              showClone={true}
              onClone={(data) => {
                setShowManageInvoiceDialog({ open: true, isClone: true, idToClone: data._id });
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
              refreshGrid={fetchInvoiceData}
              showOnlyShowFilteredRecordSwitch={true}
              showFilters={true}
              resource={sidebarResource.invoice}
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
            message={`Are you sure you want to delete ${routes?.invoice?.title?.toLowerCase()} ${deleteRecord?.invoice || ''} ?`}
            onClose={() => {
              setDeleteRecord(null);
              setIsConformDialogVisible(false);
            }}
            okBtnLoading={deleteLoading}
            onOk={handleDeleteInvoice}
          />
        ) : null}
        {singleInvoiceDelete.show && (
          <ConfirmationDialog
            open={singleInvoiceDelete.show}
            message={`Are you sure you want to delete Invoice: ${singleInvoiceDelete.invoiceNumber}?`}
            onClose={() =>
              setSingleInvoiceDelete({
                id: null,
                show: false,
                invoiceNumber: ''
              })
            }
            onOk={handleSingleDeleteInvoice}
          />
        )}
      </CustomContainer>
      {showManageInvoiceDialog.open && (
        <ManageInvoiceDialog
          isClone={showManageInvoiceDialog.isClone}
          open={showManageInvoiceDialog.open}
          invoiceId={showManageInvoiceDialog.idToClone}
          onClose={() => setShowManageInvoiceDialog({ open: false, isClone: false, idToClone: null })}
          onSuccess={() => {
            fetchInvoiceData();
            setShowManageInvoiceDialog({ open: false, isClone: false, idToClone: null });
          }}
        />
      )}
    </Fragment>
  );
};

export default Invoice;
