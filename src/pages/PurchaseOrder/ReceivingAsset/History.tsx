import { useState, useEffect, useReducer } from "react";
import { Dialog } from '@material-ui/core';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from '../../../constants/helpers';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomAgGrid, { intialState, reducer } from "../../../components/AgGridComponents/CustomAgGrid";
import { CommonRenderer, DateTimeRenderer } from "../../../components/AgGridComponents/CustomAgGridCellRenderers";
import { capitalize } from "lodash";
import NoDataCell from "../../../components/Helpers/NoDataCell";

const History = ({ handleClose, productName, inventoryHistory }) => {

    const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes } = state;

    useEffect(() => {
        const data = JSON.parse(JSON.stringify(inventoryHistory));
        let rows = data?.map((u: any, index) => {
            u._id = index;
            u.type = capitalize(u?.type);
            return u;
        });
        rows?.reverse()
        dispatch({ type: "initialize", data: rows, count: rows.length });
    }, []);

    const columns = [
        { field: "date", headerName: "Date", show: true, cellRenderer: "dateTimeRenderer", filter: false, sortable: false },
        { field: "type", headerName: "Type", show: true, cellRenderer: "commonRenderer" },
        {
            field: "qty",
            headerName: "Qty",
            show: true,
            cellRenderer: "creditDebitRenderer",
            filter: false, sortable: false,
            cellStyle: params => {
                if (params?.data?.type === "Credit") {
                    return { backgroundColor: "#90ee90" }
                };
                if (params?.data?.type === "Debit") {
                    return { backgroundColor: "#FFCCCB" };
                };
            }
        },
        { field: "comment", headerName: "Comment", show: true, cellRenderer: "commonRenderer" },
    ];

    const CreditDebitRenderer = (params: any) => (
        <span>
            {params?.value ? params?.data?.type === "Debit" ? `-${params?.value}` : params?.value : <NoDataCell />}
        </span>
    );


    const frameworkComponents = {
        commonRenderer: CommonRenderer,
        creditDebitRenderer: CreditDebitRenderer,
        dateTimeRenderer: DateTimeRenderer
    };

    return (
        <Dialog
            fullWidth
            maxWidth="md"
            fullScreen={fullScreen || isMobile || isTablet}
            TransitionComponent={CustomDialogTransition}
            aria-labelledby="customized-dialog-title"
            open={true}
        >
            <CustomDialogHeader
                title={`History - ${productName}`}
                showRequiredLabel={false}
                onClose={handleClose}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                    setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
            />
            <CustomDialogContent>
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
                    renderedFrom={"po_inventory_history"}
                    refreshGrid={() => { }}
                />
            </CustomDialogContent>
        </Dialog>
    );
};

export default History;
