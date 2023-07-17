import React, { useEffect, useReducer, useState } from "react";
import { Box, Button, Grid, IconButton } from "@material-ui/core";
import CustomAgGrid, { intialState, reducer } from 'src/components/AgGridComponents/CustomAgGrid';
import CommonSkeleton from "src/components/Helpers/CommonSkeleton";
import axiosInstance from "src/axios/axiosInstance";
import useColumns, { checkStaticField, getFrameworkComponents, getStaticFields } from 'src/constants/useColumns';
import routes from "src/components/Helpers/Routes";
import CustomRenderCell from "src/components/Helpers/CustomRenderCell";
import HtmlTooltip from "src/components/CustomTooltipTitle";
import DeleteIcon from '@material-ui/icons/Delete';
import CreateInvoiceDialog from "./CreateInvoiceDialog";
import { gridLoadingTimeout, invoice, isObjectEmpty, prepareDataForGrid } from "src/constants/helpers";
import { useData } from 'src/StateProvider/Provider';
import ViewBillingDialog from "./ViewBillingDialog";



const Invoice = ({ id, fieldTicketData, renderedFrom }) => {

    const localStorageSelectedRecords = `${renderedFrom}_selected`;

    const [columns, setColumns] = useState(null);
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
    const [frameworkComponent, setFrameworkComponent] = useState({});
    const [createInvoiceDialog, setCreateInvoiceDialog] = useState(false);
    const [invoiceData, setInvoiceData] = useState(null);
    const [viewBillDialog, setViewBillDialog] = useState({ open: false, invoiceData: null });


    const {
        state: { user, permissions }
    }: any = useData();

    const { getColumnData } = useColumns();

    useEffect(() => {
        fetchColumns();
    }, []);

    const fetchColumns = async () => {
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
                            // setDeleteRecord(params.data);
                            // setIsConformDialogVisible(true);
                        }}
                    >
                        <DeleteIcon color="error" />
                    </IconButton>
                </HtmlTooltip>
            )}
        </>
    );

    const getQueryString = (isExport = false) => {
        let deepFilter = `?page=${page}&limit=${limit}&fieldTicket=${id}`;
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

    const fetchInvoice = async () => {
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
                    // finalObject['isLatestInvoice'] = idx === 0 ? true : false;
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
                // toastConfig.setToastConfig(error);
            });
    };

    useEffect(() => {
        fetchInvoice();
    }, [page, limit, filters, sorting]);

    return (
        <>
            <Box display="flex" justifyContent="flex-end">
                <Box display="flex" alignItems="center" pt={2} pr={2}>
                    <Button variant="contained" color="primary" size="small" onClick={() => setCreateInvoiceDialog(true)} aria-controls="action-menu">
                        Create Invoice
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
                        allowSelection={true}
                        allowAction={true}
                        isClientSideGrid={true}
                    />
                ) : (
                    <Box p={2} height={500}>
                        <CommonSkeleton lenArray={[...Array(10).keys()]} />
                    </Box>
                )}
            </Grid>

            {createInvoiceDialog && (
                <CreateInvoiceDialog
                    id={id}
                    fieldTicketData={fieldTicketData}
                    renderedFrom={renderedFrom}
                    invoiceData={invoiceData}
                    onSuccess={() => {
                        setCreateInvoiceDialog(false);
                        fetchInvoice()
                    }}
                    onClose={() => {
                        setCreateInvoiceDialog(false);
                    }}
                />
            )}
            {viewBillDialog.open && (
                <ViewBillingDialog
                    fieldTicketData={fieldTicketData}
                    invoiceData={viewBillDialog?.invoiceData}
                    estimateStartDate={null}
                    onClose={() => {
                        setViewBillDialog({ open: false, invoiceData: null });
                    }}
                    onSuccess={() => {
                        setViewBillDialog({ open: false, invoiceData: null });
                        fetchInvoice();
                    }}
                />
            )}
        </>
    );
};

export default Invoice;
