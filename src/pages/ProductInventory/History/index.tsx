import Box from '@material-ui/core/Box/Box';
import { useState, useEffect, useReducer, useContext, Fragment } from 'react';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import CustomAgGrid, { intialState, reducer } from '../../../components/AgGridComponents/CustomAgGrid';
import routes from '../../../components/Helpers/Routes';
import Grid from '@material-ui/core/Grid/Grid';
import axiosInstance from 'src/axios/axiosInstance';
import { gridLoadingTimeout, productInventory } from 'src/constants/helpers';
import { prepareDataForGrid } from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';
import { CommonRenderer, DateTimeRenderer } from '../../../components/AgGridComponents/CustomAgGridCellRenderers';
import { capitalize } from 'lodash';
import { Link } from 'react-router-dom';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import { IconButton, Tooltip } from '@material-ui/core';
import { Autorenew } from '@material-ui/icons';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const History = ({ product, warehouse }) => {
  const toastConfig = useContext(CustomToastContext);
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes } = state;
  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    let data;
    const query = warehouse ? `?warehouse=${warehouse}` : ``;
    const response = await axiosInstance().get(`/history/product-ledger/${product}${query}`);
    data = response?.data?.data;
    let rows = data.map((u) => {
      let finalObject: any = prepareDataForGrid(u, user);
      finalObject.type = capitalize(u.type);
      finalObject.serialNumber = u?.serialNumber?.map((e) => e.serialNumber)?.toString();
      return finalObject;
    });

    var qty = 0;
    rows
      ?.slice()
      .reverse()
      .forEach(function (item) {
        if (item.type === 'Credit') {
          qty = qty + item?.qty;
        } else {
          qty = qty - item?.qty;
        }
        item.finalInventory = qty;
      });
    dispatch({ type: 'initialize', data: rows, count: rows.length });
    setTimeout(() => {
      dispatch({ type: 'loading', loading: false });
    }, gridLoadingTimeout);
  };

  const columns = [
    { field: 'date', headerName: 'Date', show: true, cellRenderer: 'dateTimeRenderer', filter: false, sortable: false },
    { field: 'referenceType', headerName: 'Reference Type', show: true, cellRenderer: 'commonRenderer' },
    { field: 'reference', headerName: 'Reference', show: true, filter: false, sortable: false, cellRenderer: 'referenceRenderer' },
    { field: 'type', headerName: 'Type', show: true, cellRenderer: 'commonRenderer' },
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
    { field: 'warehouse', headerName: 'Plant', show: true, cellRenderer: 'commonRenderer' },
    { field: 'comment', headerName: 'Comment', show: true, cellRenderer: 'commonRenderer' },
    { field: 'serialNumber', headerName: 'Serial Number', show: true, cellRenderer: 'commonRenderer' },
    { field: 'user', headerName: 'Transacted By', show: true, cellRenderer: 'commonRenderer' }
  ];

  const CreditDebitRenderer = (params: any) => (
    <span>{params?.value ? params?.data?.type === 'Debit' ? `-${params?.value}` : params?.value : <NoDataCell />}</span>
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
      ) : (
        params.value
      )
    ) : params.data.referenceType === 'Product Inventory' ? (
      <p>Manual Entry</p>
    ) : (
      <NoDataCell />
    );

  const ActionsRenderer = (params) => (
    <>
      {params?.data?.type === 'Credit' && params.data.referenceType === 'Product Inventory' ? <Box pl={1}>
        <Tooltip title="Revert">
          <IconButton
            size="small"
            aria-label="revert"
            onClick={() => {
              let data = {
                comment: "Reverted"
              };
              axiosInstance()
                .put(`${productInventory.api}/${params?.data?.product}/ledger-revert/${params?.data?._id}`, data)
                .then(({ data: { data } }) => {
                  dispatch({ type: 'initialize', data: [], count: 0 });
                  fetchRecords();
                })
                .catch((error) => {
                  toastConfig.setToastConfig(error);
                });
            }}
          >
            <Autorenew fontSize="small" color="primary" />
          </IconButton>
        </Tooltip>
      </Box>
        : null
      }
    </>
  );

  const frameworkComponents = {
    referenceRenderer: ReferenceRenderer,
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
            isClientSideGrid={true}
            allowSelection={false}
            renderedFrom={'product_history'}
            refreshGrid={fetchRecords}
          />
        ) : (
          <Box p={2} height={500} bgcolor="white">
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Grid>
    </>
  );
};

export default History;
