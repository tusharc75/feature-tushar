import { Box, Button, Grid } from "@material-ui/core";
import { useContext, useEffect, useReducer, useState } from "react";
import axiosInstance from "src/axios/axiosInstance";
import CustomAgGrid, { intialState, reducer } from "src/components/AgGridComponents/CustomAgGrid";
import { CommonRenderer, CreatedByRenderer, UpdatedByRenderer } from "src/components/AgGridComponents/CustomAgGridCellRenderers";
import { gridLoadingTimeout, prepareDataForGrid, rentalManagement } from "src/constants/helpers";
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import CreateBillingDialog from "./CreateBillingDialog";

const ProgressiveBilling = ({ rentalId, rentalManagementData, currencySymbol }) => {

    const renderedFrom = "ProgressiveBillingGrid";
    const toastConfig = useContext(CustomToastContext);
    const [createBillDialog, setCreateBillDialog] = useState(false);

    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

    const frameworkComponents = {
        commonRenderer: CommonRenderer,
        createdByRenderer: CreatedByRenderer,
        updatedByRenderer: UpdatedByRenderer,
    };
    const columns = [
        { field: 'name', headerName: 'Name', show: true, disabled: true, cellRenderer: 'commonRenderer' },
        { field: 'description', headerName: 'Description', show: true, cellRenderer: 'commonRenderer' },
        { field: 'createdBy', headerName: 'Created By', show: true, cellRenderer: 'createdByRenderer' },
        { field: 'updatedBy', headerName: 'Updated By', show: true, cellRenderer: 'updatedByRenderer' }
    ];
    const columnState = JSON.parse(localStorage.getItem(renderedFrom));

    if (columnState) {
        columns.forEach((item) => {
            columnState.forEach((d) => {
                if (d.colId === item.field) {
                    item.show = !d.hide;
                }
            });
        });
    }
    useEffect(() => {
        fetchBilling()
    }, []);

    const fetchBilling = async () => {
        dispatch({ type: 'loading', loading: true });

        if (gridApi) {
            gridApi.setRowData([]);
        }

        axiosInstance()
            .get(`${rentalManagement.api}/${rentalId}/progressive-billing`)
            .then(({ data: { data, count } }) => {
                let rows = data.map((u) => {
                    let finalObject = prepareDataForGrid(u);
                    return {
                        ...finalObject,
                    };
                });

                dispatch({ type: 'initialize', data: rows, count: count });
                setTimeout(() => {
                    dispatch({ type: 'loading', loading: false });
                }, gridLoadingTimeout);
            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
                dispatch({ type: 'loading', loading: false });
            });
        // eslint-disable-next-line
    };

    return (
        <>
            <Box display="flex" justifyContent="flex-end" >
                <Box display="flex" alignItems="center" pt={2} pr={2}>
                    <Button
                        variant="outlined"
                        color="default"
                        size="small"
                        onClick={() => setCreateBillDialog(true)}
                        aria-controls="action-menu"
                    >
                        Create Billing
                    </Button>
                </Box>
            </Box>
            <Grid item xs={12} md={12} sm={12} className="mt-3">
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
                    actionWidth={100}
                    loading={loading}
                    renderedFrom={renderedFrom}
                    allowSelection={false}
                    allowAction={false}
                    isClientSideGrid={true}
                />
            </Grid>
            {createBillDialog && <CreateBillingDialog
                rentalManagementData={rentalManagementData}
                currencySymbol={currencySymbol}
                onClose={() => { setCreateBillDialog(false) }}
                onSuccess={() => {
                    fetchBilling()
                    setCreateBillDialog(false)
                }} />}
        </>
    );
}
export default ProgressiveBilling;