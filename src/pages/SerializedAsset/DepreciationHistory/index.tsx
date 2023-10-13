import { useState, useEffect, useContext, useReducer } from 'react';
import { Box } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { prepareDataForGrid, serializedAsset } from '../../../constants/helpers';
import CustomAgGrid, { intialState, reducer } from '../../../components/AgGridComponents/CustomAgGrid';
import { CommonRenderer, DateRenderer } from '../../../components/AgGridComponents/CustomAgGridCellRenderers';
import { camelCase } from 'lodash';

const DepreciationHistory = ({ id, canIssueCertificate, supplierAccount, assetDetails = null }) => {
    const toastConfig = useContext(CustomToastContext);
    const renderedFrom = `${camelCase(routes?.serializedAsset.title)}_certificationHistory`;
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes } = state;
    const [columns, setColumns] = useState([]);
    const [frameWorkComponent, setFrameWorkComponent] = useState({});

    useEffect(() => {
        fetchGridColumns();
    }, []);

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    const fetchData = () => {
        dispatch({ type: 'loading', loading: true });
        if (gridApi) {
            gridApi.setRowData([]);
        }
        var api = `${serializedAsset.api}/${id}/depreciation-history`;
        if (supplierAccount) {
            api = api + `?supplierAccount=${supplierAccount}`;
        }
        axiosInstance()
            .get(api)
            .then(({ data: { data } }) => {
                let rows = data?.map((u) => {
                    let finalObject: any = prepareDataForGrid(u);
                    finalObject.attachmentId = u?.attachmentId;
                    return {
                        ...finalObject
                    };
                });
                dispatch({ type: 'initialize', data: rows, count: rows.length });
                dispatch({ type: 'loading', loading: false });
            })
            .catch((error) => {
                toastConfig.setToastConfig(error);
                dispatch({ type: 'loading', loading: false });
            });
    };

    const fetchGridColumns = () => {
        const column = [
            { field: 'date', headerName: 'Date', show: true, cellRenderer: 'dateRenderer' },
            { field: 'amount', headerName: 'Depreciation Amount', show: true, cellRenderer: 'commonRenderer' },
            { field: 'netBookValue', headerName: 'Net Book Value', show: true, cellRenderer: 'commonRenderer' }
        ]
        const frameworkComponents = {
            commonRenderer: CommonRenderer,
            dateRenderer: DateRenderer
        };
        setFrameWorkComponent({ ...frameworkComponents });
        setColumns([...column]);
    };

    return (
        <>
            <Box>
                {Object.keys(frameWorkComponent).length > 0 ? (
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
                        allowSelection={false}
                        isClientSideGrid={true}
                        loading={loading}
                        renderedFrom={renderedFrom}
                        refreshGrid={fetchData}
                    />
                ) : (
                    <Box p={2} height={500}>
                        <CommonSkeleton lenArray={[...Array(10).keys()]} />
                    </Box>
                )}
            </Box>
        </>
    );
};

export default DepreciationHistory;
