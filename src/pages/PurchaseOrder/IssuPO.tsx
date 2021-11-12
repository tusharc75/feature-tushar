
import Box from "@material-ui/core/Box/Box";
import { useState, useEffect, useReducer, useContext } from "react";
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import CustomAgGrid, { intialState, reducer } from "../../components/AgGridComponents/CustomAgGrid";
import { CommonRenderer, DateRenderer, } from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import Grid from "@material-ui/core/Grid/Grid";
import { Button, IconButton } from "@material-ui/core";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import { gridLoadingTimeout, purchaseOrder, rentalManagement } from "../../constants/helpers";
import { useData } from "../../StateProvider/Provider";


const IssuPO = ({ combinedPurchaseOrderList, handleViewPdf, downlodingFile, setCurrentStep, currentStep }) => {
    const toastConfig = useContext(CustomToastContext);
    const {
        state: { user, permissions }
    }: any = useData();
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;
    const [columns, setColumns] = useState([
        { field: "type", headerName: "Type", show: true, disabled: true, cellRenderer: "commonRenderer" },
        { field: "description", headerName: "Description", show: true, disabled: true, cellRenderer: "commonRenderer" },
        { field: "expectedDelivery", headerName: "Expected Delivery", show: true, disabled: true, cellRenderer: "dateRenderer" },
        { field: "quantity", headerName: "Quantity", show: true, disabled: true, cellRenderer: "commonRenderer" },
        { field: "uom", headerName: "Base UOM", show: true, disabled: true, cellRenderer: "commonRenderer" },
        { field: "price", headerName: "Price", show: true, disabled: true, cellRenderer: "commonRenderer" },
        { field: "tax", headerName: "Tax Percent", show: true, disabled: true, cellRenderer: "commonRenderer" },
        { field: "taxPerUnit", headerName: "Tax Per Unit", show: true, disabled: true, cellRenderer: "commonRenderer" },
        { field: "totalTax", headerName: "Total Tax", show: true, disabled: true, cellRenderer: "commonRenderer" },
        { field: "finalPrice", headerName: "Final Price", show: true, disabled: true, cellRenderer: "commonRenderer" },
    ])


    const frameworkComponents = {
        dateRenderer: DateRenderer,
        commonRenderer: CommonRenderer,
    };

    useEffect(() => {
        dispatch({ type: "loading", loading: true });
        dispatch({
            type: "initialize", data: combinedPurchaseOrderList, count: combinedPurchaseOrderList.length
        });
        setTimeout(() => {
            dispatch({ type: "loading", loading: false });
        }, gridLoadingTimeout);
    }, [combinedPurchaseOrderList]);

    return (<>
        <Box display="flex" justifyContent="space-between" m={1}>
            <Box display="flex">
                {permissions?.purchaseOrder?.isRead && (
                    <>
                        <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            disabled={downlodingFile}
                            onClick={() => { handleViewPdf(false) }}
                        >
                            {downlodingFile ? "Please wait..." : "Preview"}
                        </Button>
                    </>
                )}
                <Box mx={1} />
                {permissions?.purchaseOrder?.isRead && (
                    <>
                        <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            disabled={downlodingFile}
                            onClick={() => { handleViewPdf(false) }}
                        >
                            {downlodingFile ? "Please wait..." : "Download"}
                        </Button>
                    </>
                )}

            </Box>
        </Box>

        <Box display="flex" justifyContent="flex-end" p="4px">
            <Box mx={1} />
            <Button
                variant="contained"
                color="primary"
                size="small"
                onClick={() => { setCurrentStep(currentStep + 1) }}
            >
                {`Issue PO`}
            </Button>
        </Box>

        <Grid item xs={12} md={12} sm={12} className="mt-3">

            {columns ?
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
                    allowAction={false}
                    loading={loading}
                    allowSelection={false}
                    renderedFrom="purchaseOrderDetailsPageService"
                />
                : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>

            }
        </Grid>
    </>
    );
}

export default IssuPO;