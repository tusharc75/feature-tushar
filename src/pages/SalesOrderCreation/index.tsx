import { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { Chip, Grid, IconButton, Tooltip } from '@material-ui/core';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { FaRegistered,FaSuitcase } from 'react-icons/fa';
import {MdContactPhone,RiContactsBookUploadFill,RiShip2Fill,FaWarehouse,SiStatuspage } from 'react-icons/all';
import {
  isObjectEmpty,
  customerAccount,
  supplierAccount,
  gridLoadingTimeout,
  salesOrder,
  sidebarResource,
  prepareDataForGrid
} from '../../constants/helpers';
import CustomContainer from '../../components/CustomContainer';
import routes from './../../components/Helpers/Routes';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import MessageDialog from '../../components/Helpers/MessageDialog';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import GridDeleteIcon from '../../components/Helpers/GridDeleteIcon';
import CustomAgGrid, { reducer, intialState } from '../../components/AgGridComponents/CustomAgGrid';
import NoDataCell from '../../components/Helpers/NoDataCell';
import SalesOrderHeader from './SalesOrderHeader';
import CustomSwipableList from "../../components/SwipableListComponents/CustomSwipableList";
import { isMobile, isTablet } from 'react-device-detect';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import useColumns, { getStaticFields, getFrameworkComponents, checkStaticField } from '../../constants/useColumns';
import ManageSalesOrderDialog from './ManageSalesOrderDialog/ManageSalesOrderDialog';

let salesOrderTimeout;
const SalesOrderType = [
  {
    key: 'All Sales Order',
    value: 1
  },
  {
    key: 'My Sales Order',
    value: 2
  }
];

const SalesOrder = () => {
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
    salesOrderName: ''
  });
  const { salesOrderResource } = salesOrder;
  const [accountDetails, setAccountDetails] = useState({
    accountId: history.location?.state?.accountId,
    accountName: history.location?.state?.accountName,
    resource: history.location?.state?.resource
  });
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

  const { getColumnData } = useColumns();
  const [frameworkComponent, setFrameworkComponent] = useState({});
  const [columns, setColumns] = useState([]);

  // const columns = [
  //   {
  //     field: 'salesOrderNo',
  //     headerName: 'Sales Order No.',
  //     show: true,
  //     disabled: true,
  //     cellRenderer: 'salesOrderNoRenderer'
  //   },
  //   {
  //     field: 'createdBy',
  //     headerName: 'Created By',
  //     show: true,
  //     cellRenderer: 'createdByRenderer'
  //   },
  //   {
  //     field: 'updatedBy',
  //     headerName: 'Updated By',
  //     show: true,
  //     cellRenderer: 'updatedByRenderer'
  //   },
  //   {
  //     field: 'owner',
  //     headerName: 'Sales Order Owner',
  //     show: true,
  //     cellRenderer: 'OwnerRenderer'
  //   }
  // ];
  //  Grid Variables - End

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=${sidebarResource[salesOrderResource]}`);
    data = response?.data?.data;

    let columns = [];
    let rendererNames = [];

    data.forEach((o) => {
      // if (['accountName'].indexOf(o?.fieldData?.fieldName) === 0) {
      if (o?.fieldData?.primaryField === true) {
        columns = [
          ...columns,
          {
            pivotIndex: 0,
            field: o?.fieldData?.fieldName,
            headerName: o?.fieldData?.fieldLabel,
            show: true,
            disabled: true,
            cellRenderer: 'salesOrderNoRenderer'
          }
        ];
      } else {
        let currentColumn = getColumnData(salesOrderResource, o?.fieldData, routes.salesOrderDetail.path);
        if (currentColumn !== null) {
          columns = [...columns, currentColumn?.columnData];
          if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
            rendererNames.push(currentColumn?.rendererName);
          }
        }
      }
      return o?.fieldData;
    });
    let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
    tempFrameworkComponent = {
      ...tempFrameworkComponent,
      salesOrderNoRenderer: SalesOrderNoRenderer,
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
    if (salesOrderTimeout) {
      clearTimeout(salesOrderTimeout);
    }

    salesOrderTimeout = setTimeout(() => {
      fetchSalesOrder();
    }, millisec);
    // eslint-disable-next-line
  }, [search]);

  useEffect(() => {
    if (renderCount > 0) {
      fetchSalesOrder();
    } else setRenderCount((preCount) => preCount + 1);
  }, [page, limit, selectedType, filters, sorting, accountDetails, selectedEntity]);

  const handleSingleDeleteSalesOrder = async () => {
    dispatch({ type: 'loading', loading: true });

    axiosInstance()
      .put(`${salesOrder.salesOrderApi}/remove`, {
        ids: [singleSalesOrderDelete.id]
      })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchSalesOrder();
        dispatch({ type: 'loading', loading: false });
        setSingleSalesOrderDelete({ id: null, show: false, salesOrderName: '' });
      })
      .catch((error) => {
        dispatch({ type: 'loading', loading: false });
        toastConfig.setToastConfig(error);
      });
  };

  const SalesOrderNoRenderer = (params) => (
    <>
      <Link className="text-truncate link" title={params.value} to={`${routes.salesOrderDetail.path}/${params.data.id}`}>
        {params.value}
      </Link>
    </>
  );

  const OwnerRenderer = (params) => (
    <>
      {params.value ? (
        <Link className="link" to={`${routes.userDetail.path}/${params.data.ownerId}`} title={params.owner}>
          {params.value}
        </Link>
      ) : (
        <NoDataCell />
      )}
    </>
  );

  const ActionsRenderer = (params) => (
    <>
      {permissions.salesOrder.isCreate ? (
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
        hasDeletePermission={permissions.salesOrder.isDelete}
        ownerId={user?.user?._id}
        userId={user?.user?._id}
        onDelete={() =>
          setSingleSalesOrderDelete({
            show: true,
            id: params.data._id,
            salesOrderName: `${params.data.salesOrderNo}`
          })
        }
        entity="sales order"
      />
    </>
  );

  // const frameworkComponents = {
  //   salesOrderNoRenderer: SalesOrderNoRenderer,
  //   ownerRenderer: OwnerRenderer,
  //   createdByRenderer: CreatedByRenderer,
  //   updatedByRenderer: UpdatedByRenderer,
  //   actionsRenderer: ActionsRenderer,
  //   commonRenderer: CommonRenderer,
  //   dateRenderer: DateRenderer
  // };

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

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}&filterSalesOrder=${selectedType}`;
    if (accountDetails.accountId) {
      if (accountDetails.resource === customerAccount.accountResource) {
        deepFilter = `${deepFilter}&filterById=${JSON.stringify([
          {
            field: replaceFieldName('customerAccount'),
            term: accountDetails.accountId
          }
        ])}`;
      } else if (accountDetails.resource === supplierAccount.accountResource) {
        deepFilter = `${deepFilter}&filterById=${JSON.stringify([
          {
            field: replaceFieldName('supplierAccountName'),
            term: { $in: [accountDetails.accountId] }
          }
        ])}`;
      }
    }

    if (!isObjectEmpty(filters)) {
      const updatedFilters = [];

      Object.keys(filters).forEach((field) => {
        updatedFilters.push({
          field: replaceFieldName(field),
          term: filters[field].filter
        });
      });
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(updatedFilters))}&filterType=and`;
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${replaceFieldNameForSorting(sorting[0].colId)}&orderBy=${sorting[0].sort}`;
    }

    if (search) {
      deepFilter = `${deepFilter}&search=${search}`;
    }

    return deepFilter;
  };

  const fetchSalesOrder = async () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();

    if (gridApi) {
      gridApi.setRowData([]);
    }

    axiosInstance()
      .get(`${salesOrder.salesOrderApi}${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data.map((u) => {
          let finalObject = prepareDataForGrid(u, user);
          let res = {
            ...finalObject
            // canDelete: u.owner?.optionValue === user?.user._id,
            // allowedToEdit: [...(u.collaborator ?? []), u.owner].some((d) => d?.optionValue == user?.user?._id),
            // lead: u.staticData && u.staticData.lead && u.staticData.lead.concatedName,
            // leadId: u.staticData && u.staticData.lead && u.staticData.lead._id,
            // leadEntity: u.staticData && u.staticData.lead && u.staticData.lead?.entity,
            // approved: u.staticData?.approved,
            // isChecked: false,

            // masterAccount: u.parentHierarchy.length > 0 ? u.parentHierarchy.find((d) => d.parentAccount === '')?.accountName : '',
            // masterAccountId: u.parentHierarchy.length > 0 ? u.parentHierarchy.find((d) => d.parentAccount === '')?._id : ''
          };
          return res;
        });

        // let rows = data.map((u) => {
        //   const { owner, collaborator, createdBy, updatedBy, customerAccount, ...restProperties } = u;

        //   let res = {
        //     ...restProperties,
        //     id: u._id,
        //     ownerId: u.createdBy?.user?._id,
        //     createdBy: u.createdBy?.user?.concatedName,
        //     createdByDate: u.createdBy?.date,
        //     updatedBy: u.updatedBy?.user?.concatedName,
        //     updatedByDate: u.updatedBy?.date
        //   };
        //   return res;
        // });

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
        .put(`${salesOrder.salesOrderApi}/remove`, {
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
          fetchSalesOrder();
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
          <CustomBreadCrumbs routes={[routes.salesOrder]} />
        </Grid>
        <Grid item md={8} sm={1} xs={2}>
          <Grid container direction="row">
            <Grid item xs={12} sm={12}>
              <Grid container justify="flex-end">
                <ImportExportLinks
                  permissions={permissions.salesOrder}
                  module="salesOrder"
                  api={salesOrder.salesOrderApi}
                  afterImportCompleted={() => {}}
                  isExportAllOrSomeFeature={true}
                  total={rowCount}
                  recordsToExport={selectedRecords.length}
                  ids={selectedRecords.length ? selectedRecords.map((obj) => obj._id) : []}
                  onExportToExcelSuccess={() => {
                    if (gridApi) gridApi.deselectAll();
                    else fetchSalesOrder();
                  }}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Tables Begins Here */}
      <CustomContainer>
        <div className="header-panel">
          <SalesOrderHeader
            selectedRecords={selectedRecords}
            onTypeChange={handleSalesOrderTypeSel}
            options={SalesOrderType}
            onSearch={handleSearch}
            searchVal={search}
            SalesOrderPermissions={permissions.salesOrder}
            onCreate={clickCreateNew}
            showConfirmBox={showConfirmBox}
            canDelete={selectedRecords.length === 0}
            icon={<FaRegistered className="headerLogo" />}
            heading={routes.salesOrder.title}
            showTransferEntityDialog={handleTransferEntityDialog}
            columns={columns}
            dispatch={dispatch}
            // showCloneSalesOrderDialog={() => {
            //   handleShowCloneSalesOrderDialog()
            // }}
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
          </SalesOrderHeader>
        </div>

        {Object.keys(frameworkComponent).length > 0 &&
          isMobile && !isTablet ? (
            <CustomSwipableList 
            allowSelection={true}
            allowSwipe={true}
            permissions={permissions.salesOrder}
            primaryField={columns?.find(d=>d.field==="salesOrderNo")}
            onClick={(data) => {
              history.push(`${routes.salesOrderDetail.path}/${data._id}`)
            }}
            dataRows={dataRows}
            selectedRecords={selectedRecords}
            dispatch={dispatch}
            onEdit={(data) => {
              history.push(`${routes.salesOrderDetail.path}/${data._id}?openEdit=true`)
            }}
            extraParamsToCheckDelete={true}
            onDelete={(data) => {
              setSingleSalesOrderDelete({
                show: true,
                id: data._id,
                salesOrderName: `${data.salesOrderNo}`
              })
            }}
            rowCount={rowCount}
            page={page}
            loading={loading}
            additionalDetails={[
              {
                icon: <FaSuitcase size={18} />,
                field: "customerAccount"
              },
            ]}
            chips={[
              {
                icon:<MdContactPhone />,
                label: "Customer Contact: ",
                field: "customerContact"  
              },
              {
                icon:<RiContactsBookUploadFill />,
                label:"Billing Address: ",
                field:"billingAddress"
              },
              {
                icon:<RiShip2Fill />,
                label:"Shipping Address: ",
                field:"shippingAddress"
              },
              { 
                icon:<FaWarehouse />,
                label:"Plants: ",
                field:"plants"
              },
              {
                icon:<SiStatuspage/>,
                label:"Status: ",
                field:"status:"
              }
            ]}
            owerCollaboratorInitialsOrImages="owerCollaboratorInitialsOrImages"
            onCreate={false}
            showClone={true}
            onClone={(data) => {  setShowManageSalesOrderDialog({ open: true, isClone: true, idToClone: data._id })}}
            renderedFrom={salesOrderResource}
            
            
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
              renderedFrom={'salesOrderPage'}
              refreshGrid={fetchSalesOrder}
            />
          )}

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
            message={`Are you sure you want to delete ${deleteRecord?.salesOrderName ? 'Sales Order' : 'Sales Orders'}   ${
              deleteRecord.salesOrderName || ''
            }?`}
            onClose={() => {
              if (deleteRecord) setDeleteRecord({});
              setIsConformDialogVisible(false);
            }}
            okBtnLoading={deleteLoading}
            onOk={handleDeleteSalesOrder}
          />
        ) : null}

        {singleSalesOrderDelete.show ? (
          <ConfirmationDialog
            open={singleSalesOrderDelete.show}
            message={`Are you sure you want to delete Sales Order: ${singleSalesOrderDelete.salesOrderName}?`}
            onClose={() =>
              setSingleSalesOrderDelete({
                id: null,
                show: false,
                salesOrderName: ''
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
            fetchSalesOrder();
            setShowManageSalesOrderDialog({ open: false, isClone: false, idToClone: null });
          }}
        />
      )}
    </Fragment>
  );
};

export default SalesOrder;
