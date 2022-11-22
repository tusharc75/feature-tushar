import { useState, useEffect, useContext, Fragment, useReducer } from "react";
import { Box, Button } from "@material-ui/core";
import axiosInstance from "../../../axios/axiosInstance";
import { useData } from "../../../StateProvider/Provider";
import CustomAgGrid, { intialState, reducer } from "../../../components/AgGridComponents/CustomAgGrid";
import { purchaseOrder, gridLoadingTimeout } from '../../../constants/helpers';
import AddInvoice from './AddInvoice';
import { CommonRenderer, DateRenderer } from '../../../components/AgGridComponents/CustomAgGridCellRenderers';

const Invoice = ({ purchaseOrderData, allowedToEdit }) => {

    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;
    const [addOpen, setAddOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    let columns = [
        {
            disabled: true,
            field: 'invoiceNumber',
            headerName: 'Invoice Number',
            show: true,
            cellRenderer: 'commonRenderer',
            primaryField: true
        },
        {
            disabled: true,
            field: 'invoiceDate',
            headerName: 'Invoice Date',
            disableFilters: true,
            show: true,
            cellRenderer: 'dateRenderer',
            primaryField: true
        }
    ];

    const fetchData = async () => {
        let res = await axiosInstance().get(`${purchaseOrder.api}/invoice/${purchaseOrderData?._id}`);
        dispatch({ type: 'initialize', data: res?.data?.data, count: res?.data?.data?.length });
        setTimeout(() => { dispatch({ type: 'loading', loading: false }); }, gridLoadingTimeout);
    };

    const frameworkComponents = {
        commonRenderer: CommonRenderer,
        dateRenderer: DateRenderer
    };

    return (
        <Fragment>
            {allowedToEdit &&
                <Box display="flex" justifyContent="space-between" m={1}>
                    <Box display="flex">
                        <Button
                            color="primary"
                            size="small"
                            variant="contained"
                            onClick={() => {
                                setAddOpen(true);
                            }}
                        >
                            Add Invoice
                        </Button>
                    </Box>
                </Box>
            }
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
                allowAction={false}
                isClientSideGrid={true}
                loading={loading}
                renderedFrom={"po_invoice"}
                refreshGrid={fetchData}
                showOnlyShowFilteredRecordSwitch={false}
            />
            {addOpen &&
                <AddInvoice
                    purchaseOrderId={purchaseOrderData?._id}
                    handleClose={() => {
                        setAddOpen(false)
                    }}
                    handleSucess={() => {
                        fetchData()
                        setAddOpen(false)
                    }}
                />}
        </Fragment>
    );
};

export default Invoice;
