import { Box, Grid, IconButton } from '@material-ui/core';
import { useContext, useEffect, useReducer, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomAgGrid, { intialState, reducer } from 'src/components/AgGridComponents/CustomAgGrid';
import routes from 'src/components/Helpers/Routes';
import { gridLoadingTimeout, invoice, isObjectEmpty, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import useColumns, { checkStaticField, getFrameworkComponents, getStaticFields } from 'src/constants/useColumns';
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

const Invoices = ({ subleaseId }) => {

  const renderedFrom = `${camelCase(routes.sublease?.title)}_invoice`

  const localStorageSelectedRecords = `${renderedFrom}_selected`;
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { user, permissions }
  }: any = useData();
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;

  const { getColumnData } = useColumns();
  const [frameworkComponent, setFrameworkComponent] = useState({});
  const [columns, setColumns] = useState(null);
  const [deleteRecord, setDeleteRecord] = useState<any>({});
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
  const [viewInvoiceDialog, setViewInvoiceDialog] = useState({ open: false, data: null })
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=Invoice`);
    data = response?.data?.data;
    let columns = [];
    let rendererNames = [];
    data.forEach((o) => {
      if (o?.fieldData?.fieldName === 'invoiceNumber') {
        columns = [
          ...columns,
          {
            ...o?.fieldData,
            pivotIndex: 0,
            field: o?.fieldData?.fieldName,
            headerName: o?.fieldData?.fieldLabel,
            show: true,
            disabled: true,
            cellRenderer: 'invoiceMaterialRenderer'
          }
        ];
      } else {
        let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.invoiceDetail.path);
        if (currentColumn !== null) {
          columns = [...columns, currentColumn?.columnData];
          if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
            rendererNames.push(currentColumn?.rendererName);
          }
        }
      }
      return o?.fieldData;
    });
    let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
    tempFrameworkComponent = {
      ...tempFrameworkComponent,
      actionsRenderer: ActionsRenderer,
      invoiceMaterialRenderer: InvoiceMaterialRenderer
    };
    setFrameworkComponent({ ...tempFrameworkComponent });
    let staticFields = getStaticFields();
    staticFields.forEach((field) => {
      columns.push(checkStaticField(routes.projectSales.title, field));
    });
    setColumns([...columns]);
  };

  const InvoiceMaterialRenderer = (params) => (
    <>
      <span
        className="link"
        onClick={() => {
          setViewInvoiceDialog({ open: true, data: params.data });
        }}
      >
        <CustomRenderCell value={params?.value} />
      </span>
      <Box ml={1}>
        <IconButton
          size="small"
          onClick={() => {
            window.open(`${routes.invoiceDetail.path}/${params?.data?._id}`);
          }}
        >
          <OpenInNewIcon fontSize="small" color="primary" />
        </IconButton>
      </Box>
    </>
  );

  const ActionsRenderer = (params) => (
    <>
      {
        <HtmlTooltip title="View Invoice">
          <IconButton
            size="small"
            onClick={() => {
              setViewInvoiceDialog({ open: true, data: params.data });
            }}
          >
            <VisibilityIcon fontSize="small" color="primary" />
          </IconButton>
        </HtmlTooltip>
      }
      {params?.data?.canDelete && (
        <HtmlTooltip title="Delete">
          <IconButton
            size="small"
            aria-label="Delete"
            onClick={() => {
              setDeleteRecord(params.data);
              setIsConformDialogVisible(true);
            }}
          >
            <DeleteIcon color="error" />
          </IconButton>
        </HtmlTooltip>
      )}
    </>
  );

  useEffect(() => {
    fetchBilling();
  }, [page, limit, filters, sorting]);


  const getQueryString = (isExport = false) => {

    let deepFilter = `?page=${page}&limit=${limit}&sublease=${subleaseId}`;
    if (showFilteredRecordsOnly) {
      const savedRecords = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : [];
      deepFilter = `${deepFilter}&getById=${JSON.stringify(savedRecords.map((m) => m._id))}`;
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

  const fetchBilling = async () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    if (gridApi) {
      gridApi.setRowData([]);
    }
    await axiosInstance()
      .get(`${invoice.api}${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data.map((u, idx) => {
          let finalObject = prepareDataForGrid(u, user);
          finalObject['isLatestInvoice'] = idx === 0 ? true : false;
          finalObject['isChecked'] = false;
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
          fetchBilling();
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
        {columns?.length ? (
          <CustomAgGrid
            columns={columns}
            dataRows={dataRows}
            frameworkComponents={frameworkComponent}
            setGridApi={setGridApi}
            dispatch={dispatch}
            rowCount={rowCount}
            limit={limit}
            pageSizes={pageSizes}
            page={page}
            actionWidth={100}
            loading={loading}
            renderedFrom={renderedFrom}
            allowSelection={false}
            allowAction={true}
            isClientSideGrid={true}
            refreshGrid={fetchBilling}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Grid>
      {viewInvoiceDialog.open && (
        <ViewInvoice
          invoiceData={{ ...viewInvoiceDialog.data, invoiceNumber: viewInvoiceDialog?.data?.invoiceNumber, _id: viewInvoiceDialog?.data?._id }}
          onClose={() => {
            setViewInvoiceDialog({ open: false, data: null });
          }}
          onSuccess={() => {
            setViewInvoiceDialog({ open: false, data: null });
          }}
          resource={sidebarResource.subleaseInvoice}
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
