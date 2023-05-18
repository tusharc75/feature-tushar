import { Box, Button, Grid, IconButton } from '@material-ui/core';
import { useContext, useEffect, useReducer, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomAgGrid, { intialState, reducer } from 'src/components/AgGridComponents/CustomAgGrid';
import CustomRenderCell from 'src/components/Helpers/CustomRenderCell';
import routes from 'src/components/Helpers/Routes';
import { gridLoadingTimeout, invoice, isObjectEmpty, prepareDataForGrid } from 'src/constants/helpers';
import useColumns, { checkStaticField, getFrameworkComponents, getStaticFields } from 'src/constants/useColumns';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import CreateBillingDialog from './CreateBillingDialog';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ViewBillingDialog from './ViewBillingDialog';
import { camelCase } from 'lodash';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import DeleteIcon from '@material-ui/icons/Delete';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';

const ProgressiveBilling = ({ rentalId, rentalManagementData, currencySymbol }) => {
  const renderedFrom = camelCase(routes?.invoice?.title);
  const localStorageSelectedRecords = `${renderedFrom}_selected`;

  const toastConfig = useContext(CustomToastContext);

  const [createBillDialog, setCreateBillDialog] = useState({ open: false });
  const [viewBillDialog, setViewBillDialog] = useState({ open: false, invoiceData: null });
  const [invoiceData, setInvoiceData] = useState(null);
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

    if (JSON.parse(sessionStorage.getItem('filters')) !== null) {
      let savedFilter = JSON.parse(sessionStorage.getItem('filters'));
      dispatch({ type: 'filter', filters: savedFilter });
    }
  };

  const InvoiceMaterialRenderer = (params) => (
    <span
      className="link"
      onClick={() => {
        setViewBillDialog({ open: true, invoiceData: params.data });
      }}
    >
      <CustomRenderCell value={params?.value} />
    </span>
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
            <DeleteIcon color="error" />
          </IconButton>
        </HtmlTooltip>
      )}
    </>
  );

  useEffect(() => {
    fetchBilling();
  }, [page, limit, filters, sorting]);

  const replaceFieldName = (field) => {
    switch (field) {
      case 'createdBy':
        return 'createdBy.user.concatedName';

      case 'updatedBy':
        return 'updatedBy.user.concatedName';

      default:
        return field;
    }
  };

  const replaceFieldNameForSorting = (field) => {
    const updatedField = replaceFieldName(field);
    if (field !== updatedField) return updatedField;
    switch (field) {
      case 'owner':
        return 'owner.optionLabel';

      case 'customerAccount':
        return 'customerAccount.optionLabel';

      case 'supplierAccountName':
        return 'supplierAccountName.optionLabel';

      default:
        return field;
    }
  };

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}&rentalJob=${rentalId}`;
    if (showFilteredRecordsOnly) {
      const savedRecords = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : [];
      deepFilter = `${deepFilter}&getById=${JSON.stringify(savedRecords.map((m) => m._id))}`;
    }
    if (!isObjectEmpty(filters)) {
      const updatedFilters = [];
      Object.keys(filters).forEach((field) => {
        updatedFilters.push({
          field: replaceFieldName(field),
          term: filters[field].filter
        });
      });
      deepFilter = `${deepFilter}&deepFilter=${encodeURI(JSON.stringify(updatedFilters))}&filterType=and`;
    }
    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${replaceFieldNameForSorting(sorting[0].colId)}&orderBy=${sorting[0].sort}`;
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
        if (data?.length) {
          setInvoiceData(data);
        }
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
      <Box display="flex" justifyContent="flex-end">
        <Box display="flex" alignItems="center" pt={2} pr={2}>
          <Button variant="contained" color="primary" size="small" onClick={() => setCreateBillDialog({ open: true })} aria-controls="action-menu">
            Create Billing
          </Button>
        </Box>
      </Box>
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
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Grid>
      {createBillDialog.open && (
        <CreateBillingDialog
          rentalManagementData={rentalManagementData}
          currencySymbol={currencySymbol}
          invoiceData={invoiceData}
          onClose={() => {
            setCreateBillDialog({ open: false });
          }}
          onSuccess={() => {
            setCreateBillDialog({ open: false });
            fetchBilling();
          }}
        />
      )}
      {viewBillDialog.open && (
        <ViewBillingDialog
          rentalManagementData={rentalManagementData}
          invoiceData={viewBillDialog?.invoiceData}
          currencySymbol={currencySymbol}
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
    </>
  );
};
export default ProgressiveBilling;
