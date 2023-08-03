import Box from '@material-ui/core/Box/Box';
import { useState, useEffect, useReducer, useContext, Fragment } from 'react';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import CustomAgGrid, { intialState, reducer } from '../../../components/AgGridComponents/CustomAgGrid';
import routes from '../../../components/Helpers/Routes';
import Grid from '@material-ui/core/Grid/Grid';
import axiosInstance from 'src/axios/axiosInstance';
import { gridLoadingTimeout, isObjectEmpty, productInventory, sidebarResource } from 'src/constants/helpers';
import { prepareDataForGrid } from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';
import { CommonRenderer, DateTimeRenderer } from '../../../components/AgGridComponents/CustomAgGridCellRenderers';
import { capitalize } from 'lodash';
import { Link } from 'react-router-dom';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import { IconButton, TextField } from '@material-ui/core';
import { Autorenew } from '@material-ui/icons';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import { Autocomplete } from '@material-ui/lab';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import RevertQtyDialog from './RevertQtyDialog';
import { useAppTheme } from 'src/constants/AppConfig';
import DurationFilter from 'src/components/DurationFilter';
import moment from 'moment';

const History = ({ product, warehouse, storageLocation }) => {
  const [themeColor] = useAppTheme();
  const isDarkTheme = themeColor === 'dark';
  const toastConfig = useContext(CustomToastContext);
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, filters, sorting } = state;
  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();

  const [isRevertConfirmation, setIsRevertConfirmation] = useState({ open: false, _id: '', product: '' });
  const [revertLoading, setRevertLoading] = useState(false);

  const [warehouseOptions, setWarehouseOptions] = useState(null);
  const [storageLocationOptions, setStorageLocationOptions] = useState([]);

  const [selectedWarehouse, setSelectedWarehouse] = useState(warehouse && warehouse?.split(',')?.length === 1 ? warehouse : 'All');
  const [selectedStorageLocation, setSelectedStorageLocation] = useState(storageLocation);

  const [revertQtyDialog, setRevertQtyDialog] = useState({ open: false, productName: '', product: '', qty: 0, revertedQty: 0, ledgerId: '' });

  const [duration, setDuration] = useState({
    from: new Date(moment().subtract('1', 'year').calendar()),
    to: new Date(),
  })

  const renderedFrom = 'Product_Inventory_History';

  useEffect(() => {
    getWarehouse();
  }, []);

  useEffect(() => {
    if (warehouseOptions) {
      fetchRecords();
    }
  }, [page, limit, filters, sorting, selectedEntity, selectedWarehouse, selectedStorageLocation, warehouseOptions, duration]);

  const fetchRecords = async () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    const queryString = getQueryString();

    const response = await axiosInstance().get(`/history/product-ledger/${product}${queryString}`);
    let rows = response?.data?.data?.map((u) => {
      let finalObject: any = prepareDataForGrid(u, user);
      finalObject.type = capitalize(u.type);
      finalObject.serialNumber = u?.serialNumber?.map((e) => e.serialNumber)?.toString();
      return finalObject;
    });
    dispatch({ type: 'initialize', data: rows, count: response?.data?.count });
    setTimeout(() => {
      dispatch({ type: 'loading', loading: false });
    }, gridLoadingTimeout);
  };

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}`;

    if (selectedWarehouse) {
      let tempWarehouse =
        selectedWarehouse === 'All'
          ? warehouseOptions
            ?.filter((d) => d.optionValue !== 'All')
            .map((d) => d.optionValue)
            .toString()
          : selectedWarehouse;

      deepFilter = `${deepFilter}&warehouse=${tempWarehouse}`;
    }

    if (selectedStorageLocation) {
      deepFilter = `${deepFilter}&storageLocation=${selectedStorageLocation}`;
    }

    let filterById = [];
    if (filterById.length) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterById)}`;
    }
    const updatedFilters = [];
    if (!isObjectEmpty(filters)) {
      Object.keys(filters).forEach((field) => {
        updatedFilters.push({
          field: field,
          term: filters[field].filter
        });
      });
    }
    if (duration) {
      updatedFilters.push({
        field: 'date',
        term: {
          from: moment(duration?.from).format('MM/DD/YYYY'),
          to: moment(duration?.to).format('MM/DD/YYYY')
        }
      })
    }
    if (updatedFilters?.length > 0) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURI(JSON.stringify(updatedFilters))}&filterType=and`;
    }
    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }
    return deepFilter;
  };

  const getWarehouse = () => {
    axiosInstance()
      .get('/sa-formbuilder/lookup?lookupResource=Warehouse,Storage Location')
      .then(({ data: { data } }) => {
        setWarehouseOptions([{ optionLabel: 'All', optionValue: 'All' }, ...data.Warehouse]);
        setStorageLocationOptions(data['Storage Location'] || []);
      });
  };

  const columns = [
    { field: 'date', headerName: 'Date', show: true, cellRenderer: 'dateTimeRenderer', filter: false, sortable: false },
    {
      field: 'referenceType',
      headerName: 'Reference Type',
      show: true,
      filter: true,
      sortable: false,
      cellRenderer: 'commonRenderer'
    },
    { field: 'reference', headerName: 'Reference', show: true, filter: false, sortable: false, cellRenderer: 'referenceRenderer' },
    {
      field: 'type',
      headerName: 'Type',
      show: true,
      filter: true,
      sortable: false,
      cellRenderer: 'commonRenderer'
    },
    {
      field: 'qty',
      headerName: 'Credit/Debit',
      show: true,
      cellRenderer: 'creditDebitRenderer',
      filter: false,
      sortable: false,
      cellStyle: (params) => {
        if (params?.data?.type === 'Credit') {
          return { backgroundColor: isDarkTheme ? 'hsl(120 73% 40% / 1)' : '#90ee90' };
        }
        if (params?.data?.type === 'Debit') {
          return { backgroundColor: isDarkTheme ? 'hsl(1 100% 65% / 1)' : '#FFCCCB' };
        }
      }
    },
    ...(!user?.user?.brandPolicy?.hideInventoryCount ? [{ field: 'finalInventory', headerName: 'Final Inventory', show: true, cellRenderer: 'commonRenderer', filter: false, sortable: false }] : []),
    { field: 'price', headerName: 'Cost', show: true, filter: false, cellRenderer: 'commonRenderer' },
    { field: 'totalPrice', headerName: 'Amount', show: true, filter: false, cellRenderer: 'commonRenderer' },
    ...(warehouse && warehouse?.split(',')?.length === 1
      ? [
        {
          field: 'finalAvgPrice',
          headerName: 'Final Average Cost',
          show: true,
          cellRenderer: 'commonRenderer',
          filter: false,
          sortable: false
        }
      ]
      : []),
    {
      field: 'warehouse',
      headerName: routes.warehouse.title,
      show: true,
      filter: false,
      sortable: false,
      cellRenderer: 'warehouseRenderer'
    },
    ...(user?.user?.brandPolicy?.storageLocation
      ? [
        {
          field: 'storageLocation',
          headerName: 'Storage Location',
          show: true,
          filter: false,
          sortable: false,
          cellRenderer: 'storageLocationRenderer'
        }
      ]
      : []),
    { field: 'supplierPartNumber', headerName: 'Supplier Part Number', show: true, cellRenderer: 'commonRenderer', filter: true, sortable: false },
    { field: 'comment', headerName: 'Comment', show: true, cellRenderer: 'commonRenderer', filter: true, sortable: false },
    { field: 'serialNumber', headerName: 'Serial Number', show: true, cellRenderer: 'commonRenderer', filter: false, sortable: false },
    { field: 'user', headerName: 'Transacted By', show: true, cellRenderer: 'userRenderer', filter: true, sortable: false },
    { field: 'transactionDate', headerName: 'Actual Transaction Date', show: false, filter: false, sortable: false, cellRenderer: 'dateTimeRenderer' }
  ];

  const columnState = JSON.parse(localStorage.getItem(renderedFrom));
  if (columnState) {
    columns.forEach((item) => {
      columnState.forEach((d) => {
        if (d.colId === item.field) {
          item.show = !d.hide;
        }
      });
    });
  }

  const CreditDebitRenderer = (params: any) => (
    <span>{params?.value ? params?.data?.type === 'Debit' ? `-${params?.value}` : params?.value : <NoDataCell />}</span>
  );

  const WarehouseRenderer = (params) =>
    params?.value ? (
      <Link className="link" target="_blank" title={params.value} to={`${routes.warehouseDetail.path}/${params.data.warehouseId}`}>
        {params.value}
      </Link>
    ) : (
      <NoDataCell />
    );

  const StorageLocationRenderer = (params) =>
    params?.value ? (
      <Link className="link" target="_blank" title={params.value} to={`${routes.storageLocationDetail.path}/${params.data.storageLocationId}`}>
        {params.value}
      </Link>
    ) : (
      <NoDataCell />
    );

  const UserRenderer = (params) =>
    params?.value ? (
      <Link className="link" target="_blank" title={params.value} to={`${routes.userDetail.path}/${params.data.userId}`}>
        {params.value}
      </Link>
    ) : (
      <NoDataCell />
    );

  const ReferenceRenderer = (params) =>
    params?.value ? (
      params.data.referenceType === 'Purchase Order' ? (
        <Link className="link" target="_blank" title={params.value} to={`${routes.purchaseOrderDetail.path}/${params.data.referenceId}`}>
          {params.value}
        </Link>
      ) : params.data.referenceType === 'Transfer Inventory' ? (
        <Link className="link" target="_blank" title={params.value} to={`${routes.transferInventoryDetail.path}/${params.data.referenceId}`}>
          {params.value}
        </Link>
      ) : params.data.referenceType === 'Transfer Asset' ? (
        <Link className="link" target="_blank" title={params.value} to={`${routes.transferAssetDetail.path}/${params.data.referenceId}`}>
          {params.value}
        </Link>
      ) : params.data.referenceType === 'Sales Order' ? (
        <Link className="link" target="_blank" title={params.value} to={`${routes.salesOrderDetail.path}/${params.data.referenceId}`}>
          {params.value}
        </Link>
      ) : params.data.referenceType === 'Bulk Asset Creation' ? (
        <Link className="link" target='_blank' title={params.value} to={`${routes.bulkAssetCreationDetail.path}/${params.data.referenceId}`}>
          {params.value}
        </Link>
      ) : params.data.referenceType === 'Serialized Asset' ? (
        <Link className="link" target="_blank" title={params.value} to={`${routes.serializedAssetDetail.path}/${params.data.referenceId}`}>
          {params.value}
        </Link>
      ) : params.data.referenceType === 'Rental Job' ? (
        <Link className="link" target="_blank" title={params.value} to={`${routes.rentalManagementDetail.path}/${params.data.referenceId}`}>
          {params.value}
        </Link>
      ) : params.data.referenceType === 'Work Order' ? (
        <Link className="link" target="_blank" title={params.value} to={`${routes.workOrderDetail.path}/${params.data.referenceId}`}>
          {params.value}
        </Link>
      ) : params.data.referenceType === sidebarResource.fieldTicket ? (
        <Link className="link" target="_blank" title={params.value} to={`${routes.fieldTicketDetail.path}/${params.data.referenceId}`}>
          {params.value}
        </Link>
      ) : (
        params.value
      )
    ) : params.data.referenceType === 'Product Inventory' ? (
      <p>Manual Entry</p>
    ) : (
      <NoDataCell />
    );

  const handleRevert = () => {
    setRevertLoading(true);
    let data = { comment: 'Reverted' };
    axiosInstance()
      .put(`${productInventory.api}/${isRevertConfirmation.product}/ledger-revert/${isRevertConfirmation._id}`, data)
      .then(({ data: { data } }) => {
        setRevertLoading(false);
        setIsRevertConfirmation({ open: false, _id: '', product: '' });
        dispatch({ type: 'initialize', data: [], count: 0 });
        fetchRecords();
      })
      .catch((error) => {
        setRevertLoading(false);
        toastConfig.setToastConfig(error);
      });
  };

  const ActionsRenderer = (params) => (
    <>
      {(['Product Inventory', 'Reverted'].includes(params.data.referenceType) && !params?.data?.reverted) ||
        ([sidebarResource.workOrder, sidebarResource.fieldTicket].includes(params.data.referenceType) &&
          params.data.type?.toLowerCase() === 'debit' &&
          params.data.qty - (params.data?.revertedQty || 0) > 0) ? (
        <Box pl={1}>
          <HtmlTooltip title="Revert">
            <IconButton
              size="small"
              aria-label="revert"
              onClick={() => {
                if ([sidebarResource.workOrder, sidebarResource.fieldTicket].includes(params.data.referenceType)) {
                  setRevertQtyDialog({
                    open: true,
                    productName: '',
                    product: params.data.product,
                    qty: params.data.qty,
                    revertedQty: params?.data?.revertedQty || 0,
                    ledgerId: params.data._id
                  });
                } else {
                  setIsRevertConfirmation({ open: true, _id: params?.data?._id, product: params?.data?.product });
                }
              }}
            >
              <Autorenew fontSize="small" color="primary" />
            </IconButton>
          </HtmlTooltip>
        </Box>
      ) : null}
    </>
  );

  const frameworkComponents = {
    referenceRenderer: ReferenceRenderer,
    warehouseRenderer: WarehouseRenderer,
    storageLocationRenderer: StorageLocationRenderer,
    userRenderer: UserRenderer,
    creditDebitRenderer: CreditDebitRenderer,
    commonRenderer: CommonRenderer,
    dateTimeRenderer: DateTimeRenderer,
    actionsRenderer: ActionsRenderer
  };

  return (
    <>
      {warehouseOptions && (
        <Grid container justifyContent='space-between'>
          <Grid item md={10} sm={10} xs={10}>
            <Grid container spacing={2} justifyContent='space-between'>
              <Grid item md={3} sm={6} xs={12}>
                <Autocomplete
                  options={warehouseOptions}
                  getOptionLabel={(option: any) => option.optionLabel}
                  disableClearable
                  getOptionSelected={(option: any, val) => option.optionValue === val}
                  value={
                    warehouseOptions.filter((data) => data.optionValue === selectedWarehouse).length
                      ? warehouseOptions.filter((data) => data.optionValue === selectedWarehouse)[0]
                      : ''
                  }
                  onChange={(e, val) => {
                    if (val !== null) {
                      setSelectedWarehouse(val && val.optionValue ? val.optionValue : '');
                      setSelectedStorageLocation(null);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField {...params} margin="dense" name="plant" label={routes.warehouse.title} variant="outlined" fullWidth />
                  )}
                />
              </Grid>
              <Grid item md={3} sm={6} xs={12}>
                {user?.user?.brandPolicy?.storageLocation && (
                  <Autocomplete
                    options={storageLocationOptions.filter((item) => item.warehouse === selectedWarehouse)}
                    getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
                    getOptionSelected={(option: any, val) => option.optionValue === val}
                    value={
                      storageLocationOptions.filter((data) => data.optionValue === selectedStorageLocation).length
                        ? storageLocationOptions.filter((data) => data.optionValue === selectedStorageLocation)[0]
                        : ''
                    }
                    onChange={(e, val) => {
                      setSelectedStorageLocation(val?.optionValue);
                    }}
                    renderInput={(params) => (
                      <TextField {...params} margin="dense" name="storageLocation" label="Storage Location" variant="outlined" fullWidth />
                    )}
                  />
                )}
              </Grid>
              <Grid item md={6} sm={12} xs={12}>
                <Box mt={1}>
                  <DurationFilter
                    label={"Product Inventory"}
                    duration={duration}
                    setDuration={setDuration}
                    disabled={false}
                  />
                </Box>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      )}
      <Grid item xs={12} md={12} sm={12}>
        {columns ? (
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
            allowAction={true}
            loading={loading}
            allowSelection={false}
            renderedFrom={renderedFrom}
            refreshGrid={fetchRecords}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Grid>
      {isRevertConfirmation.open && (
        <ConfirmationDialog
          open={true}
          message={`Are you sure you want to revert ?`}
          onClose={() => {
            setIsRevertConfirmation({ open: false, _id: '', product: '' });
          }}
          okBtnLoading={revertLoading}
          onOk={handleRevert}
        />
      )}
      {revertQtyDialog.open && (
        <RevertQtyDialog
          referenceType="productInventory"
          productName={revertQtyDialog.productName}
          product={revertQtyDialog.product}
          qty={revertQtyDialog.qty}
          revertedQty={revertQtyDialog.revertedQty}
          ledgerId={revertQtyDialog.ledgerId}
          onClose={() => {
            setRevertQtyDialog({ open: false, productName: '', product: '', qty: 0, revertedQty: 0, ledgerId: '' });
          }}
          onSuccess={() => {
            setRevertQtyDialog({ open: false, productName: '', product: '', qty: 0, revertedQty: 0, ledgerId: '' });
            dispatch({ type: 'initialize', data: [], count: 0 });
            fetchRecords();
          }}
        />
      )}
    </>
  );
};

export default History;
