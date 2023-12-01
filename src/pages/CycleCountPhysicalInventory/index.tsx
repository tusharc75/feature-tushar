import { Fragment, useEffect, useState } from 'react';
import { Box, Button, Grid, IconButton } from '@material-ui/core';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { getStaticFields, useTableReducer } from 'src/components/CustomReactTableNew';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import routes from 'src/components/Helpers/Routes';
import { cycleCountPhysicalInventory } from 'src/constants/helpers';
import Products from './Products';
import { prepareDataForGrid } from 'src/constants/helpers';
import { gridLoadingTimeout } from '../../constants/helpers';
import { camelCase } from 'lodash';
import VisibilityIcon from '@material-ui/icons/Visibility';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { isMobile } from 'react-device-detect';
import AddOutlined from '@material-ui/icons/AddOutlined';
import ManageCycleCountPInventory from './ManageCycleCountPInventory';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { useData } from 'src/StateProvider/Provider';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

const CycleCountPInventory = () => {
  const renderedFrom = camelCase(`${routes.cycleCountPhysicalInventory.title}`);
  const [cycleCountPInventoryDialog, setCycleCountPInventoryDialog] = useState(false);
  const {
    state: { permissions, user }
  }: any = useData();
  const { state, dispatch } = useTableReducer();
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
    fetchData();
  }, []);

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .get(cycleCountPhysicalInventory.api)
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
    <Fragment>
      <Grid container className="headerbox">
        <Grid item md={4} sm={11} xs={10}>
          <CustomBreadCrumbs routes={[routes.cycleCountPhysicalInventory]} />
        </Grid>
        <Grid item md={8} sm={1} xs={2}></Grid>
      </Grid>
      <CustomContainer>
        <div className="header-panel">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            <div className={'d-flex flex-wrap align-items-center gap-1'}></div>
            <div className="flex flex-wrap gap-[8px]  justify-end">
              {permissions?.cycleCountPhysicalInventory?.isCreate && (
                <Button
                  variant={'contained'}
                  color="primary"
                  size="small"
                  onClick={() => setCycleCountPInventoryDialog(true)}
                  className={`no-shadow`}
                  startIcon={<AddOutlined />}
                >
                  Add
                </Button>
              )}
            </div>
          </div>
        </div>
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
    </Fragment>
  );
};

export default CycleCountPInventory;
