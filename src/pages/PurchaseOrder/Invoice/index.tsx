import { useState, useEffect, useContext, Fragment, useReducer } from 'react';
import { Box, Button, IconButton } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import { useData } from '../../../StateProvider/Provider';
import CustomAgGrid, { intialState, reducer } from '../../../components/AgGridComponents/CustomAgGrid';
import { purchaseOrder, gridLoadingTimeout } from '../../../constants/helpers';
import AddInvoice from './AddInvoice';
import { CommonRenderer, DateRenderer } from '../../../components/AgGridComponents/CustomAgGridCellRenderers';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const Invoice = ({ purchaseOrderData, allowedToEdit }) => {
  
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;
  const [addOpen, setAddOpen] = useState({ open: false, invoiceData: null });
  const toastConfig = useContext(CustomToastContext);

  useEffect(() => {
    fetchData();
  }, [purchaseOrderData]);

  let columns = [
    {
      field: 'invoiceNumber',
      headerName: 'Invoice Number',
      show: true,
      cellRenderer: 'commonRenderer',
      primaryField: true
    },
    {
      field: 'invoiceDate',
      headerName: 'Invoice Date',
      filter: false,
      show: true,
      cellRenderer: 'dateRenderer',
      primaryField: true
    }
  ];

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    let res = await axiosInstance().get(`${purchaseOrder.api}/invoice/${purchaseOrderData?._id}`);
    dispatch({ type: 'initialize', data: res?.data?.data, count: res?.data?.data?.length });
    setTimeout(() => {
      dispatch({ type: 'loading', loading: false });
    }, gridLoadingTimeout);
  };

  const ActionsRenderer = (params) => (
    <>
      <HtmlTooltip title="Edit">
        <IconButton
          size="small"
          aria-label="Clone"
          onClick={() => {
            setAddOpen({ open: true, invoiceData: params.data });
          }}
        >
          <EditIcon color="primary" />
        </IconButton>
      </HtmlTooltip>
      <HtmlTooltip title="Edit">
        <IconButton
          size="small"
          aria-label="Clone"
          onClick={() => {
            handleDelete([params.data?._id]);
          }}
        >
          <DeleteIcon color="error" />
        </IconButton>
      </HtmlTooltip>
    </>
  );

  const handleDelete = async (removeIds) => {
    axiosInstance()
      .put(`${purchaseOrder.api}/invoice/${purchaseOrderData?._id}/remove`, { ids: removeIds })
      .then(({ data }) => {
        fetchData();
        toastConfig.setToastConfig({
          open: true,
          message: data.message,
          severity: 'success'
        });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const frameworkComponents = {
    commonRenderer: CommonRenderer,
    dateRenderer: DateRenderer,
    actionsRenderer: ActionsRenderer
  };

  return (
    <Fragment>
      {allowedToEdit && (
        <Box display="flex" justifyContent="space-between" m={1}>
          <Box display="flex">
            <Button
              color="primary"
              size="small"
              variant="contained"
              onClick={() => {
                setAddOpen({ open: true, invoiceData: null });
              }}
            >
              Add Invoice
            </Button>
          </Box>
        </Box>
      )}
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
        actionWidth={150}
        allowAction={true}
        isClientSideGrid={true}
        loading={loading}
        renderedFrom={'po_invoice'}
        refreshGrid={fetchData}
        showOnlyShowFilteredRecordSwitch={false}
      />
      {addOpen?.open && (
        <AddInvoice
          purchaseOrderId={purchaseOrderData?._id}
          invoiceData={addOpen?.invoiceData}
          handleClose={() => {
            setAddOpen({ open: false, invoiceData: null });
          }}
          handleSucess={() => {
            fetchData();
            setAddOpen({ open: false, invoiceData: null });
          }}
        />
      )}
    </Fragment>
  );
};

export default Invoice;
