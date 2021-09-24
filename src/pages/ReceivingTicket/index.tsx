import { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { Chip, Grid, IconButton, Tooltip } from '@material-ui/core';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { FaRegistered } from 'react-icons/fa';

import ManageReceivingTicketDialog from './ManageReceivingTicket';
import { isObjectEmpty, customerAccount, supplierAccount, gridLoadingTimeout, receivingTicket } from '../../constants/helpers';
import CustomContainer from '../../components/CustomContainer';
import routes from './../../components/Helpers/Routes';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import MessageDialog from '../../components/Helpers/MessageDialog';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import { CommonRenderer, CreatedByRenderer, DateRenderer, UpdatedByRenderer } from '../../components/AgGridComponents/CustomAgGridCellRenderers';
import GridDeleteIcon from '../../components/Helpers/GridDeleteIcon';
import CustomAgGrid, { reducer, intialState } from '../../components/AgGridComponents/CustomAgGrid';
import NoDataCell from '../../components/Helpers/NoDataCell';
import ReceivingTicketHeader from './ReceivingTicketHeader';

import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';

let receivingTicketTimeout;
const ReceivingTicketType = [
  {
    key: 'All Receiving Ticket',
    value: 1
  },
  {
    key: 'My Receiving Ticket',
    value: 2
  }
];

const ReceivingTicket = () => {
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
  const [showManageReceivingTicketDialog, setShowManageReceivingTicketDialog] = useState({ open: false, isClone: false, idToClone: null });
  const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] = useState(false);
  const [singleTicketDelete, setSingleTicketDelete] = useState({
    id: null,
    show: false,
    receivingJobName: ''
  });
  const [accountDetails, setAccountDetails] = useState({
    accountId: history.location?.state?.accountId,
    accountName: history.location?.state?.accountName,
    resource: history.location?.state?.resource
  });
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters,
    sorting, selectedRecords } = state;

  const columns = [
    {
      field: 'receivingJobName',
      headerName: 'Receiving Ticket Name',
      show: true,
      disabled: true,
      cellRenderer: 'receivingJobNameRenderer'
    },
    {
      field: 'deliveryPerson',
      headerName: 'Delivery Person',
      show: true,
      cellRenderer: 'deliveryPersonRenderer'
    },
    {
      field: 'customerAccount',
      headerName: 'Customer Account',
      show: true,
      cellRenderer: 'customerAccountRenderer'
    },
    {
      field: 'productInventory',
      headerName: 'Product Inventory',
      show: true,
      disabled: false,
      cellRenderer: 'commonRenderer'
    },
    {
      field: 'status',
      headerName: 'Status',
      show: true,
      disabled: false,
      cellRenderer: 'commonRenderer'
    },
    {
      field: 'warehouse',
      headerName: 'Warehouse',
      show: true,
      disabled: false,
      cellRenderer: 'WarehouseRenderer'
    },
    {
      field: 'pickupDate',
      headerName: 'Pickup Date',
      show: true,
      disabled: true,
      cellRenderer: 'dateRenderer'
    },
    {
      field: 'pickupAddress',
      headerName: 'Pickup Address',
      show: true,
      disabled: true,
      cellRenderer: 'commonRenderer'
    },
    {
      field: 'createdBy',
      headerName: 'Created By',
      show: true,
      cellRenderer: 'createdByRenderer'
    },
    {
      field: 'updatedBy',
      headerName: 'Updated By',
      show: true,
      cellRenderer: 'updatedByRenderer'
    },
  ];
  //  Grid Variables - End

  useEffect(() => {
    let millisec = Object.keys(search).length > 0 ? 600 : 5;
    if (receivingTicketTimeout) {
      clearTimeout(receivingTicketTimeout);
    }

    receivingTicketTimeout = setTimeout(() => {
      fetchReceivingTickets();
    }, millisec);
    // eslint-disable-next-line
  }, [search]);

  useEffect(() => {
    if (renderCount > 0) {
      fetchReceivingTickets();
    } else setRenderCount((preCount) => preCount + 1);
  }, [page, limit, selectedType, filters, sorting, accountDetails, selectedEntity]);

  const handleSingleDeleteReceivingTicket = async () => {
    dispatch({ type: 'loading', loading: true });

    axiosInstance()
      .put(`${receivingTicket.receivingTicketApi}/remove`, {
        ids: [singleTicketDelete.id]
      })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchReceivingTickets();
        dispatch({ type: 'loading', loading: false });
        setSingleTicketDelete({ id: null, show: false, receivingJobName: '' });
      })
      .catch((error) => {
        dispatch({ type: 'loading', loading: false });
        toastConfig.setToastConfig(error);
      });
  };

  const ReceivingJobNameRenderer = (params) => (
    <>
      <Link className="text-truncate link" title={params.value} to={`${routes.receivingTicket.path}/detail/${params.data._id}`}>
        {params.value}
      </Link>
    </>
  );

  const DeliveryPersonRenderer = (params) => (
    <>
      {params.value ? (
        <Link className="link" title={params.value} to={`${routes.userDetail.path}/${params.data.deliveryPersonId}`}>
          {params.value}
        </Link>
      ) : (
        <NoDataCell />
      )}
    </>
  );

  const CustomerAccountRenderer = (params) => <>
    {
      params.value ?
        <Link
          className="link"
          title={params.value}
          to={`${routes.customerAccount.path}/detail/${params.data.customerAccountId}`}
        >
          {params.value}
        </Link> : <NoDataCell />
    }
  </>
  const WarehouseRenderer = (params) => <>
    {
      params.value ?
        <Link
          className="link"
          title={params.value}
          to={`${routes.address.path}/detail/${params.data.warehouseId}`}
        >
          {params.value}
        </Link> : <NoDataCell />
    }
  </>

  // const ProductInventoryRenderer = (params) => (
  //   <>
  //     {params.value ? (
  //       <Link className="link" to={`${routes.opportunityDetail.path}/${params.data.relatedOpportunityId}`} title={params.value}>
  //         {params.value}
  //       </Link>
  //     ) : (
  //       <NoDataCell />
  //     )}
  //   </>
  // );

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
      {permissions.receivingTicket.isCreate ? (
        <Tooltip title="Clone">
          <IconButton
            size="small"
            aria-label="Clone"
            onClick={() => {
              setShowManageReceivingTicketDialog({ open: true, isClone: true, idToClone: params.data._id });
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
        hasDeletePermission={permissions.receivingTicket.isDelete}
        ownerId={params.data.ownerId}
        userId={user?.user?._id}
        onDelete={() =>
          setSingleTicketDelete({
            show: true,
            id: params.data._id,
            receivingJobName: `${params.data.receivingJobName}`
          })
        }
        entity="receivingTicket"
      />
    </>
  );

  const frameworkComponents = {
    receivingJobNameRenderer: ReceivingJobNameRenderer,
    deliveryPersonRenderer: DeliveryPersonRenderer,
    customerAccountRenderer: CustomerAccountRenderer,
    warehouseRenderer: WarehouseRenderer,
    // productInventoryRenderer: ProductInventoryRenderer,
    ownerRenderer: OwnerRenderer,
    createdByRenderer: CreatedByRenderer,
    updatedByRenderer: UpdatedByRenderer,
    actionsRenderer: ActionsRenderer,
    commonRenderer: CommonRenderer,
    dateRenderer: DateRenderer
  };

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
    let deepFilter = `?page=${page}&limit=${limit}&filterReceivingTickets=${selectedType}`;

    if (selectedEntity) {
      deepFilter = `${deepFilter}&entity=${selectedEntity}`;
    }

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
      deepFilter = `${deepFilter}&deepFilter=${JSON.stringify(updatedFilters)}&filterType=and`;
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${replaceFieldNameForSorting(sorting[0].colId)}&orderBy=${sorting[0].sort}`;
    }

    if (search) {
      deepFilter = `${deepFilter}&search=${search}`;
    }

    return deepFilter;
  };

  const fetchReceivingTickets = async () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();

    if (gridApi) {
      gridApi.setRowData([]);
    }

    axiosInstance()
      .get(`${receivingTicket.receivingTicketApi}${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data.map((u) => {
          const { owner, collaborator, createdBy, updatedBy, customerAccount, ...restProperties } = u;

          let res = {
            ...restProperties,
            id: u._id,
            pickupDate: u["pick-UpDate"],
            productInventory: u.productInventory?.map(p => p.optionLabel).join(", "),
            deliveryPerson: u.deliveryPerson?.optionLabel,
            deliveryPersonId: u.deliveryPerson?.optionValue,
            warehouse: u.warehouse?.optionLabel,
            warehouseId: u.warehouse?.optionValue,
            customerAccount: u.customerAccount?.optionLabel,
            customerAccountId: u.customerAccount?.optionValue,
            owner: u.createdBy?.user?.concatedName,
            ownerId: u.createdBy?.user?._id,
            createdBy: u.createdBy?.user?.concatedName,
            createdByDate: u.createdBy?.date,
            updatedBy: u.updatedBy?.user?.concatedName,
            updatedByDate: u.updatedBy?.date
          };
          return res;
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

  const handleReceivingTicketTypeSel = (filterValues) => {
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
    setShowManageReceivingTicketDialog({ open: true, isClone: false, idToClone: null });
  };

  const handleDeleteReceivingTicket = async () => {
    setDeleteLoading(true);
    let recordsToDelete = [];
    if (deleteRecord?._id) {
      recordsToDelete.push(deleteRecord?._id);
    } else {
      recordsToDelete = selectedRecords.map((o) => o._id);
    }
    if (recordsToDelete.length > 0) {
      axiosInstance()
        .put(`${receivingTicket.receivingTicketApi}/remove`, {
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
          fetchReceivingTickets();
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
          <CustomBreadCrumbs routes={[routes.receivingTicket]} />
        </Grid>
        <Grid item md={8} sm={1} xs={2}>
          <Grid container direction="row">
            <Grid item xs={12} sm={12}>
              <Grid container justify="flex-end">
                <ImportExportLinks
                  permissions={permissions.receivingTicket}
                  module="receivingTicket"
                  api={receivingTicket.receivingTicketApi}
                  afterImportCompleted={() => { }}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Tables Begins Here */}
      <CustomContainer>
        <div className="header-panel">
          <ReceivingTicketHeader
            selectedRecords={selectedRecords}
            onTypeChange={handleReceivingTicketTypeSel}
            options={ReceivingTicketType}
            onSearch={handleSearch}
            searchVal={search}
            ReceivingTicketPermissions={permissions.receivingTicket}
            onCreate={clickCreateNew}
            showConfirmBox={showConfirmBox}
            canDelete={selectedRecords.length === 0}
            icon={<FaRegistered className="headerLogo" />}
            heading={routes.receivingTicket.title}
            showTransferEntityDialog={handleTransferEntityDialog}
          // showCloneReceivingTicketDialog={() => {
          //   handleShowCloneReceivingTicketDialog()
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
          </ReceivingTicketHeader>
        </div>

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
          renderedFrom={'receivingTicketPage'}
        />

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
            message={`Are you sure you want to delete ${deleteRecord?.receivingJobName ? 'Receiving Ticket' : 'Receiving Tickets'}   ${deleteRecord.receivingJobName || ''
              }?`}
            onClose={() => {
              if (deleteRecord) setDeleteRecord({});
              setIsConformDialogVisible(false);
            }}
            okBtnLoading={deleteLoading}
            onOk={handleDeleteReceivingTicket}
          />
        ) : null}

        {singleTicketDelete.show ? (
          <ConfirmationDialog
            open={singleTicketDelete.show}
            message={`Are you sure you want to delete Receiving Ticket: ${singleTicketDelete.receivingJobName}?`}
            onClose={() =>
              setSingleTicketDelete({
                id: null,
                show: false,
                receivingJobName: ''
              })
            }
            onOk={handleSingleDeleteReceivingTicket}
          />
        ) : null}
      </CustomContainer>
      {showManageReceivingTicketDialog.open && (
        <ManageReceivingTicketDialog
          isClone={showManageReceivingTicketDialog.isClone}
          open={showManageReceivingTicketDialog.open}
          receivingTicketId={showManageReceivingTicketDialog.idToClone}
          onClose={() => setShowManageReceivingTicketDialog({ open: false, isClone: false, idToClone: null })}
          onSuccess={() => {
            fetchReceivingTickets();
            setShowManageReceivingTicketDialog({ open: false, isClone: false, idToClone: null });
          }}
        />
      )}
    </Fragment>
  );
};

export default ReceivingTicket;
