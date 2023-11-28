import { useState, useEffect, useContext, useReducer } from 'react';
import { Box } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { dateFormat, prepareDataForGrid, serializedAsset } from '../../../constants/helpers';
import { camelCase } from 'lodash';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import moment from 'moment';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTableNew';

const DepreciationHistory = ({ id }) => {
    const toastConfig = useContext(CustomToastContext);
    const renderedFrom = `${camelCase(routes?.serializedAsset.title)}_depreciationHistory`;
    const { state, dispatch } = useTableReducer();
    const [columns, setColumns] = useState(null);

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
        var api = `${serializedAsset.api}/${id}/depreciation-history`;
        axiosInstance()
            .get(api)
            .then(({ data: { data } }) => {
                let rows = data?.map((u) => {
                    let finalObject: any = prepareDataForGrid(u);
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
            {
                accessor: 'date', Header: 'Date', show: true,
                Cell: ({ row }) => (
                    row.original?.date ? (
                        <h5 className="createBy" title={`${moment(row.original?.date).format(dateFormat)}`}>
                            {moment(row.original?.date)?.format(dateFormat)}
                        </h5>
                    ) : (
                        <NoDataCell />
                    )
                )
            },
            { accessor: 'amount', Header: 'Depreciation Amount', show: true },
            { accessor: 'netBookValue', Header: 'Net Book Value', show: true }
        ]
        setColumns([...column]);
    };

    return (
        <>
            <Box>
                {columns ? (
                    <CustomReactTable
                        height={'calc(100vh - 200px)'}
                        columns={columns}
                        state={state}
                        dispatch={dispatch}
                        renderedFrom={renderedFrom}
                        isClientSideGrid={false}
                        refreshGrid={fetchData}
                        showOnlyShowFilteredRecordSwitch={true}
                        showFilters={false}
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
