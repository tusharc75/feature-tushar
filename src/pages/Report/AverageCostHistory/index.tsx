import Box from '@material-ui/core/Box/Box';
import { useEffect } from 'react';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import routes from '../../../components/Helpers/Routes';
import Grid from '@material-ui/core/Grid/Grid';
import axiosInstance from 'src/axios/axiosInstance';
import { dateTimeFormat, gridLoadingTimeout, productInventory } from 'src/constants/helpers';
import { prepareDataForGrid } from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';
import { capitalize } from 'lodash';
import { Link } from 'react-router-dom';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import Dialog from '@material-ui/core/Dialog';
import { CustomDialogTransition } from '../../../constants/helpers';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import { useAppTheme } from 'src/constants/AppConfig';
import moment from 'moment';

const renderedFrom = 'product_price_history';

const AverageCostHistory = ({ handleClose, product, productName, showPricefilter }) => {
  const [themeColor] = useAppTheme();
  const isDarkTheme = themeColor === 'dark';

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const {
    state: { user }
  }: any = useData();

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    dispatch({ type: 'loading', loading: true });

    let data;
    let query = '';
    if (showPricefilter?.warehouse || showPricefilter?.fromDate) {
      query = '?';
      if (showPricefilter?.warehouse) {
        query = query + `warehouse=${JSON.stringify(showPricefilter?.warehouse)}&`;
      }
      if (showPricefilter?.fromDate) {
        query = query + `from=${showPricefilter?.fromDate}&to=${showPricefilter?.toDate}`;
      }
    }
    const response = await axiosInstance().get(`/report/inventory-evaluation-by-product/${product}${query}`);
    data = response?.data?.data;
    let rows = data.map((u) => {
      let finalObject: any = prepareDataForGrid(u, user);
      finalObject.type = capitalize(u.type);
      return finalObject;
    });
    dispatch({ type: 'initialize', data: rows, count: rows.length });
    setTimeout(() => {
      dispatch({ type: 'loading', loading: false });
    }, gridLoadingTimeout);
  };

  const curr = user?.user?.brandCurrency || '';

  const columns = [
    {
      accessor: 'date',
      Header: 'Date',
      disableFilters: true,
      disableSortBy: false,
      Cell: ({ row }) =>
        row?.original?.date ? (
          <h5 className="text-truncate" title={`${moment(row?.original?.date)?.format(dateTimeFormat)}`}>
            {moment(row?.original?.date)?.format(dateTimeFormat)}
          </h5>
        ) : (
          <NoDataCell />
        )
    },
    {
      accessor: 'referenceType',
      Header: 'Reference Type',
      Cell: ({ row }) =>
        row?.original?.referenceType ? (
          <h5 className="text-truncate" title={row?.original?.referenceType}>
            {row?.original?.referenceType}
          </h5>
        ) : (
          <NoDataCell />
        )
    },
    {
      accessor: 'reference',
      Header: 'Reference',
      disableFilters: true,
      disableSortBy: false,
      Cell: ({ row }) =>
        row?.original?.reference ? (
          row?.original?.referenceType === 'Purchase Order' ? (
            <Link
              className="link"
              title={row?.original?.reference}
              to={`${routes.purchaseOrderDetail.path}/${row?.original?.referenceId}`}
              target="_blank"
            >
              {row?.original?.reference}
            </Link>
          ) : row?.original?.referenceType === 'Transfer Inventory' ? (
            <Link
              className="link"
              title={row?.original?.reference}
              to={`${routes.transferInventoryDetail.path}/${row?.original?.referenceId}`}
              target="_blank"
            >
              {row?.original?.reference}
            </Link>
          ) : row?.original?.referenceType === 'Transfer Asset' ? (
            <Link
              className="link"
              title={row?.original?.reference}
              to={`${routes.transferAssetDetail.path}/${row?.original?.referenceId}`}
              target="_blank"
            >
              {row?.original?.reference}
            </Link>
          ) : row?.original?.referenceType === 'Sales Order' ? (
            <Link
              className="link"
              title={row?.original?.reference}
              to={`${routes.salesOrderDetail.path}/${row?.original?.referenceId}`}
              target="_blank"
            >
              {row?.original?.reference}
            </Link>
          ) : row?.original?.referenceType === 'Bulk Asset Creation' ? (
            <Link
              className="link"
              title={row?.original?.reference}
              to={`${routes.bulkAssetCreationDetail.path}/${row?.original?.referenceId}`}
              target="_blank"
            >
              {row?.original?.reference}
            </Link>
          ) : row?.original?.referenceType === 'Serialized Asset' ? (
            <Link
              className="link"
              title={row?.original?.reference}
              to={`${routes.serializedAssetDetail.path}/${row?.original?.referenceId}`}
              target="_blank"
            >
              {row?.original?.reference}
            </Link>
          ) : row?.original?.referenceType === 'Rental Job' ? (
            <Link
              className="link"
              title={row?.original?.reference}
              to={`${routes.rentalManagementDetail.path}/${row?.original?.referenceId}`}
              target="_blank"
            >
              {row?.original?.reference}
            </Link>
          ) : row?.original?.referenceType === 'Work Order' ? (
            <Link
              className="link"
              title={row?.original?.reference}
              to={`${routes.workOrderDetail.path}/${row?.original?.referenceId}`}
              target="_blank"
            >
              {row?.original?.reference}
            </Link>
          ) : (
            row?.original?.reference
          )
        ) : row?.original?.referenceType === 'Product Inventory' ? (
          <p>Manual Entry</p>
        ) : (
          <NoDataCell />
        )
    },
    {
      accessor: 'type',
      Header: 'Type',
      Cell: ({ row }) =>
        row?.original?.type ? (
          <h5 className="text-truncate" title={row?.original?.type}>
            {row?.original?.type}
          </h5>
        ) : (
          <NoDataCell />
        )
    },
    {
      accessor: 'qty',
      Header: 'Quantity',
      disableFilters: true,
      disableSortBy: false,
      Cell: ({ row }) =>
        row?.original?.qty ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor:
                row?.original?.type === 'Credit'
                  ? isDarkTheme
                    ? 'hsl(120 73% 40% / 1)'
                    : '#90ee90'
                  : row?.original?.type === 'Debit'
                    ? isDarkTheme
                      ? 'hsl(1 100% 65% / 1)'
                      : '#FFCCCB'
                    : ''
            }}
          >
            <h5 className="text-truncate" title={row?.original?.qty}>
              {row?.original?.qty}
            </h5>
          </div>
        ) : (
          <NoDataCell />
        )
    },
    {
      accessor: 'price',
      Header: `Cost ${curr}`,
      disableFilters: true,
      disableSortBy: false,
      Cell: ({ row }) =>
        row?.original?.price ? (
          <h5 className="text-truncate" title={row?.original?.price}>
            {row?.original?.price}
          </h5>
        ) : (
          0
        )
    },
    {
      accessor: 'totalPrice',
      Header: `Amount ${curr}`,
      disableFilters: true,
      disableSortBy: false,
      Cell: ({ row }) =>
        row?.original?.totalPrice ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor:
                row?.original?.type === 'Credit'
                  ? isDarkTheme
                    ? 'hsl(120 73% 40% / 1)'
                    : '#90ee90'
                  : row?.original?.type === 'Debit'
                    ? isDarkTheme
                      ? 'hsl(1 100% 65% / 1)'
                      : '#FFCCCB'
                    : ''
            }}
          >
            <h5 className="text-truncate" title={row?.original?.totalPrice}>
              {row?.original?.type === 'Debit' ? `-${row?.original?.totalPrice}` : row?.original?.totalPrice}
            </h5>
          </div>
        ) : (
          <NoDataCell />
        )
    },
    {
      accessor: 'warehouse',
      Header: routes.warehouse.title,
      Cell: ({ row }) =>
        row?.original?.warehouse ? (
          <h5 className="text-truncate" title={row?.original?.warehouse}>
            {row?.original?.warehouse}
          </h5>
        ) : (
          <NoDataCell />
        )
    },
    {
      accessor: 'transactionDate',
      Header: 'Actual Transaction Date',
      show: false,
      disableFilters: true,
      disableSortBy: false,
      Cell: ({ row }) =>
        row?.original?.transactionDate ? (
          <h5 className="text-truncate" title={`${moment(row?.original?.transactionDate)?.format(dateTimeFormat)}`}>
            {moment(row?.original?.transactionDate)?.format(dateTimeFormat)}
          </h5>
        ) : (
          <NoDataCell />
        )
    }
  ];

  return (
    <>
      <Dialog fullScreen TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={true} fullWidth>
        <CustomDialogHeader title={`History - ${productName}`} onClose={handleClose} showRequiredLabel={false}></CustomDialogHeader>
        <CustomDialogContent isFooterPresent={false}>
          <Grid item xs={12} md={12} sm={12} className="mt-3">
            {columns ? (
              <CustomReactTable
                height={'calc(100vh - 200px)'}
                columns={columns}
                state={state}
                dispatch={dispatch}
                renderedFrom={renderedFrom}
                isClientSideGrid={true}
                refreshGrid={fetchRecords}
                hideSelection={true}
                hideAction={true}
              />
            ) : (
              <Box p={2} height={500}>
                <CommonSkeleton lenArray={[...Array(10).keys()]} />
              </Box>
            )}
          </Grid>
        </CustomDialogContent>
      </Dialog>
    </>
  );
};

export default AverageCostHistory;
