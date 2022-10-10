import { useState, useEffect, useContext, useReducer } from 'react';
import { Box, Dialog } from '@material-ui/core';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { gridLoadingTimeout, prepareDataForGrid } from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomAgGrid, { intialState, reducer } from 'src/components/AgGridComponents/CustomAgGrid';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import { CheckboxRenderer, CommonRenderer, DateRenderer, DateTimeRenderer } from 'src/components/AgGridComponents/CustomAgGridCellRenderers';

const Logs = ({ handleClose, workOrderId = null }) => {

    const renderedFrom = `workorder_service_log`;
    const { state: { selectedEntity } }: any = useData();
    const toastConfig = useContext(CustomToastContext);
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes } = state;

    useEffect(() => {
        fetchData()
    }, []);

    const frameWorkComponent = {
        commonRenderer: CommonRenderer,
        dateTimeRenderer: DateTimeRenderer,
    };
    const columns = [
        { field: "date", headerName: "Date", show: true, cellRenderer: "dateTimeRenderer" },
        { field: "service", headerName: "Service", show: true, cellRenderer: "commonRenderer" },
        { field: "operation", headerName: "Operation", show: true, cellRenderer: "commonRenderer" },

    ]

    const fetchData = () => {
        dispatch({ type: 'loading', loading: true });
        if (gridApi) {
            gridApi.setRowData([]);
        }
        axiosInstance()
            .get(`${routes.workOrder.path}/${workOrderId}/log`)
            .then(({ data: { data } }) => {
                let rows = data.map((u) => {
                    let res: any = {
                        ...prepareDataForGrid(u),
                    };
                    return res;
                });
                dispatch({ type: "initialize", data: rows, count: rows.length });
                setTimeout(() => {
                    dispatch({ type: 'loading', loading: false });
                }, gridLoadingTimeout);

            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
            });
    };

    return (
        <Dialog
            fullWidth
            maxWidth="md"
            fullScreen={true}
            open={true}
            onClose={handleClose}
            aria-labelledby="logs-dialog">
            <CustomDialogHeader
                title={`Logs`}
                showManimizeMaximize={false}
                showRequiredLabel={false}
                onClose={handleClose}
            />
            <CustomDialogContent>
                {frameWorkComponent && Object.keys(frameWorkComponent).length > 0 ? (
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
                        allowSelection={true}
                        showOnlyShowFilteredRecordSwitch={true}
                        refreshGrid={fetchData}
                        renderedFrom={renderedFrom}
                        isClientSideGrid={true}
                    />
                ) : (
                    <Box p={2} height={500} bgcolor="white">
                        <CommonSkeleton lenArray={[...Array(10).keys()]} />
                    </Box>
                )}
            </CustomDialogContent>
        </Dialog>
    );
};

export default Logs;
