import { useState, useEffect, useContext, useReducer } from 'react';
import { Box, IconButton } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import CustomAgGrid, { intialState, reducer } from '../../../components/AgGridComponents/CustomAgGrid';
import { CommonRenderer, DateTimeRenderer } from '../../../components/AgGridComponents/CustomAgGridCellRenderers';
import { Link } from 'react-router-dom';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import { camelCase } from 'lodash';
import { employeeMaster } from 'src/constants/helpers';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';


const History = ({ id }) => {
    const toastConfig = useContext(CustomToastContext);

    const [gridApi, setGridApi] = useState(null);

    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

    const NameRenderer = (params: { value: any; data: { type: string; referenceId: any } }) => (
        <>
            {params.value ? params.data?.type === 'Field Ticket' ? (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <p>
                        {params?.value}
                    </p>
                    <Box ml={1}>
                        <IconButton
                            size="small"
                            onClick={() => {
                                window.open(`${routes.fieldTicketDetail.path}/${params.data.referenceId}`);
                            }}
                        >
                            <OpenInNewIcon fontSize="small" color="primary" />
                        </IconButton>
                    </Box>
                </div>
            ) :
                (
                    params.value
                )
                : (
                    <NoDataCell />
                )}
        </>
    );

    const frameworkComponents = {
        nameRenderer: NameRenderer,
        commonRenderer: CommonRenderer,
        dateTimeRenderer: DateTimeRenderer
    };

    const columns = [
        { field: 'reference', headerName: 'Reference', show: true, cellRenderer: 'nameRenderer' },
        { field: 'type', headerName: 'Type', show: true, disabled: true, cellRenderer: 'commonRenderer' },
        { field: 'service', headerName: 'Service', show: true, disabled: true, cellRenderer: 'commonRenderer' },
        { field: 'startDate', headerName: 'Start Date', show: true, disabled: true, filter: false, cellRenderer: 'dateTimeRenderer' },
        { field: 'endDate', headerName: 'End Date', show: true, disabled: true, filter: false, cellRenderer: 'dateTimeRenderer' },
        { field: 'status', headerName: 'Status', show: true, cellRenderer: 'commonRenderer' }
    ];

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
        axiosInstance()
            .get(`${employeeMaster.api}/history/${id}`)
            .then(({ data: { data } }) => {
                console.log(data)

                data = data?.map((u, index) => ({
                    ...u,
                    _id: index + 1,
                    id: index + 1,
                    type: u?.referenceType,
                    reference: u?.reference?.optionLabel,
                    referenceId: u?.reference?.optionValue,
                    service: u?.service?.optionLabel,
                    serviceId: u?.service?.optionValue,
                    date: u?.startDate

                }));
                console.log(data)
                dispatch({ type: 'initialize', data: data, count: data.length });
                dispatch({ type: 'loading', loading: false });
            })
            .catch((error) => {
                toastConfig.setToastConfig(error);
                dispatch({ type: 'loading', loading: false });
            });
    };

    return (
        <Box>
            {columns ? (
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
                    allowSelection={false}
                    isClientSideGrid={true}
                    loading={loading}
                    renderedFrom={`${camelCase(routes?.employeeMaster.title)}_history`}
                    refreshGrid={fetchData}
                />
            ) : (
                <Box p={2} height={500}>
                    <CommonSkeleton lenArray={[...Array(10).keys()]} />
                </Box>
            )}
        </Box>
    );
};

export default History;
