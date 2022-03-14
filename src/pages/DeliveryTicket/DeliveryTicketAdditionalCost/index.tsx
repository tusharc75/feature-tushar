import { useState, useEffect, useContext, useReducer, Fragment } from "react";
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "../../../axios/axiosInstance";
import { Box, CircularProgress, TextField } from "@material-ui/core";
import SearchBox from '../../../components/Helpers/SearchBox'
import CustomAgGrid, { reducer, intialState } from "../../../components/AgGridComponents/CustomAgGrid";
import { gridLoadingTimeout, CustomDialogTransition, packages, isObjectEmpty, prepareDataForGrid, getLocalStorageArrayData, deliveryTicket } from '../../../constants/helpers';
import CommonSkeleton from "../../../components/Helpers/CommonSkeleton";
import Dialog from "@material-ui/core/Dialog/Dialog";
import CustomDialogHeader from "../../../components/CustomDialog/CustomDialogHeader";
import CustomDialogContent from "../../../components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "../../../components/CustomDialog/CustomDialogFooter";
import CustomAgGridEditable from "../../../components/AgGridComponents/CustomAgGridEditable";
import { startCase } from "lodash";
import { genrateColoum, getColumnData, getFrameworkComponents, getStaticFields } from "../../../constants/columns";
import routes from "../../../components/Helpers/Routes";
import { useData } from "../../../StateProvider/Provider";
import { findOne, objectStore } from "src/constants/indexdbhelper";
import { CustomOfflineContext } from "src/StateProvider/OfflineContext/OfflineContext";
import { isMobile, isTablet } from "react-device-detect";
import CustomSwipableList from "src/components/SwipableListComponents/CustomSwipableList";
import { fetch_rental_cost_fields } from "src/components/RentalManagment/helper";
import { CommonRenderer } from "src/components/AgGridComponents/CustomAgGridCellRenderers";

const DeliveryTicketAdditionalCost = ({ renderedFrom, additionalCost }) => {

    const toastConfig = useContext(CustomToastContext)

    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes } = state;
    const [columns, setColumns] = useState(null);
    const [frameWorkComponent, setFrameWorkComponent] = useState({})
    const {
        state: { user, permissions }
    }: any = useData();
    const { isOffline } = useContext(CustomOfflineContext);

    useEffect(() => {
        fetchGridColumns()
    }, [])

    const fetchAdditionalCost = async () => {
        try {
            dispatch({ type: "loading", loading: true });
            if (gridApi) {
                gridApi.setRowData([]);
            }
            let data = additionalCost;
            let rows = data.map((u) => {
                let res = {
                    ...prepareDataForGrid(u, user)
                };
                return res;
            });
            dispatch({ type: "initialize", data: rows, count: rows.length });
            setTimeout(() => { dispatch({ type: "loading", loading: false }); }, gridLoadingTimeout);
        }
        catch (error) {
            toastConfig.setToastConfig(error);
            dispatch({ type: "loading", loading: false });
        }
    };


    const fetchGridColumns = async () => {
        const fields = await fetch_rental_cost_fields("", isOffline);
        let rendererNames = [];
        let columns = []
        genrateColoum(fields, columns, rendererNames, false, renderedFrom);
        let tempFrameworkComponent = getFrameworkComponents(rendererNames, true)
        tempFrameworkComponent = {
            commonRenderer: CommonRenderer,
            ...tempFrameworkComponent,
        }
        setFrameWorkComponent({ ...tempFrameworkComponent })
        setColumns([...columns])
        fetchAdditionalCost()
    }

    return (
        <>
            {isMobile && !isTablet ? <CustomSwipableList
                allowSelection={true}
                allowSwipe={true}
                permissions={permissions}
                primaryField={columns?.find(d => d.field === "productName")}
                onClick={(data) => { }}
                selectedRecords={[]}
                dataRows={dataRows}
                dispatch={dispatch}
                onEdit={() => {

                }}
                extraParamsToCheckDelete={true}
                onDelete={() => {
                }}
                rowCount={rowCount}
                page={page}
                loading={loading}
                chips={[]}
                onCreate={null}
                showClone={false}
                fullHeight={true}
                renderedFrom={renderedFrom}
                onClone={() => {
                }}
            /> :
                columns ?
                    <CustomAgGrid
                        columns={columns}
                        dataRows={dataRows}
                        frameworkComponents={frameWorkComponent}
                        setGridApi={setGridApi}
                        dispatch={dispatch}
                        rowCount={rowCount}
                        limit={limit}
                        pageSizes={pageSizes}
                        page={page}
                        allowAction={false}
                        loading={loading}
                        allowSelection={false}
                        showOnlyShowFilteredRecordSwitch={true}
                        refreshGrid={fetchAdditionalCost}
                        renderedFrom={renderedFrom}
                        isClientSideGrid={true}
                    />
                    : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>}

        </>

    );
}

export default DeliveryTicketAdditionalCost;