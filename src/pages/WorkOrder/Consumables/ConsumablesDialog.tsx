import { useState, useEffect, useContext, useReducer } from 'react';
import { Box, Button, Dialog, Grid } from '@material-ui/core';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { gridLoadingTimeout, prepareDataForGrid, workOrder } from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';
import styles from 'src/pages/Leads/Header.module.scss';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomAgGrid, { intialState, reducer } from 'src/components/AgGridComponents/CustomAgGrid';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CheckboxRenderer, CommonRenderer } from 'src/components/AgGridComponents/CustomAgGridCellRenderers';
import ConsumablesQtyDialog from './ConsumablesQtyDialog';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';

let searchTimeout;

const ConsumablesDialog = ({ onSuccess, handleClose, workOrderId, service, uniqueId, stepId, serviceName }) => {

  const renderedFrom = `workOrder_consumable`;
  const localStorageSelectedRecords = `${renderedFrom}_selected`;

  const { state: { selectedEntity } }: any = useData();

  const toastConfig = useContext(CustomToastContext);
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const [frameWorkComponent, setFrameWorkComponent] = useState(null);
  const [openConsumablesQtyDialog, setOpenConsumablesQtyDialog] = useState(false)
  const [columns, setColumns] = useState([]);
  const [consumablesDialog, setConsumablesDialog] = useState(false);

  useEffect(() => {
    localStorage.removeItem(localStorageSelectedRecords);
    fetchGridColumns();
  }, []);

  useEffect(() => {
    let millisec = Object.keys(search).length > 0 ? 600 : 5;
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    searchTimeout = setTimeout(() => {
      fetchData();
    }, millisec);
  }, [page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly]);

  const fetchGridColumns = () => {
    setFrameWorkComponent({
      commonRenderer: CommonRenderer,
      checkboxRenderer: CheckboxRenderer,
    });
    setColumns([
      { field: "product", headerName: "Product", show: true, disabled: true, cellRenderer: "commonRenderer" },
      { field: "service", headerName: "Service", show: true, disabled: true, cellRenderer: "commonRenderer" },
      { field: 'stepName', headerName: 'Step Name', show: true, cellRenderer: 'commonRenderer' },
      { field: "qty", headerName: "Qty", show: true, disabled: true, cellRenderer: "commonRenderer" },
      { field: "consumedQty", headerName: "Consumed Qty", show: true, disabled: true, cellRenderer: "commonRenderer" },
    ])
  };

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    var query = `?service=${service}&uniqueId=${uniqueId}`
    if (stepId) {
      query = query + `&stepId=${stepId}`
    }
    axiosInstance().get(`${workOrder.api}/${workOrderId}/consumable${query}`).then(({ data: { data } }) => {
      let rows = data.map((u) => {
        let res: any = {
          ...prepareDataForGrid(u),
        };
        res.hideSelection = u?.qty - u?.consumedQty === 0 ? true : false
        return res;
      });
      dispatch({ type: "initialize", data: rows, count: rows.length });
      setTimeout(() => {
        dispatch({ type: 'loading', loading: false });
      }, gridLoadingTimeout);
    })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleSubmit = async (rows) => {

    const data: any = []
    rows?.forEach((e) => {
      if (parseInt(e.qty)) {
        data.push({ product: e._id, qty: parseInt(e.qty), service, uniqueId, stepId })
      }
    })

    axiosInstance().post(`${workOrder.api}/${workOrderId}/consumable`, data)
      .then(({ data }) => {
        fetchData();
        setConsumablesDialog(false);
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
    <Dialog
      fullWidth
      maxWidth="md"
      fullScreen={true}
      open={true}
      onClose={handleClose}
      aria-labelledby="consume-dialog">
      <CustomDialogHeader
        title={`${serviceName} - Products/Consumables`}
        showManimizeMaximize={false}
        showRequiredLabel={false}
        onClose={handleClose}
      />
      <CustomDialogContent>
        <div className="header-panel">
          <Grid container className={styles.filter_side_container}>
            <Grid item xs={6} className="d-flex align-items-center gap-1">
              <Button variant={'contained'} color="primary" size="small" onClick={() => setConsumablesDialog(true)}>
                Add Products/Consumables
              </Button>
            </Grid>
            <Grid item xs={6} className={styles.filter_side}>
              <Box className={styles.filter_side_header} component="div">
                <Button
                  disabled={selectedRecords.length === 0}
                  onClick={() => setOpenConsumablesQtyDialog(true)}
                  color="primary"
                  size="small"
                  variant="contained"
                >
                  {'Consume '}  {selectedRecords.length > 0
                    ? '(' + selectedRecords.length + ')'
                    : ''}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </div>
        {frameWorkComponent && Object.keys(frameWorkComponent).length > 0 ? (
          <CustomAgGrid
            columns={columns}
            dataRows={dataRows}
            frameworkComponents={frameWorkComponent}
            setGridApi={setGridApi}
            dispatch={dispatch}
            rowCount={rowCount}
            limit={limit}
            pageSizes={pageSizes}
            page={page}
            allowAction={false}
            loading={loading}
            allowSelection={true}
            showOnlyShowFilteredRecordSwitch={true}
            refreshGrid={fetchData}
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
          />
        ) : (
          <Box p={2} height={500} bgcolor="white">
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomDialogContent>
      {openConsumablesQtyDialog &&
        <ConsumablesQtyDialog
          workOrderId={workOrderId}
          onClose={() => setOpenConsumablesQtyDialog(false)}
          onSuccess={() => {
            fetchData()
            setOpenConsumablesQtyDialog(false)
          }}
          selectedRecords={selectedRecords}
          service={service}
          uniqueId={uniqueId}
          stepId={stepId}
          serviceName={serviceName}
        />
      }
      {consumablesDialog && (
        <AssignProductDialog
          productsDialogOpen={consumablesDialog}
          productId={workOrderId}
          reference={'workOrder'}
          handleCloseDialog={() => setConsumablesDialog(false)}
          assignedProducts={dataRows?.map((d) => d?.materialId) || []}
          renderedFrom={'workOrder_consumables'}
          onSuccess={(rows) => {
            handleSubmit(rows)
          }}
          serialized={false}
        />
      )}
    </Dialog>
  );
};

export default ConsumablesDialog;
