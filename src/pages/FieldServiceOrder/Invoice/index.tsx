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
// import CreateBillingDialog from './CreateBillingDialog';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
// import ViewBillingDialog from './ViewBillingDialog';
import { camelCase } from 'lodash';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import DeleteIcon from '@material-ui/icons/Delete';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';

const ProgressiveBilling = ({
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
      let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.invoiceDetail.path);
      if (currentColumn !== null) {
        columns = [...columns, currentColumn?.columnData];
        if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
          rendererNames.push(currentColumn?.rendererName);
        }
      }

      return o?.fieldData;
    });
    let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
    tempFrameworkComponent = {
      ...tempFrameworkComponent,
      // invoiceMaterialRenderer: InvoiceMaterialRenderer,
      actionsRenderer: ActionsRenderer
    };
    setFrameworkComponent({ ...tempFrameworkComponent });
    let staticFields = getStaticFields();
    staticFields.forEach((field) => {
      columns.push(checkStaticField(routes.projectSales.title, field));
    });
    setColumns([...columns]);
  };

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
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Grid>
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
