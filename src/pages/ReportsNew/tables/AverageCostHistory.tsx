import Box from '@material-ui/core/Box/Box';
import Dialog from '@material-ui/core/Dialog';
import Grid from '@material-ui/core/Grid/Grid';
import { capitalize } from 'lodash';
import moment from 'moment';
import { useEffect } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { CustomDialogTransition, dateTimeFormat, gridLoadingTimeout, prepareDataForGrid } from 'src/constants/helpers';
import { ReferenceRenderer } from 'src/pages/ProductInventory/History';
import { CreditDebitRenderer } from 'src/pages/ReportsNew/tables/StandardReportTable/helperComponents';
import { useData } from 'src/StateProvider/Provider';

const renderedFrom = 'product_price_history';

const AverageCostHistory = ({ handleClose, product, productName, deepFilters, filterByIds }) => {

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const {
    state: { user, resources }
  }: any = useData();

  const { page, limit, filters, sorting } = state;

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    const response = await axiosInstance().get(`/history/product-ledger/${product}${queryString}`);
    let rows = response?.data?.data?.map((u) => {
      let finalObject: any = prepareDataForGrid(u, user);
      finalObject.type = capitalize(u.type);
      return finalObject;
    });
    dispatch({ type: 'initialize', data: rows, count: response?.data?.count });
    setTimeout(() => {
      dispatch({ type: 'loading', loading: false });
    }, gridLoadingTimeout);
  };

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}`;
    const warehouseField = filterByIds?.find((e) => e.field === 'warehouse')
    if (warehouseField) {
      deepFilter = `${deepFilter}&warehouse=${warehouseField?.term?.map((d) => d.optionValue)}`;
    }
    if (deepFilters?.length > 0) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(deepFilters))}`;
    }
    if (deepFilters?.length) {
      deepFilter = `${deepFilter}&filterType=and`;
    }
    return deepFilter;
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
      cell: ({ row }) => ReferenceRenderer(row)
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
      cell: ({ row }) => CreditDebitRenderer(row, 'qty')
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
      cell: ({ row }) => CreditDebitRenderer(row, 'totalPrice')
    },
    {
      accessor: 'warehouse',
      Header: resources?.warehouse?.titleSingular,
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
