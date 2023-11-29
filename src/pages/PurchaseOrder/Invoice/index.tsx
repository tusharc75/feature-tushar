import { useState, useEffect, useContext, Fragment } from 'react';
import { Box, Button, IconButton } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTableNew';
import { purchaseOrder, gridLoadingTimeout, dateTimeFormat } from '../../../constants/helpers';
import AddInvoice from './AddInvoice';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import ConfirmationDialogRaw from 'src/components/Helpers/ConfirmationDialog';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import moment from 'moment';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

const Invoice = ({ purchaseOrderData, allowedToEdit }) => {
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer();
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const [addOpen, setAddOpen] = useState({ open: false, invoiceData: null });
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteData, setDeleteData] = useState(null);

  useEffect(() => {
    fetchData();
  }, [purchaseOrderData]);

  const columns = [
    {
      accessor: 'invoiceNumber',
      Header: 'Invoice Number',
      minWidth: 150,
      width: 150,
      primaryField: true,
      Cell: ({ row }) => (
        <>
          {row?.original?.invoiceNumber ? (
            <h5 className="text-truncate" title={row?.original?.invoiceNumber}>
              {row?.original?.invoiceNumber}
            </h5>
          ) : (
            <NoDataCell />
          )}
        </>
      )
    },
    {
      accessor: 'invoiceDate',
      Header: 'Invoice Date',
      minWidth: 150,
      width: 150,
      disabledFilters: true,
      Cell: ({ row }) => (
        <>
          {row?.original?.invoiceDate ? (
            <h5 className="text-truncate" title={moment(row?.original?.invoiceDate)?.format(dateTimeFormat)}>
              {moment(row?.original?.invoiceDate)?.format(dateTimeFormat)}
            </h5>
          ) : (
            <NoDataCell />
          )}
        </>
      )
    },
    {
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
          <HtmlTooltip title={'Edit'}>
            <IconButton
              size="small"
              aria-label="Edit"
              onClick={() => {
                setAddOpen({ open: true, invoiceData: row?.original });
              }}
            >
              <EditIcon fontSize="small" color={'primary'} />
            </IconButton>
          </HtmlTooltip>

          <HtmlTooltip title={'Delete'}>
            <IconButton
              size="small"
              aria-label="Delete"
              onClick={() => {
                setShowDeleteConfirmBox(true);
                setDeleteData([row.original?._id]);
              }}
            >
              <DeleteIcon fontSize="small" color={'error'} />
            </IconButton>
          </HtmlTooltip>
        </>
      )
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

  const handleDelete = async () => {
    if (deleteData) {
      axiosInstance()
        .put(`${purchaseOrder.api}/invoice/${purchaseOrderData?._id}/remove`, { ids: deleteData })
        .then(({ data }) => {
          fetchData();
          setShowDeleteConfirmBox(false);
          toastConfig.setToastConfig({
            open: true,
            message: data.message,
            severity: 'success'
          });
        })
        .catch((err) => {
          setShowDeleteConfirmBox(false);
          toastConfig.setToastConfig(err);
        });
    }
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
      <Box>
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={`po_invoice`}
            isClientSideGrid={true}
            refreshGrid={fetchData}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Box>

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
      {showDeleteConfirmBox && (
        <ConfirmationDialogRaw
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete  ? `}
          onClose={() => setShowDeleteConfirmBox(false)}
          onOk={handleDelete}
        />
      )}
    </Fragment>
  );
};

export default Invoice;
