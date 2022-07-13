import { Grid, IconButton } from '@material-ui/core';
import DynamicFeedIcon from '@material-ui/icons/DynamicFeed';
import React, { Fragment, useEffect, useReducer, useState } from 'react';
import { FaRecycle } from 'react-icons/fa';
import axiosInstance from 'src/axios/axiosInstance';
import CustomAgGrid, { intialState, reducer } from 'src/components/AgGridComponents/CustomAgGrid';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import routes from 'src/components/Helpers/Routes';
import { cycleCountPhysicalInventory } from 'src/constants/helpers';
import UpdateQuantity from './UpdateQty';

export default function CycleCountPInventory() {
  const [state, dispatch] = useReducer(reducer, intialState);
  const [gridApi, setGridApi] = useState(null);
  const [frameWorkComponent, setFrameWorkComponent] = useState({});
  const [updateQtyDialog, setUpdateQtyDialog] = useState(false);
  const [refId, setRefId] = useState('');
  const [products, setProducts] = useState([]);

  const [dataRows, setDataRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);

  const { loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows } = state;
  useEffect(() => {
    fetchCycleCountDetermination();
  }, [intialState]);

  const fetchCycleCountDetermination = async () => {
    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .get(cycleCountPhysicalInventory.api)
      .then((response) => {
        setDataRows(response.data.data);
        setRowCount(response.data.data.length);
        dispatch({ type: 'loading', loading: false });
      })
      .catch((error) => {
        dispatch({ type: 'loading', loading: false });
      });
  };
  const columns = [
    {
      field: 'cycleCode',
      headerName: 'Cycle Code',
      width: 200,
      cellRenderer: 'NameRenderer'
    },
    {
      field: 'productCategory.optionLabel',
      headerName: 'Product Category',
      width: 200,
      cellRenderer: 'NameRenderer'
    },
    {
      field: 'warehouse.optionLabel',
      headerName: 'Warehouse',
      width: 200,
      cellRenderer: 'NameRenderer'
    },
    {
      field: 'user.optionLabel',
      headerName: 'User',
      width: 200,
      cellRenderer: 'NameRenderer'
    },
    {
      field: 'brand.optionLabel',
      headerName: 'Brand',
      width: 200,
      cellRenderer: 'NameRenderer'
    },
    {
      field: 'brand',
      headerName: 'Action',
      width: 200,
      cellRenderer: 'actionRenderer'
    }
  ];

  const ActionRenderer = (params) => {
    return (
      <>
        <IconButton
          size="small"
          color="inherit"
          onClick={() => {
            setUpdateQtyDialog(true);
            setRefId(params?.data?._id || '');
            setProducts(params?.data?.products || []);
            console.log(updateQtyDialog);
          }}
        >
          <DynamicFeedIcon color="secondary" fontSize="small" />
        </IconButton>
      </>
    );
  };
  const frameworkComponents = {
    actionRenderer: ActionRenderer
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
          <Grid container>
            <Grid item xs={12} md={6} sm={12} className={'d-flex align-items-center gap-1'}>
              <div className="d-flex align-items-center">
                <FaRecycle />
                <span className="listingHeader">{routes.cycleCountPhysicalInventory.title}</span>
              </div>
            </Grid>
          </Grid>
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
          allowAction={false}
          actionWidth={150}
          loading={loading}
          allowSelection={false}
          //   renderedFrom={leadResource}
          refreshGrid={fetchCycleCountDetermination}
        />
        {updateQtyDialog && (
          <UpdateQuantity closeDialog={() => setUpdateQtyDialog(false)} openDialog={updateQtyDialog} refId={refId} products={products} />
        )}
      </CustomContainer>
    </Fragment>
  );
}
