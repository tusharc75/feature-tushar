import { Box, Grid, IconButton } from '@material-ui/core';
import { useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { gridLoadingTimeout, invoice, isObjectEmpty, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import ViewInvoice from '../../Invoice/ViewInvoice';
import VisibilityIcon from '@material-ui/icons/Visibility';
import DeleteIcon from '@material-ui/icons/Delete';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import CustomRenderCell from 'src/components/Helpers/CustomRenderCell';
import { camelCase } from 'lodash';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { deleteDisable } from 'src/constants/messageHelpers';
import { FiExternalLink } from 'react-icons/fi';

const renderedFrom = `${camelCase(routes.generateInvoice?.title)}_invoice`;

const Invoices = ({ resourceId, resource, invoiceFieldName, fetchParentData = null }) => {
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { user, permissions, resources }
  }: any = useData();
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;

  const { generateColumns } = useColumns();
  const [columns, setColumns] = useState(null);
  const [deleteRecord, setDeleteRecord] = useState<any>({});
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
  const [viewInvoiceDialog, setViewInvoiceDialog] = useState({ open: false, invoice: null });
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=${sidebarResource.invoice}`);
    data = response?.data?.data;
    const newColumns = generateColumns(renderedFrom, data, routes.invoiceDetail.path);
    newColumns?.forEach((o) => {
      if (o.accessor === 'invoiceNumber') {
        o.show = true;
        o.disabled = true;
        o.cell = ({ row }) => (
          <div className="flex items-center gap-2">
            <span
              className="link"
              onClick={() => {
                setViewInvoiceDialog({ open: true, invoice: row.original?._id });
              }}
            >
              <CustomRenderCell value={row.original?.invoiceNumber} />
            </span>
            <IconButton
              size="small"
              onClick={() => {
                window.open(`${routes.invoiceDetail.path}/${row.original?._id}`);
              }}
            >
              <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
            </IconButton>
          </div>
        );
      }
    });
    setColumns([...newColumns, ...getStaticFields(), ActionsRenderer]);
  };

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 100,
    width: 100,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
        <HtmlTooltip title="View Invoice">
          <span>
            <IconButton
              size="small"
              onClick={() => {
                setViewInvoiceDialog({ open: true, invoice: row.original?._id });
              }}
            >
              <VisibilityIcon fontSize="small" color="primary" />
            </IconButton>
          </span>
        </HtmlTooltip>
        <HtmlTooltip title={row.original?.canDelete ? 'Delete' : deleteDisable}>
          <span>
            <IconButton
              disabled={!row.original?.canDelete}
              size="small"
              aria-label="Delete"
              onClick={() => {
                setDeleteRecord(row.original);
                setIsConformDialogVisible(true);
              }}
            >
              <DeleteIcon color={row.original?.canDelete ? 'error' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
      </>
    )
  };

  useEffect(() => {
    fetchData();
  }, [page, limit, filters, sorting, showFilteredRecordsOnly]);

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}&${invoiceFieldName}=${resourceId}`;
    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify(selectedRecords.map((m) => m._id))}`;
    }
    const { deepFilters } = gridFilterParser(filters);
    if (deepFilters?.length) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(deepFilters))}&filterType=and`;
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }
    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURIComponent(search)}`;
    }

    return deepFilter;
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    await axiosInstance()
      .get(`${invoice.api}${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data.map((u, idx) => {
          let finalObject = prepareDataForGrid(u, user);
          finalObject['canDelete'] = permissions?.invoice?.isDelete && u?.canDelete;
          return finalObject;
        });

        dispatch({ type: 'initialize', data: rows, count: count });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        dispatch({ type: 'loading', loading: false });
        toastConfig.setToastConfig(error);
      });
  };

  const handleDeleteInvoice = async () => {
    setDeleteLoading(true);
    let recordsToDelete = [];
    if (deleteRecord?._id) {
      recordsToDelete.push(deleteRecord?._id);
    } else {
      recordsToDelete = selectedRecords.map((o) => o._id);
    }
    if (recordsToDelete.length > 0) {
      axiosInstance()
        .put(`${invoice.api}/remove`, {
          ids: recordsToDelete
        })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          setIsConformDialogVisible(false);
          setDeleteLoading(false);
          if (deleteRecord) setDeleteRecord({});
          fetchData();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setIsConformDialogVisible(false);
          setDeleteLoading(false);
        });
    }
  };

  return (
    <Box>
      <Grid item xs={12} md={12} sm={12} className="mt-3">
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchData}
            hideSelection={true}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Grid>
      {viewInvoiceDialog.open && (
        <ViewInvoice
          invoiceId={viewInvoiceDialog.invoice}
          onClose={() => {
            setViewInvoiceDialog({ open: false, invoice: null });
          }}
          onSuccess={() => {
            setViewInvoiceDialog({ open: false, invoice: null });
            if (fetchParentData) {
              fetchParentData();
            }
            fetchData();
          }}
          resource={resource}
        />
      )}
      {isConfirmDialogVisible ? (
        <ConfirmationDialog
          open={isConfirmDialogVisible}
          message={`Are you sure you want to delete ${resources?.invoice?.titleSingular?.toLowerCase()} ${deleteRecord?.invoice || ''} ?`}
          onClose={() => {
            setDeleteRecord(null);
            setIsConformDialogVisible(false);
          }}
          okBtnLoading={deleteLoading}
          onOk={handleDeleteInvoice}
        />
      ) : null}
    </Box>
  );
};
export default Invoices;
