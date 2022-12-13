import Box from '@material-ui/core/Box/Box';
import { useState, useEffect, useReducer, useContext, Fragment } from 'react';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import CustomAgGrid, { intialState, reducer } from '../../../components/AgGridComponents/CustomAgGrid';
import routes from '../../../components/Helpers/Routes';
import Grid from '@material-ui/core/Grid/Grid';
import axiosInstance from 'src/axios/axiosInstance';
import { gridLoadingTimeout, workOrder } from 'src/constants/helpers';
import { prepareDataForGrid } from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';
import { CommonRenderer, CheckboxRenderer } from '../../../components/AgGridComponents/CustomAgGridCellRenderers';
import { camelCase, capitalize } from 'lodash';
import { Link } from 'react-router-dom';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import { Button } from '@material-ui/core';
import { isMobile, isTablet } from 'react-device-detect';
import ConsumablesDialog from './ConsumablesDialog';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';

const Consumables = ({ workOrderId, allowedToEdit }) => {
  let renderedFrom = camelCase(routes?.workOrder.title + '_consumables');
  const toastConfig = useContext(CustomToastContext);

  const [gridApi, setGridApi] = useState(null);
  const [consumablesDialog, setConsumablesDialog] = useState(false);
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
    const response = await axiosInstance().get(`${workOrder.api}/${workOrderId}/consumable`);
    data = response?.data?.data;
    let rows = data.map((u) => {
      let finalObject: any = prepareDataForGrid(u, user);
      finalObject.type = finalObject.type === 'Service' ? 'Soft' : 'Hard';
      return finalObject;
    });
    dispatch({ type: 'initialize', data: rows, count: rows.length });
    setTimeout(() => {
      dispatch({ type: 'loading', loading: false });
    }, gridLoadingTimeout);
  };

  const columns = [
    { field: 'product', headerName: 'Product', show: true, cellRenderer: 'nameRenderer' },
    { field: 'service', headerName: 'Service', show: true, cellRenderer: 'nameRenderer' },
    { field: 'qty', headerName: 'Qty', show: true, cellRenderer: 'commonRenderer' },
    { field: 'type', headerName: 'Type', show: true, cellRenderer: 'commonRenderer' },
    { field: 'consumed', headerName: 'Consumed', show: true, cellRenderer: 'checkboxRenderer' }
  ];

  const NameRenderer = (params) => {
    return (
      <>
        <a className="link text-truncate" 
        href={ 
          params?.column?.colId === 'product'
           ? 
          `${routes?.productDetail.path}/${params?.data?.productId}` 
          : 
          `${routes?.serviceMasterDetail.path}/${params?.data?.serviceId}` }
          >
          {params?.value}
        </a>
      </>
    );
  };

  const frameworkComponents = {
    commonRenderer: CommonRenderer,
    checkboxRenderer: CheckboxRenderer,
    nameRenderer: NameRenderer,
  };

  const handleSubmit = async (selectedRecords) => {
    let tempData = selectedRecords.map((d) => {
      return {
        product: d._id,
        qty: d.qty
      };
    });
    axiosInstance()
      .post(`${workOrder.api}/${workOrderId}/consumable`, tempData)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <>
      <Box p={1}>
        {allowedToEdit && (
          <Button variant={'contained'} color="primary" size="small" onClick={() => setConsumablesDialog(true)}>
            Add Product/Consumables
          </Button>
        )}
      </Box>
      <Grid container spacing={2}>
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
              allowAction={false}
              loading={loading}
              isClientSideGrid={true}
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
      </Grid>
      {consumablesDialog && (
        <AssignProductDialog
          productsDialogOpen={consumablesDialog}
          productId={workOrderId}
          reference={'workOrder'}
          handleCloseDialog={() => setConsumablesDialog(false)}
          assignedProducts={dataRows?.map((d) => d?.materialId) || []}
          renderedFrom={renderedFrom}
          onSuccess={() => {
            fetchRecords();
            setConsumablesDialog(false);
          }}
          serialized={false}
        />
        // <ConsumablesDialog
        //   onSuccess={() => {
        //     setConsumablesDialog(false);
        //     fetchRecords();
        //   }}
        //   handleClose={() => {
        //     setConsumablesDialog(false);
        //   }}
        //   workOrderId={workOrderId}
        //   from={'consumable'}
        // />
      )}
    </>
  );
};

export default Consumables;
