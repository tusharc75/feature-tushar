import Box from "@material-ui/core/Box/Box";
import { useState, useEffect, useReducer, useContext, Fragment } from "react";
import CommonSkeleton from "../../../components/Helpers/CommonSkeleton";
import CustomAgGrid, { intialState, reducer } from "../../../components/AgGridComponents/CustomAgGrid";
import routes from "../../../components/Helpers/Routes";
import Grid from "@material-ui/core/Grid/Grid";
import axiosInstance from 'src/axios/axiosInstance';
import { gridLoadingTimeout, productInventory, } from 'src/constants/helpers';
import { prepareDataForGrid } from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';
import { CommonRenderer, NumberRenderer, DateTimeRenderer } from "../../../components/AgGridComponents/CustomAgGridCellRenderers";
import { capitalize } from "lodash";
import { Link } from 'react-router-dom'
import NoDataCell from "../../../components/Helpers/NoDataCell";
import Dialog from '@material-ui/core/Dialog';
import { CustomDialogTransition } from '../../../constants/helpers';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';

const AverageCostHistory = ({ handleClose, product, productName, showPricefilter }) => {

    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes } = state;
    const { state: { user, permissions, selectedEntity } }: any = useData();

    useEffect(() => {
        fetchRecords()
    }, []);

    const fetchRecords = async () => {
        dispatch({ type: "loading", loading: true });
        if (gridApi) {
            gridApi.setRowData([]);
        }
        let data;
        let query = "";
        if (showPricefilter?.warehouse || showPricefilter?.fromDate) {
            query = "?"
            if (showPricefilter?.warehouse) {
                query = query + `warehouse=${JSON.stringify(showPricefilter?.warehouse)}&`
            }
            if (showPricefilter?.fromDate) {
                query = query + `from=${showPricefilter?.fromDate}&to=${showPricefilter?.toDate}`
            }
        }
        const response = await axiosInstance().get(`${productInventory.api}/report/product-price-of-product/${product}${query}`)
        data = response?.data?.data
        let rows = data.map((u) => {
            let finalObject: any = prepareDataForGrid(u, user);
            finalObject.type = capitalize(u.type)
            finalObject.amount = parseFloat((finalObject.qty * finalObject.price)?.toFixed(2));
            return finalObject;
        });
        dispatch({ type: "initialize", data: rows, count: rows.length });
        setTimeout(() => { dispatch({ type: "loading", loading: false }); }, gridLoadingTimeout);
    };

    const columns = [
        { field: "date", headerName: "Date", show: true, cellRenderer: "dateTimeRenderer", filter: false, sortable: false },
        { field: "referenceType", headerName: "Reference Type", show: true, cellRenderer: "commonRenderer" },
        { field: "reference", headerName: "Reference", filter: false, sortable: false, show: true, cellRenderer: "referenceRenderer" },
        { field: "type", headerName: "Type", show: true, cellRenderer: "commonRenderer", filter: true, sortable: true, },
        {
            field: "qty", headerName: "Quantity", show: true, cellRenderer: "creditDebitRenderer", filter: false, sortable: false,
            cellStyle: params => {
                if (params?.data?.type === "Credit") {
                    return { backgroundColor: "#90ee90" }
                };
                if (params?.data?.type === "Debit") {
                    return { backgroundColor: "#FFCCCB" };
                };
            }
        },
        { field: "price", headerName: "Price", show: true, cellRenderer: "numberRenderer", filter: false, sortable: false, },
        {
            field: "amount", headerName: "Amount", show: true, cellRenderer: "creditDebitRenderer", filter: false, sortable: false,
            cellStyle: params => {
                if (params?.data?.type === "Credit") {
                    return { backgroundColor: "#90ee90" }
                };
                if (params?.data?.type === "Debit") {
                    return { backgroundColor: "#FFCCCB" };
                };
            }
        },
        { field: "warehouse", headerName: "Plant", show: true, cellRenderer: "commonRenderer", },
        { field: 'purchaseOrderRejectedDate', headerName: 'Purchase Order Rejected Date', filter: false, sortable: false, cellRenderer: 'dateTimeRenderer' },
        { field: 'transactionDate', headerName: 'Actual Transaction Date', show: false, filter: false, sortable: false, cellRenderer: 'dateTimeRenderer' }
    ];

    const CreditDebitRenderer = (params: any) => (
        <span>
            {params?.value ? params?.data?.type === "Debit" ? `-${params?.value}` : params?.value : <NoDataCell />}
        </span>
    );

    const ReferenceRenderer = (params) =>
        params?.value ? (
            params.data.referenceType === "Purchase Order" ?
                <Link className="link" title={params.value} to={`${routes.purchaseOrderDetail.path}/${params.data.referenceId}`}>
                    {params.value}
                </Link> :
                params.data.referenceType === "Transfer Inventory" ?
                    <Link className="link" title={params.value} to={`${routes.transferInventoryDetail.path}/${params.data.referenceId}`}>
                        {params.value}
                    </Link> :
                    params.data.referenceType === "Transfer Asset" ?
                        <Link className="link" title={params.value} to={`${routes.transferAssetDetail.path}/${params.data.referenceId}`}>
                            {params.value}
                        </Link> :
                        params.data.referenceType === "Sales Order" ?
                            <Link className="link" title={params.value} to={`${routes.salesOrderDetail.path}/${params.data.referenceId}`}>
                                {params.value}
                            </Link> :
                            params.data.referenceType === "Bulk Asset Creation" ?
                                <Link className="link" title={params.value} to={`${routes.bulkAssetCreationDetail.path}/${params.data.referenceId}`}>
                                    {params.value}
                                </Link> :
                                params.data.referenceType === "Serialized Asset" ?
                                    <Link className="link" title={params.value} to={`${routes.serializedAssetDetail.path}/${params.data.referenceId}`}>
                                        {params.value}
                                    </Link>
                                    : params.value
        ) : (params.data.referenceType === "Product Inventory" ?
            <p>Manual Entry</p> :
            <NoDataCell />
        );

    const frameworkComponents = {
        referenceRenderer: ReferenceRenderer,
        creditDebitRenderer: CreditDebitRenderer,
        commonRenderer: CommonRenderer,
        numberRenderer: NumberRenderer,
        dateTimeRenderer: DateTimeRenderer
    };

    return (<>
        <Dialog
            fullScreen
            TransitionComponent={CustomDialogTransition}
            aria-labelledby="customized-dialog-title"
            open={true}
            fullWidth
        >
            <CustomDialogHeader
                title={`History - ${productName}`}
                onClose={handleClose}
                showRequiredLabel={false}
            ></CustomDialogHeader>
            <CustomDialogContent>
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
                            isClientSideGrid={true}
                            allowSelection={false}
                            renderedFrom={"product_price_history"}
                            refreshGrid={fetchRecords}
                        />
                        : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>
                    }
                </Grid>
            </CustomDialogContent>
        </Dialog>
    </>
    );
};

export default AverageCostHistory;
