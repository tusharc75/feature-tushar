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
import { getColumnData, getFrameworkComponents, getStaticFields } from "../../../constants/columns";
import routes from "../../../components/Helpers/Routes";
import { useData } from "../../../StateProvider/Provider";
import { findOne, objectStore } from "src/constants/indexdbhelper";
import { CustomOfflineContext } from "src/StateProvider/OfflineContext/OfflineContext";
import { isMobile, isTablet } from "react-device-detect";
import CustomSwipableList from "src/components/SwipableListComponents/CustomSwipableList";




const DeliveryTicketProduct = ({ renderedFrom, deliveryTicketId }) => {

    const toastConfig = useContext(CustomToastContext)

    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting } = state;
    const [columns, setColumns] = useState(null);
    const [frameWorkComponent, setFrameWorkComponent] = useState({})
    const {
        state: { user, permissions }
    }: any = useData();
    const { isOffline } = useContext(CustomOfflineContext);

    const defaultColumns =
        [
            { field: "qty", headerName: "Qty", show: true, disabled: true, cellRenderer: "commonRenderer", cellEditor: "numericCellEditor", editable: true },
            { field: "inventoryInWarehouseCount", headerName: "Available Asset", show: true, disabled: true, cellRenderer: "commonRenderer", editable: false }
        ]
    useEffect(() => {
        fetchGridColumns()
    }, [])

    useEffect(() => {
        fetchProduct()
    }, [page, limit, filters, sorting, search]);



    const fetchProduct = async () => {
        try {
            dispatch({ type: "loading", loading: true });
            if (gridApi) {
                gridApi.setRowData([]);
            }
            let data;
            if (isOffline) {
                const deliveryTicket = await findOne(objectStore.deliveryTicket, deliveryTicketId)
                const response = await findOne(objectStore.rentalManagement, deliveryTicket?.rentalJob?.optionValue)
                data = response?.product
                const inventory = deliveryTicket?.product?.map((e) => e.optionValue);
                data = response?.product?.filter(d => inventory?.includes(d.inventory)).map(obj => obj.inventoryDetail)
            }
            else {
                const response = await axiosInstance().get(`${deliveryTicket.api}/${deliveryTicketId}/products`)
                data = response?.data?.data
            }
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


    const fetchGridColumns = () => {
        axiosInstance()
            .get("/field?resource=Product&view=true")
            .then(({ data: { data } }) => {
                let columns = []
                let rendererNames = []
                data.forEach(o => {
                    let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.productDetail.path)
                    if (currentColumn !== null) {
                        columns = [...columns, currentColumn?.columnData]
                        if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
                            rendererNames.push(currentColumn?.rendererName)
                        }
                    }
                })
                let tempFrameworkComponent = getFrameworkComponents(rendererNames, true)
                tempFrameworkComponent = {
                    ...tempFrameworkComponent,
                }
                setFrameWorkComponent({ ...tempFrameworkComponent })
                columns = [...columns, ...getStaticFields()]
                setColumns([...columns, ...defaultColumns])
            })
    }

    return (
        <>            {isMobile && !isTablet ? <CustomSwipableList
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
                    refreshGrid={fetchProduct}
                    renderedFrom={renderedFrom}
                    isClientSideGrid={true}
                />
                : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>}

        </>

    );
}

export default DeliveryTicketProduct;