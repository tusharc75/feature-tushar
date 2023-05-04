import Box from "@material-ui/core/Box/Box";
import { useState, useEffect, useReducer, useContext } from "react";
import CommonSkeleton from "../../../components/Helpers/CommonSkeleton";
import CustomAgGrid, { intialState, reducer } from "../../../components/AgGridComponents/CustomAgGrid";
import Grid from "@material-ui/core/Grid/Grid";
import axiosInstance from 'src/axios/axiosInstance';
import { gridLoadingTimeout, prepareDataForGrid, purchaseOrder, } from 'src/constants/helpers';
import { CommonRenderer, NumberRenderer, DateTimeRenderer } from "../../../components/AgGridComponents/CustomAgGridCellRenderers";
import NoDataCell from "../../../components/Helpers/NoDataCell";
import Dialog from '@material-ui/core/Dialog';
import { CustomDialogTransition } from '../../../constants/helpers';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import { capitalize } from "lodash";
import { useData } from "src/StateProvider/Provider";
import { Link } from 'react-router-dom';
import routes from "src/components/Helpers/Routes";

const History = ({ handleClose, product, productName, poId, _id }) => {

    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes } = state;
    const toastConfig = useContext(CustomToastContext)
    const { state: { user } }: any = useData();

    useEffect(() => {
        fetchRecords()
    }, []);

    const fetchRecords = async () => {
        dispatch({ type: "loading", loading: true });
        if (gridApi) {
            gridApi.setRowData([]);
        }
        axiosInstance().get(`${purchaseOrder.api}/${poId}/ledger/${_id}/${product}`).then(({ data: { data } }) => {
            let rows = data.map((u) => {
                let finalObject: any = prepareDataForGrid(u, user);
                finalObject.type = capitalize(u.type)
                return finalObject;
            });
            dispatch({ type: "initialize", data: rows, count: rows?.length });
            setTimeout(() => { dispatch({ type: "loading", loading: false }) }, gridLoadingTimeout);
        }).catch((error) => {
            toastConfig.setToastConfig(error);
            dispatch({ type: "loading", loading: false });
        });
    };

    const columns = [
        { field: "date", headerName: "Date", show: true, cellRenderer: "dateTimeRenderer", filter: false, sortable: false },
        { field: "type", headerName: "Type", show: true, cellRenderer: "commonRenderer", filter: true, sortable: true, },
        {
            field: "qty", headerName: "Qty", show: true, cellRenderer: "creditDebitRenderer", filter: false, sortable: false,
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
            field: "totalPrice", headerName: "Amount", show: true, cellRenderer: "creditDebitRenderer", filter: false, sortable: false,
            cellStyle: params => {
                if (params?.data?.type === "Credit") {
                    return { backgroundColor: "#90ee90" }
                };
                if (params?.data?.type === "Debit") {
                    return { backgroundColor: "#FFCCCB" };
                };
            }
        },
        {
            field: 'warehouse',
            headerName: routes.warehouse.title,
            show: true,
            filter: false,
            sortable: false,
            cellRenderer: 'warehouseRenderer'
        },
        ...(user?.user?.brandPolicy?.storageLocation ? [
            {
                field: 'storageLocation',
                headerName: 'Storage Location',
                show: true,
                filter: false,
                sortable: false,
                cellRenderer: 'storageLocationRenderer'
            }
        ] : []),
        { field: 'comment', headerName: 'Comment', show: true, cellRenderer: 'commonRenderer' },
        { field: 'user', headerName: 'Transacted By', show: true, cellRenderer: 'userRenderer' },
        { field: 'purchaseOrderRejectedDate', headerName: 'Purchase Order Rejected Date', filter: false, sortable: false, cellRenderer: 'dateTimeRenderer' },
        { field: 'transactionDate', headerName: 'Actual Transaction Date', show: false, filter: false, sortable: false, cellRenderer: 'dateTimeRenderer' }
    ];


    const WarehouseRenderer = (params) =>
        params?.value ? (
            <Link className="link" title={params.value} to={`${routes.warehouseDetail.path}/${params.data.warehouseId}`}>
                {params.value}
            </Link>
        ) : (
            <NoDataCell />
        );

    const StorageLocationRenderer = (params) =>
        params?.value ? (
            <Link className="link" title={params.value} to={`${routes.storageLocationDetail.path}/${params.data.storageLocationId}`}>
                {params.value}
            </Link>
        ) : (
            <NoDataCell />
        );

    const UserRenderer = (params) =>
        params?.value ? (
            <Link className="link" title={params.value} to={`${routes.userDetail.path}/${params.data.userId}`}>
                {params.value}
            </Link>
        ) : (
            <NoDataCell />
        );

    const CreditDebitRenderer = (params: any) => (
        <span>
            {params?.value ? params?.data?.type === "Debit" ? `-${params?.value}` : params?.value : <NoDataCell />}
        </span>
    );

    const frameworkComponents = {
        creditDebitRenderer: CreditDebitRenderer,
        warehouseRenderer: WarehouseRenderer,
        storageLocationRenderer: StorageLocationRenderer,
        userRenderer: UserRenderer,
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
                            renderedFrom={"purchaseOrder_history"}
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

export default History;
