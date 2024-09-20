import { Box, Grid, IconButton } from '@material-ui/core';
import VisibilityIcon from '@material-ui/icons/Visibility';
import { camelCase } from 'lodash';
import { Fragment, useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import CustomReactTable, { getStaticFields, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { cycleCountPhysicalInventory, prepareDataForGrid } from 'src/constants/helpers';
import { gridLoadingTimeout } from '../../constants/helpers';
import ManageCycleCountPInventory from './ManageCycleCountPInventory';
import Products from './Products';
import axios, { CancelTokenSource } from 'axios';

const CycleCountPInventory = () => {
  const renderedFrom = camelCase(`${routes.cycleCountPhysicalInventory.title}`);
  const [cycleCountPInventoryDialog, setCycleCountPInventoryDialog] = useState(false);
  const {
    state: { permissions, user }
  }: any = useData();
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const [columns, setColumns] = useState(null);
  const [productDialog, setProductDialog] = useState({ open: false, _id: '', products: [], warehouse: '' });

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = () => {
    const columns = [
      {
        accessor: 'inventoryCycle',
        Header: 'Cycle Code',
        width: 120,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => (row.original?.inventoryCycle ? <p className="text-truncate">{row.original?.inventoryCycle}</p> : <NoDataCell />)
      },
      {
        accessor: 'productCategory',
        Header: 'Product Category',
        width: 120,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => (row.original?.productCategory ? <p className="text-truncate">{row.original?.productCategory}</p> : <NoDataCell />)
      },
      {
        accessor: 'warehouse',
        Header: 'Warehouse',
        width: 120,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => (row.original?.warehouse ? <p className="text-truncate">{row.original?.warehouse}</p> : <NoDataCell />)
      },
      {
        accessor: 'status',
        Header: 'Status',
        width: 120,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => (row.original?.status ? <p className="text-truncate">{row.original?.status}</p> : <NoDataCell />)
      },
      {
        accessor: 'user',
        Header: 'User',
        width: 120,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => (row.original?.user ? <p className="text-truncate">{row.original?.user}</p> : <NoDataCell />)
      },
      ...getStaticFields(),
      ActionsRenderer
    ];
    setColumns(columns);
  };

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, []);

  const fetchData = async (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .get(cycleCountPhysicalInventory.api, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data } }) => {
        let rows = data?.map((u) => {
          let finalObject = prepareDataForGrid(u, user);
          return {
            ...finalObject
          };
        });
        dispatch({ type: 'initialize', data: rows, count: rows?.length });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        dispatch({ type: 'loading', loading: false });
      });
  };

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 100,
    width: 110,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
        <HtmlTooltip title="Products">
          <IconButton
            size="small"
            color="inherit"
            onClick={() => {
              setProductDialog({ open: true, _id: row?.original?._id, products: row?.original?.products, warehouse: row?.original?.warehouse });
            }}
          >
            <VisibilityIcon color="primary" fontSize="small" />
          </IconButton>
        </HtmlTooltip>
      </>
    )
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[routes.cycleCountPhysicalInventory]} />
      </div>
      <CustomContainer>
        <ListingPageHeader
          isActionButtonVisible={false}
          isAddButtonVisible={permissions?.cycleCountPhysicalInventory?.isCreate}
          addButtonOnclick={() => setCycleCountPInventoryDialog(true)}
        />
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchData}
            isClientSideGrid={true}
            hideSelection={true}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
        {productDialog.open && (
          <Products
            _id={productDialog._id}
            handleClose={() => {
              setProductDialog({ open: false, _id: '', products: [], warehouse: '' });
            }}
            handleSucess={() => {
              fetchData();
              setProductDialog({ open: false, _id: '', products: [], warehouse: '' });
            }}
            products={productDialog.products}
            warehouse={productDialog.warehouse}
          />
        )}
        {cycleCountPInventoryDialog && (
          <ManageCycleCountPInventory
            open={cycleCountPInventoryDialog}
            close={() => setCycleCountPInventoryDialog(false)}
            onSuccess={() => {
              setCycleCountPInventoryDialog(false);
              fetchData();
            }}
          />
        )}
      </CustomContainer>
    </section>
  );
};

export default CycleCountPInventory;
