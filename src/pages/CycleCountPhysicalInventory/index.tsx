import React, { Fragment, useEffect, useReducer, useState } from 'react';
import { Button, Grid, IconButton } from '@material-ui/core';
import { FaRecycle } from 'react-icons/fa';
import axiosInstance from 'src/axios/axiosInstance';
import CustomAgGrid, { intialState, reducer } from 'src/components/AgGridComponents/CustomAgGrid';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import routes from 'src/components/Helpers/Routes';
import { cycleCountPhysicalInventory } from 'src/constants/helpers';
import Products from './Products';
import { prepareDataForGrid } from 'src/constants/helpers';
import { gridLoadingTimeout, getLocalStorageArrayData } from '../../constants/helpers';
import { camelCase } from 'lodash';
import VisibilityIcon from '@material-ui/icons/Visibility';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { getStaticFields, staticFrameworkRender } from '../../constants/useColumns';
import { isMobile, isTablet } from 'react-device-detect';
import { MdAdd } from 'react-icons/md';
import AddOutlined from '@material-ui/icons/AddOutlined';
import styles from "../Leads/Header.module.scss";
import ManageCycleCountPInventory from './ManageCycleCountPInventory';

const CycleCountPInventory = () => {

  const renderedFrom = camelCase(`${routes.cycleCountPhysicalInventory.title}`);
  const localStorageSelectedRecords = `${renderedFrom}_selected`;
  const [cycleCountPInventoryDialog, setCycleCountPInventoryDialog] = useState(false);

  const [state, dispatch] = useReducer(reducer, intialState);
  const [gridApi, setGridApi] = useState(null);

  const [productDialog, setProductDialog] = useState({ open: false, _id: "", products: [], warehouse: "" });
  const { loading, page, limit, pageSizes, rowCount, dataRows, search, filters, sorting, selectedRecords, appendRows } = state;

  // useEffect(() => {
  //   axiosInstance().post(cycleCountPhysicalInventory.api, {
  //     warehouse: "620dd7e82e39b606d4945dd5",
  //     productCategory: "61c04af226046a1c809136a3",
  //     inventoryCycle: "62cd24c922cd4949f864b526",
  //   })
  //     .then((response) => {
  //     })
  //     .catch((error) => {
  //       dispatch({ type: 'loading', loading: false });
  //     });
  // }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    axiosInstance().get(cycleCountPhysicalInventory.api)
      .then(({ data: { data } }) => {
        let rows = data?.map((u) => {
          let finalObject = prepareDataForGrid(u);
          return {
            ...finalObject
          };
        });
        dispatch({
          type: 'initialize',
          data: rows,
          count: rows?.length,
          selectedRecords: rows.filter((f) => f.isChecked === true)
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

  const columns = [
    {
      field: 'inventoryCycle',
      headerName: 'Cycle Code',
      cellRenderer: 'commonRenderer'
    },
    {
      field: 'productCategory',
      headerName: 'Product Category',
      cellRenderer: 'commonRenderer'
    },
    {
      field: 'warehouse',
      headerName: 'Warehouse',
      cellRenderer: 'commonRenderer'
    },
    {
      field: 'status',
      headerName: 'Status',
      cellRenderer: 'commonRenderer'
    },
    {
      field: 'user',
      headerName: 'User',
      cellRenderer: 'commonRenderer'
    },
    ...getStaticFields()
  ];

  const ActionsRenderer = (params) => {
    return (
      <HtmlTooltip title="Products">
        <IconButton
          size="small"
          color="inherit"
          onClick={() => {
            setProductDialog({ open: true, _id: params?.data?._id, products: params?.data?.products, warehouse: params?.data?.warehouse })
          }}
        >
          <VisibilityIcon color="secondary" fontSize="small" />
        </IconButton>
      </HtmlTooltip>
    );
  };

  const frameworkComponents = {
    actionsRenderer: ActionsRenderer,
    ...staticFrameworkRender
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
            </Grid>
            <Grid item md={6} sm={12} xs={12} className={styles.filter_side}>
              <Grid style={{ display: "flex", gap: "5px" }}>
                <Button
                  variant={isMobile && !isTablet ? "text" : "contained"}
                  color="primary"
                  size="small"
                  onClick={() => setCycleCountPInventoryDialog(true)}
                  className={isMobile && !isTablet ? "mobile_button" : styles.add_submit_btn}
                  startIcon={isMobile && !isTablet ? null : <AddOutlined />}
                >
                  {isMobile && !isTablet ? <MdAdd size={23} /> : "Add"}
                </Button>
              </Grid>
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
          allowAction={true}
          actionWidth={150}
          loading={loading}
          allowSelection={false}
          renderedFrom={renderedFrom}
          refreshGrid={fetchData}
          isClientSideGrid={true}
        />
        {productDialog.open && (
          <Products
            _id={productDialog._id}
            handleClose={() => {
              setProductDialog({ open: false, _id: "", products: [], warehouse: "" })
            }}
            handleSucess={() => {
              fetchData()
              setProductDialog({ open: false, _id: "", products: [], warehouse: "" })
            }}
            products={productDialog.products}
            warehouse={productDialog.warehouse}
          />
        )}
        {cycleCountPInventoryDialog && <ManageCycleCountPInventory
          open={cycleCountPInventoryDialog}
          close={() => setCycleCountPInventoryDialog(false)}
          onSuccess={() => {
            setCycleCountPInventoryDialog(false)
            fetchData()
          }
          } />}
      </CustomContainer>
    </Fragment>
  );
}

export default CycleCountPInventory;

