import { Box, Button, Grid, IconButton } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { getStaticFields, useColumns, useTableReducer, gridFilterParser } from 'src/components/CustomReactTable';
import routes from 'src/components/Helpers/Routes';
import { Link } from 'react-router-dom';
import { gridLoadingTimeout, invoice, prepareDataForGrid, rentalManagement, sidebarResource } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import CreateBillingDialog from './CreateBillingDialog';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ViewBillingDialog from './ViewBillingDialog';
import { camelCase } from 'lodash';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import DeleteIcon from '@mui/icons-material/Delete';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { deleteDisable } from 'src/constants/messageHelpers';

const ProgressiveBilling = ({ rentalId, allowCreateInvoice }) => {
  const renderedFrom = camelCase(sidebarResource.invoice);

  const toastConfig = useContext(CustomToastContext);
  const [createBillDialog, setCreateBillDialog] = useState({ open: false });
  const [viewBillDialog, setViewBillDialog] = useState({ open: false, invoiceData: null });
  const {
    state: { user, permissions, resources }
  }: any = useData();
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { generateColumns, checkStaticField } = useColumns();
  const [columns, setColumns] = useState(null);
  const [deleteRecord, setDeleteRecord] = useState<any>({});
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [rentalManagementData, setRentalManagementData] = useState(null);

  const fetchRentalManagementData = async () => {
    try {
      let data;
      const response: any = await axiosInstance().get(`${rentalManagement.api}/${rentalId}`);
      data = response?.data?.data;
      setRentalManagementData(data);
    } catch (error) {}
  };

  useEffect(() => {
    fetchRentalManagementData();
  }, [rentalId]);

  useEffect(() => {
    fetchData();
  }, [page, limit, filters, sorting]);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=Invoice`);
    data = response?.data?.data;
    let columns = [];
    let newColumns = generateColumns(renderedFrom, data, routes.invoiceDetail.path, true);
    let staticFields = getStaticFields();
    staticFields.forEach((field) => {
      newColumns.push(checkStaticField(sidebarResource.projectSales, field));
    });
    columns = [...newColumns, ActionsRenderer];
    columns?.forEach((column) => {
      if (column?.primaryField) {
        column.cell = ({ row }) => (
          <div>
            <Link
              className="link text-truncate"
              onClick={() => {
                setViewBillDialog({ open: true, invoiceData: row?.original });
              }}
            >
              {row?.original?.invoiceNumber}
            </Link>
          </div>
        );
      }
    });
    setColumns(columns);
  };

  const ActionsRenderer = {
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
        <HtmlTooltip title="View Invoice">
          <IconButton
            size="small"
            onClick={() => {
              setViewBillDialog({ open: true, invoiceData: row?.original });
            }}
          >
            <VisibilityIcon fontSize="small" color="primary" />
          </IconButton>
        </HtmlTooltip>

        <HtmlTooltip title={row?.original?.canDelete ? 'Delete' : deleteDisable}>
          <span>
            <IconButton
              size="small"
              aria-label="Delete"
              disabled={row?.original?.canDelete ? false : true}
              onClick={() => {
                setDeleteRecord(row.original);
                setIsConformDialogVisible(true);
              }}
            >
              <DeleteIcon fontSize="small" color={row?.original?.canDelete ? 'error' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
      </>
    )
  };

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}&rentalJob=${rentalId}`;
    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || [])?.map((m) => m._id))}`;
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
    dispatch({ type: 'selection', selectedRecords: [] });
    const queryString = getQueryString();
    await axiosInstance()
      .get(`${invoice.api}${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data.map((u, idx) => {
          let finalObject: any = prepareDataForGrid(u, user);
          finalObject['isLatestInvoice'] = idx === 0 ? true : false;
          finalObject['isChecked'] = false;
          finalObject['canDelete'] = permissions?.invoice?.isDelete && u?.canDelete && allowCreateInvoice;
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
      {rentalManagementData ? (
        <>
          {allowCreateInvoice && permissions?.invoice?.isCreate && (
            <Box display="flex" justifyContent="flex-end">
              <Box display="flex" alignItems="center" pt={2} pr={2}>
                <HtmlTooltip
                  title={rentalManagementData?.allowToCreateBill ? '' : 'Invoice can be created only once item delivered or service started'}
                >
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={() => setCreateBillDialog({ open: true })}
                    aria-controls="action-menu"
                    disabled={!rentalManagementData?.allowToCreateBill}
                  >
                    Create Billing
                  </Button>
                </HtmlTooltip>
              </Box>
            </Box>
          )}
          <Grid item xs={12} md={12} sm={12} className="mt-3">
            {columns ? (
              <CustomReactTable
                height={'calc(100vh - 250px)'}
                columns={columns}
                state={state}
                dispatch={dispatch}
                renderedFrom={renderedFrom}
                refreshGrid={fetchData}
                hideSelection={true}
                isClientSideGrid={true}
              />
            ) : (
              <Box p={2} height={500}>
                <CommonSkeleton lenArray={[...Array(10).keys()]} />
              </Box>
            )}
          </Grid>
        </>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {createBillDialog.open && (
        <CreateBillingDialog
          rentalManagementData={rentalManagementData}
          onClose={() => {
            setCreateBillDialog({ open: false });
          }}
          onSuccess={() => {
            setCreateBillDialog({ open: false });
            fetchData();
          }}
        />
      )}
      {viewBillDialog.open && (
        <ViewBillingDialog
          rentalManagementData={rentalManagementData}
          invoiceId={viewBillDialog?.invoiceData?._id}
          onClose={() => {
            fetchData();
            setViewBillDialog({ open: false, invoiceData: null });
          }}
          onSuccess={() => {
            fetchData();
            setViewBillDialog({ open: false, invoiceData: null });
          }}
          allowCreateInvoice={allowCreateInvoice}
          isLatestInvoice={viewBillDialog?.invoiceData?.isLatestInvoice}
        />
      )}
      {isConfirmDialogVisible && (
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
      )}
    </>
  );
};

export default ProgressiveBilling;
