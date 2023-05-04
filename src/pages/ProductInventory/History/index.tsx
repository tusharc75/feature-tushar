import Box from '@material-ui/core/Box/Box';
import { useState, useEffect, useReducer, useContext, Fragment } from 'react';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import CustomAgGrid, { intialState, reducer } from '../../../components/AgGridComponents/CustomAgGrid';
import routes from '../../../components/Helpers/Routes';
import Grid from '@material-ui/core/Grid/Grid';
import axiosInstance from 'src/axios/axiosInstance';
import { gridLoadingTimeout, isObjectEmpty, productInventory } from 'src/constants/helpers';
import { prepareDataForGrid } from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';
import { CommonRenderer, DateTimeRenderer } from '../../../components/AgGridComponents/CustomAgGridCellRenderers';
import { capitalize } from 'lodash';
import { Link } from 'react-router-dom';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import { IconButton, Tooltip } from '@material-ui/core';
import { Autorenew } from '@material-ui/icons';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';

const History = ({ product, warehouse, storageLocation }) => {

  const toastConfig = useContext(CustomToastContext);
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, filters, sorting, } = state;
  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();

  const [isRevertConfirmation, setIsRevertConfirmation] = useState({ open: false, _id: "", product: "" });
  const [revertLoading, setRevertLoading] = useState(false);
  
  const renderedFrom = "Product_Inventory_History"

  useEffect(() => {
    fetchRecords();
  }, [page, limit, filters, sorting, selectedEntity]);

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

    if (warehouse) {
      deepFilter = `${deepFilter}&warehouse=${warehouse}`
    }
    if (storageLocation) {
      deepFilter = `${deepFilter}&storageLocation=${storageLocation}`
    }

    let filterById = [];
    if (filterById.length) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterById)}`
    }
    if (!isObjectEmpty(filters)) {
      const updatedFilters = [];
      Object.keys(filters).forEach((field) => {
        updatedFilters.push({
          field: field,
          term: filters[field].filter
        });
      });
      deepFilter = `${deepFilter}&deepFilter=${encodeURI(JSON.stringify(updatedFilters))}&filterType=and`;
    }
    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }
    return deepFilter;
  };

  const columns = [
    { field: 'date', headerName: 'Date', show: true, cellRenderer: 'dateTimeRenderer', filter: false, sortable: false },
    {
      field: 'referenceType', headerName: 'Reference Type', show: true,
      filter: false,
      sortable: false,
      cellRenderer: 'commonRenderer'
    },
    { field: 'reference', headerName: 'Reference', show: true, filter: false, sortable: false, cellRenderer: 'referenceRenderer' },
    {
      field: 'type', headerName: 'Type', show: true,
      filter: false,
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
          return { backgroundColor: '#90ee90' };
        }
        if (params?.data?.type === 'Debit') {
          return { backgroundColor: '#FFCCCB' };
        }
      }
    },
    { field: 'finalInventory', headerName: 'Final Inventory', show: true, cellRenderer: 'commonRenderer', filter: false, sortable: false },
    { field: 'price', headerName: 'Price', show: true, filter: false, cellRenderer: 'commonRenderer' },
    { field: 'totalPrice', headerName: 'Amount', show: true, filter: false, cellRenderer: 'commonRenderer' },
    ...(warehouse && warehouse?.split(",")?.length === 1 ? [
      {
        field: 'finalAvgPrice',
        headerName: 'Final Average Price',
        show: true,
        cellRenderer: 'commonRenderer',
        filter: false,
        sortable: false
      }
    ] : []),
    {
      field: 'warehouse',
      headerName: routes.warehouse.title,
      show: true,
      filter: false,
      sortable: false,
      cellRenderer: 'warehouseRenderer'
    },
    ...(user?.user?.brandPolicy?.storageLocation ? [
      {
        field: 'storageLocation',
        headerName: 'Storage Location',
        show: true,
        filter: false,
        sortable: false,
        cellRenderer: 'storageLocationRenderer'
      }
    ] : []),
    { field: 'comment', headerName: 'Comment', show: true, cellRenderer: 'commonRenderer', filter: false, sortable: false },
    { field: 'serialNumber', headerName: 'Serial Number', show: true, cellRenderer: 'commonRenderer', filter: false, sortable: false },
    { field: 'user', headerName: 'Transacted By', show: true, cellRenderer: 'userRenderer', filter: false, sortable: false },
    { field: 'purchaseOrderRejectedDate', headerName: 'Purchase Order Rejected Date', filter: false, sortable: false, cellRenderer: 'dateTimeRenderer' },
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
      <Link className="link" title={params.value} to={`${routes.warehouseDetail.path}/${params.data.warehouseId}`}>
        {params.value}
      </Link>
    ) : (
      <NoDataCell />
    );

  const StorageLocationRenderer = (params) =>
    params?.value ? (
      <Link className="link" title={params.value} to={`${routes.storageLocationDetail.path}/${params.data.storageLocationId}`}>
        {params.value}
      </Link>
    ) : (
      <NoDataCell />
    );

  const UserRenderer = (params) =>
    params?.value ? (
      <Link className="link" title={params.value} to={`${routes.userDetail.path}/${params.data.userId}`}>
        {params.value}
      </Link>
    ) : (
      <NoDataCell />
    );

  const ReferenceRenderer = (params) =>
    params?.value ? (
      params.data.referenceType === 'Purchase Order' ? (
        <Link className="link" title={params.value} to={`${routes.purchaseOrderDetail.path}/${params.data.referenceId}`}>
          {params.value}
        </Link>
      ) : params.data.referenceType === 'Transfer Inventory' ? (
        <Link className="link" title={params.value} to={`${routes.transferInventoryDetail.path}/${params.data.referenceId}`}>
          {params.value}
        </Link>
      ) : params.data.referenceType === 'Transfer Asset' ? (
        <Link className="link" title={params.value} to={`${routes.transferAssetDetail.path}/${params.data.referenceId}`}>
          {params.value}
        </Link>
      ) : params.data.referenceType === 'Sales Order' ? (
        <Link className="link" title={params.value} to={`${routes.salesOrderDetail.path}/${params.data.referenceId}`}>
          {params.value}
        </Link>
      ) : params.data.referenceType === 'Bulk Asset Creation' ? (
        <Link className="link" title={params.value} to={`${routes.bulkAssetCreationDetail.path}/${params.data.referenceId}`}>
          {params.value}
        </Link>
      ) : params.data.referenceType === 'Serialized Asset' ? (
        <Link className="link" title={params.value} to={`${routes.serializedAssetDetail.path}/${params.data.referenceId}`}>
          {params.value}
        </Link>
      ) : params.data.referenceType === 'Rental Job' ? (
        <Link className="link" title={params.value} to={`${routes.rentalManagementDetail.path}/${params.data.referenceId}`}>
          {params.value}
        </Link>
      ) : params.data.referenceType === 'Work Order' ? (
        <Link className="link" title={params.value} to={`${routes.workOrderDetail.path}/${params.data.referenceId}`}>
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
    setRevertLoading(true)
    let data = { comment: 'Reverted' };
    axiosInstance().put(`${productInventory.api}/${isRevertConfirmation.product}/ledger-revert/${isRevertConfirmation._id}`, data)
      .then(({ data: { data } }) => {
        setRevertLoading(false)
        setIsRevertConfirmation({ open: false, _id: "", product: "" })
        dispatch({ type: 'initialize', data: [], count: 0 });
        fetchRecords();
      })
      .catch((error) => {
        setRevertLoading(false)
        toastConfig.setToastConfig(error);
      });
  }

  const ActionsRenderer = (params) => (
    <>
      {['Product Inventory', 'Reverted'].includes(params.data.referenceType) && !params?.data?.reverted ? (
        <Box pl={1}>
          <Tooltip title="Revert">
            <IconButton
              size="small"
              aria-label="revert"
              onClick={() => {
                setIsRevertConfirmation({ open: true, _id: params?.data?._id, product: params?.data?.product })
              }}
            >
              <Autorenew fontSize="small" color="primary" />
            </IconButton>
          </Tooltip>
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
      <Grid item xs={12} md={12} sm={12} className="mt-3">
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
          <Box p={2} height={500} bgcolor="white">
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Grid>
      {isRevertConfirmation.open &&
        <ConfirmationDialog
          open={true}
          message={`Are you sure you want to revert ?`}
          onClose={() => {
            setIsRevertConfirmation({ open: false, _id: "", product: "" })
          }}
          okBtnLoading={revertLoading}
          onOk={handleRevert}
        />
      }
    </>
  );
};

export default History;
