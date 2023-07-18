import { Box, Button, Grid, IconButton, Menu, MenuItem } from '@material-ui/core';
import { useContext, useEffect, useReducer, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomAgGrid, { intialState, reducer } from 'src/components/AgGridComponents/CustomAgGrid';
import CustomRenderCell from 'src/components/Helpers/CustomRenderCell';
import routes from 'src/components/Helpers/Routes';
import { gridLoadingTimeout, invoice, isObjectEmpty, prepareDataForGrid, fieldServiceOrder } from 'src/constants/helpers';
import useColumns, { checkStaticField, getFrameworkComponents, getStaticFields } from 'src/constants/useColumns';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { Delete, ExpandMore } from '@material-ui/icons';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import ViewBillingDialog from 'src/pages/Invoice/ViewInvoice/ViewBillingDialog';


const Invoice = ({
  fieldServiceOrderData,
  currencySymbol,
  setNextStep,
  renderedFrom,
  stepFullScreen,
  allowedToEdit,
  fromInvoice = false,
  statusOptions = [],
  updateStatus = null
}) => {
  const localStorageSelectedRecords = `${renderedFrom}_selected`;
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;

  const { getColumnData } = useColumns();
  const [frameworkComponent, setFrameworkComponent] = useState({});
  const [columns, setColumns] = useState(null);
  const [deleteRecord, setDeleteRecord] = useState<any>({});
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [viewBillDialog, setViewBillDialog] = useState({ open: false, invoiceData: null });
  const [anchorActionEl, setAnchorActionEl] = useState(null);
  const [selectedInvoices, setSelectedInvoices] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [isConsolidating, setConsolidating] = useState(false);


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
      invoiceMaterialRenderer: InvoiceMaterialRenderer,
      actionsRenderer: ActionsRenderer
    };
    setFrameworkComponent({ ...tempFrameworkComponent });
    let staticFields = getStaticFields();
    staticFields.forEach((field) => {
      columns.push(checkStaticField(routes.projectSales.title, field));
    });
    setColumns([...columns]);
  };

  const InvoiceMaterialRenderer = (params) => (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <span
        className="link"
        onClick={() => {
          setViewBillDialog({ open: true, invoiceData: params.data });
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
    </div>
  );

  const ActionsRenderer = (params) => (
    <>
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
            <Delete color="error" />
          </IconButton>
        </HtmlTooltip>
      )}
    </>
  );

  const openActions = (event) => {
    setAnchorActionEl(event.currentTarget);
  };
  const closeActions = () => {
    setAnchorActionEl(null);
  };

  useEffect(() => {
    fetchBilling();
  }, [page, limit, filters, sorting]);

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}&fieldServiceOrder=${fieldServiceOrderData?._id}`;
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
      deepFilter = `${deepFilter}&deepFilter=${encodeURI(JSON.stringify(updatedFilters))}&filterType=and`;
    }
    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }
    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURI(search)}`;
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
        // if (data?.length) {
        //   setInvoiceData(data);
        // }
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

  const handleConsolidate = async () => {
    setConsolidating(true);
    let ids = [];
    selectedInvoices.forEach((e) => {
      ids.push(e._id);
    });
    if (ids.length > 0) {
      axiosInstance()
        .put(`${fieldServiceOrder.api}/${fieldServiceOrderData?._id}/invoice/consolidate`, {
          invoices: ids
        })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          setShowConfirmBox(false);
          setConsolidating(false);
          fetchBilling();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setShowConfirmBox(false);
          setConsolidating(false);
        });
    } else {
      setShowConfirmBox(false);
      setConsolidating(false);
      fetchBilling();
    }
  };

  return (
    <>
      <Grid item xs={12} md={12} sm={12} className="mt-3">
        <Box display="flex" alignItems="center" justifyContent={'flex-end'} mr={1}>
          <Button
            variant="outlined"
            color="default"
            size="small"
            disabled={selectedRecords.length >= 2 ? false : true}
            onClick={openActions}
            aria-controls="action-menu"
            endIcon={<ExpandMore />}
            className="new-dropdown-v1"
          >
            Actions
          </Button>
          <Menu
            anchorEl={anchorActionEl}
            keepMounted
            getContentAnchorEl={null}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left'
            }}
            id="action-menu"
            open={Boolean(anchorActionEl)}
            onClose={closeActions}
          >
            <MenuItem
              onClick={() => {
                setShowConfirmBox(true);
                closeActions();
              }}
            >
              Consolidate
            </MenuItem>
          </Menu>
        </Box>
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
            allowSelection={true}
            onSelection={(data) => {
              setSelectedInvoices(data);
            }}
            allowAction={true}
            isClientSideGrid={true}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Grid>
      {viewBillDialog.open && (
        <ViewBillingDialog
          pageData={null}
          invoiceData={viewBillDialog?.invoiceData}
          estimateStartDate={null}
          onClose={() => {
            setViewBillDialog({ open: false, invoiceData: null });
          }}
          onSuccess={() => {
            setViewBillDialog({ open: false, invoiceData: null });
            fetchBilling();
          }}
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
      {showConfirmBox && (
        <ConfirmationDialog
          okBtnLoading={isConsolidating}
          open={showConfirmBox}
          message={`Are you sure you want to consolidate selected invoices?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleConsolidate}
        />
      )}
    </>
  );
};
export default Invoice;
