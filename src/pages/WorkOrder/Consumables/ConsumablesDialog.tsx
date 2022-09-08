import { useState, useEffect, useContext, useReducer } from 'react';
import { Box, Button, ButtonGroup, CircularProgress, Dialog, Grid, IconButton } from '@material-ui/core';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { gridLoadingTimeout, isObjectEmpty, packages, prepareDataForGrid, getLocalStorageArrayData, serviceMaster, workOrder } from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';
import styles from 'src/pages/Leads/Header.module.scss';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomAgGridEditable from 'src/components/AgGridComponents/CustomAgGridEditable';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomAgGrid, { intialState, reducer } from 'src/components/AgGridComponents/CustomAgGrid';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import useColumns, { getFrameworkComponents, getStaticFields } from 'src/constants/useColumns';
import { CheckboxRenderer, CommonRenderer } from 'src/components/AgGridComponents/CustomAgGridCellRenderers';

let searchTimeout;

const ConsumablesDialog = ({ onSuccess, handleClose, workOrderId = null, from }) => {

  const renderedFrom = `${from === "service" ? routes.serviceMaster.title : routes.product.title}_consumable`;
  const localStorageSelectedRecords = `${renderedFrom}_selected`;

  const { state: { selectedEntity } }: any = useData();

  const toastConfig = useContext(CustomToastContext);
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const [frameWorkComponent, setFrameWorkComponent] = useState(null);
  const [columns, setColumns] = useState([]);

  const defaultColumns = [
    { field: 'qty', headerName: 'Qty', show: true, cellRenderer: 'commonRenderer', cellEditor: 'numericCellEditor', editable: true }
  ];
  const { getColumnData } = useColumns();

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
    if (from === "service") {
      setFrameWorkComponent({
        commonRenderer: CommonRenderer,
        checkboxRenderer: CheckboxRenderer,
      });
      setColumns([
        { field: "product", headerName: "Product", show: true, cellRenderer: "commonRenderer" },
        { field: "service", headerName: "Service", show: true, cellRenderer: "commonRenderer" },
        { field: "qty", headerName: "Qty", show: true, cellRenderer: "commonRenderer" },
        { field: "consumed", headerName: "Consumed", show: true, cellRenderer: "checkboxRenderer" },
      ])

    }
    else {
      axiosInstance().get("/field?resource=Product&view=true").then(({ data: { data } }) => {
        let columns = [];
        let rendererNames = [];
        data.forEach((o) => {
          let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.packages.path);
          if (currentColumn !== null) {
            columns = [...columns, currentColumn?.columnData];
            if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
              rendererNames.push(currentColumn?.rendererName);
            }
          }
        });
        let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
        tempFrameworkComponent = {
          ...tempFrameworkComponent
        };
        setFrameWorkComponent({ ...tempFrameworkComponent });
        columns = [...columns, ...getStaticFields()];
        setColumns([...defaultColumns, ...columns]);
      });
    }

  };

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    if (from === "service") {
      axiosInstance().get(`${workOrder.api}/${workOrderId}/consumable`).then(({ data: { data } }) => {
        let rows = data.map((u) => {
          let res: any = {
            ...prepareDataForGrid(u),
          };
          res.hideSelection = u?.consumed
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
    }
    else {
      axiosInstance()
        .get(`${routes.workOrder.path}/${workOrderId}`)
        .then(({ data: { data } }) => {
          axiosInstance()
            .get(`/product/${data?.product?.optionValue}/bom`)
            .then(({ data: { data } }) => {
              data = data.map((o: any) => {
                let finalObject = {
                  ...o,
                  ...o?.childProductDetail,
                };
                return prepareDataForGrid(finalObject)
              });
              const savedRecords = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : [];
              dispatch({
                type: 'selection',
                selectedRecords: savedRecords
              });
              dispatch({ type: 'initialize', data: data, count: data.count });
              setTimeout(() => {
                dispatch({ type: 'loading', loading: false });
              }, gridLoadingTimeout);
            })
            .catch((error) => {
              toastConfig.setToastConfig(error);
            });
        })
        .catch((err) => {
          toastConfig.setToastConfig(err);
        });


    }
  };

  const handleSubmit = async () => {
    if (from === "service") {
      axiosInstance().put(`${workOrder.api}/${workOrderId}/consumable/mark-consumed`,
        {
          "ids": selectedRecords.map(d => d._id)
        }).then(({ data }) => {
          onSuccess();
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
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
        title={`Consumables`}
        showManimizeMaximize={false}
        showRequiredLabel={false}
        onClose={handleClose}
      />
      <CustomDialogContent>
        <div className="header-panel">
          <Grid container className={styles.filter_side_container}>
            <Grid item xs={6} className="d-flex align-items-center gap-1">
            </Grid>
            <Grid item xs={6} className={styles.filter_side}>
              <Box className={styles.filter_side_header} component="div">
                <Button
                  disabled={selectedRecords.length === 0}
                  onClick={handleSubmit}
                  color="primary"
                  size="small"
                  variant="contained"
                >
                  {from === "service" ? 'Consume ' : 'Add '}  {selectedRecords.length > 0
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
    </Dialog>
  );
};

export default ConsumablesDialog;
