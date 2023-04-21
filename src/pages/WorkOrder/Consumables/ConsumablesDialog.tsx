import { useState, useEffect, useContext, useReducer } from 'react';
import { Box, Button, Dialog, Grid, IconButton, Link } from '@material-ui/core';
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
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import DeleteIcon from '@material-ui/icons/Delete';
import routes from 'src/components/Helpers/Routes';

let searchTimeout;

const ConsumablesDialog = ({ onSuccess, handleClose, workOrderId, service, uniqueId, stepId, serviceName }) => {
  const renderedFrom = `workOrder_consumable`;
  const localStorageSelectedRecords = `${renderedFrom}_selected`;

  const {
    state: { selectedEntity }
  }: any = useData();

  const toastConfig = useContext(CustomToastContext);
  // const [gridApi, setGridApi] = useState(null);
  // const [state, dispatch] = useReducer(reducer, intialState);
  // const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  // const [frameWorkComponent, setFrameWorkComponent] = useState(null);
  const [openConsumablesQtyDialog, setOpenConsumablesQtyDialog] = useState(false);
  const [columns, setColumns] = useState([]);
  const [consumablesDialog, setConsumablesDialog] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [dataRows, setDataRows] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.removeItem(localStorageSelectedRecords);
    fetchGridColumns();
  }, []);

  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    fetchData();
  }, []);

  const fetchGridColumns = () => {
    const column: any = [
      {
        accessor: 'product',
        Header: 'Product',
        width: 300,
        minWidth: 200,
        Cell: ({ row }) => (
          <Link href={`${routes.productDetail.path}/${row?.original?.productId}`} className="">
            {row?.original?.product || <NoDataCell />}
          </Link>
        )
      },
      {
        accessor: 'service',
        Header: 'Service',
        width: 300,
        minWidth: 150,
        Cell: ({ row }) => (
          <Link href={`${routes.serviceMasterDetail.path}/${row.original.serviceId}`} className="">
            {row?.original?.service || <NoDataCell />}
          </Link>
        )
      },
      {
        accessor: 'stepName',
        Header: 'Step Name',
        width: 100,
        minWidth: 100,
        Cell: ({ row }) => <p className="text-truncate">{row?.original?.stepName || <NoDataCell />}</p>
      },
      {
        accessor: 'qty',
        Header: 'Qty',
        editable: true,
        width: 100,
        minWidth: 100,
        Cell: ({ row }) => <p className="text-truncate">{row?.original?.qty || <NoDataCell />}</p>
      },
      {
        accessor: 'consumedQty',
        Header: 'Consumed Qty',
        width: 100,
        minWidth: 100,
        Cell: ({ row }) => <p className="text-truncate">{row?.original?.consumedQty || <NoDataCell />}</p>
      },
      {
        accessor: 'action',
        Header: 'Action',
        width: 50,
        sticky: 'right',
        disableFilters: true,
        canDrag: false,
        Cell: ({ row }: any) => (
          <div style={{ display: 'flex', justifyContent: 'end' }}>
            {!row?.original?.consumedQty && (
              <HtmlTooltip title="Delete">
                <IconButton
                  size="small"
                  aria-label="Delete"
                  onClick={() => {
                    handleDelete([row.original]);
                    // setShowConfirmBox({ open: true, data: [row.original] });
                  }}
                >
                  <DeleteIcon color="error" />
                </IconButton>
              </HtmlTooltip>
            )}
          </div>
        )
      }
    ];
    setColumns(column);
  };

  const fetchData = () => {
    var query = `?service=${service}&uniqueId=${uniqueId}`;
    if (stepId) {
      query = query + `&stepId=${stepId}`;
    }
    axiosInstance()
      .get(`${workOrder.api}/${workOrderId}/consumable${query}`)
      .then(({ data: { data } }) => {
        let rows = data.map((u) => {
          let res: any = {
            ...prepareDataForGrid(u)
          };
          res.hideSelection = u?.qty - u?.consumedQty === 0 ? true : false;
          return res;
        });
        console.log(data);
        setDataRows(rows);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleSubmit = async (rows) => {
    const data: any = [];
    rows?.forEach((e) => {
      if (parseInt(e.qty)) {
        data.push({ product: e._id, qty: parseInt(e.qty), service, uniqueId, stepId });
      }
    });

    axiosInstance()
      .post(`${workOrder.api}/${workOrderId}/consumable`, data)
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

  const handleDelete = async (rows) => {
    const ids = rows.map((e) => e._id);

    axiosInstance()
      .put(`${workOrder.api}/${workOrderId}/consumable/remove`, {
        ids: ids || []
      })
      .then(({ data }) => {
        fetchData();
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

  const onSaveInlineEdit = async (inputField, updatedData) => {
    if (parseInt(inputField.qty) < updatedData.consumedQty) {
      toastConfig.setToastConfig({
        open: true,
        type: 'error',
        message: 'Qty can not be less than consumed qty'
      });
      return;
    } else if (parseInt(inputField.qty) === 0) {
      toastConfig.setToastConfig({
        open: true,
        type: 'error',
        message: 'Qty can not be 0'
      });
      return;
    }
    axiosInstance()
      .put(`${workOrder.api}/${workOrderId}/consumable/update-qty`, [
        {
          product: updatedData?.productId,
          ...inputField,
          _id: updatedData._id
        }
      ])
      .then(({ data }) => {
        fetchData();
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
    <Dialog fullWidth maxWidth="md" fullScreen={true} open={true} onClose={handleClose} aria-labelledby="consume-dialog">
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
                  {'Consume '} {selectedRecords.length > 0 ? '(' + selectedRecords.length + ')' : ''}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </div>
        {columns && dataRows ? (
          <CustomReactTable
            height={'calc(100vh - 345px)'}
            columns={columns}
            data={dataRows}
            setWholeRowsCellColor={(rowData) => (!rowData.isValid ? '' : '')}
            onSelect={setSelectedRecords}
            childrenProperty="subRows"
            uniqueKey="_id"
            onSaveEdit={onSaveInlineEdit}
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
            hideExpander={true}
          />
        ) : (
          <Box p={2} height={500} bgcolor="white">
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomDialogContent>
      {openConsumablesQtyDialog && (
        <ConsumablesQtyDialog
          workOrderId={workOrderId}
          onClose={() => setOpenConsumablesQtyDialog(false)}
          onSuccess={() => {
            fetchData();
            setOpenConsumablesQtyDialog(false);
          }}
          selectedRecords={selectedRecords}
          service={service}
          uniqueId={uniqueId}
          stepId={stepId}
          serviceName={serviceName}
        />
      )}
      {consumablesDialog && (
        <AssignProductDialog
          productsDialogOpen={consumablesDialog}
          productId={workOrderId}
          reference={'workOrder'}
          handleCloseDialog={() => setConsumablesDialog(false)}
          assignedProducts={dataRows?.map((d) => d?.materialId) || []}
          renderedFrom={'workOrder_consumables'}
          onSuccess={(rows) => {
            handleSubmit(rows);
          }}
          serialized={false}
        />
      )}
    </Dialog>
  );
};

export default ConsumablesDialog;
