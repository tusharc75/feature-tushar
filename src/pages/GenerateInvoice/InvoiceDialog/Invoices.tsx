import { Box, Grid, IconButton } from '@material-ui/core';
import { useContext, useEffect, useReducer, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomAgGrid, { intialState, reducer } from 'src/components/AgGridComponents/CustomAgGrid';
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
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { camelCase } from 'lodash';
import CustomReactTable, { checkStaticField, getStaticFields, useColumns, useTableReducer, } from 'src/components/CustomReactTableNew';
import { deleteDisable } from 'src/constants/messageHelpers';

const Invoices = ({ resourceId, resource, invoiceFieldName }) => {
  const renderedFrom = `${camelCase(routes.generateInvoice?.title)}_invoice`;
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { user, permissions }
  }: any = useData();
  const { state, dispatch } = useTableReducer();
  const { page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;

  const { getColumnData } = useColumns();
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
    let columns = [];
    data.forEach((o) => {
      if (o?.fieldData?.fieldName === 'invoiceNumber') {
        columns = [
          ...columns,
          {
            ...o?.fieldData,
            index: 0,
            accessor: o?.fieldData?.fieldName,
            Header: o?.fieldData?.fieldLabel,
            show: true,
            disabled: true,
            Cell: ({ row }) => (
              <>
                <span
                  className="link"
                  onClick={() => {
                    setViewInvoiceDialog({ open: true, invoice: row.original?._id });
                  }}
                >
                  <CustomRenderCell value={row.original[o?.fieldData?.fieldName]} />
                </span>
                <Box ml={1}>
                  <IconButton
                    size="small"
                    onClick={() => {
                      window.open(`${routes.invoiceDetail.path}/${row.original?._id}`);
                    }}
                  >
                    <OpenInNewIcon fontSize="small" color="primary" />
                  </IconButton>
                </Box>
              </>
            )
          }
        ];
      } else {
        let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.invoiceDetail.path);
        if (currentColumn !== null) {
          columns = [...columns, currentColumn?.columnData];
        }
      }
      return o?.fieldData;
    });
    let staticFields = getStaticFields();
    staticFields.forEach((field) => {
      columns.push(checkStaticField(routes.projectSales.title, field));
    });
    setColumns([...columns, ActionsRenderer]);
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
        <HtmlTooltip title={row.original?.canDelete ? "Delete" : deleteDisable}>
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
              <DeleteIcon color={row.original?.canDelete ? "error" : "disabled"} />
            </IconButton>
          </span>
        </HtmlTooltip>
      </>
    )
  }

  useEffect(() => {
    fetchData();
  }, [page, limit, filters, sorting, showFilteredRecordsOnly]);

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}&${invoiceFieldName}=${resourceId}`;
    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify(selectedRecords.map((m) => m._id))}`;
    }
    if (!isObjectEmpty(filters)) {
      const updatedFilters = [];
      Object.keys(filters).forEach((field) => {
        updatedFilters.push({
          field: field,
          term: filters[field].filter
        });
      });
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(updatedFilters))}&filterType=and`;
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
    <>
      <Grid item xs={12} md={12} sm={12} className="mt-3">
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            isClientSideGrid={false}
            refreshGrid={fetchData}
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
          }}
          resource={resource}
        />
      )}
      {isConfirmDialogVisible ? (
        <ConfirmationDialog
          open={isConfirmDialogVisible}
          message={`Are you sure you want to delete ${routes?.invoice?.title?.toLowerCase()} ${deleteRecord?.invoice || ''} ?`}
          onClose={() => {
            setDeleteRecord(null);
            setIsConformDialogVisible(false);
          }}
          okBtnLoading={deleteLoading}
          onOk={handleDeleteInvoice}
        />
      ) : null}
    </>
  );
};
export default Invoices;
