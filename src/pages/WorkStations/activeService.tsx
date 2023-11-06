import { Box, Grid } from '@material-ui/core';
import { useContext, useEffect, useState } from 'react';
import routes from 'src/components/Helpers/Routes';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { useData } from 'src/StateProvider/Provider';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CustomContainer from '../../components/CustomContainer';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTableNew';
import { camelCase } from 'lodash';
import { Link } from 'react-router-dom';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { gridLoadingTimeout, prepareDataForGrid, sidebarResource } from '../../constants/helpers';

const ActiveService = (workStationId) => {
    const toastConfig = useContext(CustomToastContext);
    const [loading, setLoading] = useState(false);
    const { state, dispatch } = useTableReducer();
    const [columns, setColumns] = useState(null);
    const renderedFrom = camelCase(routes?.workStations.title);
    const {
        state: { user, permissions }
    }: any = useData();

    useEffect(() => {
        if (workStationId) {
            fetchActiveServicesData();
            fetchColumns();
        }
    }, []);

    const fetchActiveServicesData = async () => {
        dispatch({ type: 'loading', loading: true });
        axiosInstance()
            .get(`${routes.workStations.path}/active-service/${workStationId.workStationId}`)
            .then(({ data: { data } }) => {
                let count = data?.count
                let rows = data?.data?.map((u) => {
                    let finalObject = prepareDataForGrid(u, user);
                    finalObject = { ...finalObject, service: u?.service };
                    return finalObject;
                });
                dispatch({ type: 'initialize', data: rows, count: count });
            })
            .catch((error) => {
                toastConfig.setToastConfig(error);
            })
            .finally(() => {
                setTimeout(() => {
                    dispatch({ type: 'loading', loading: false });
                }, gridLoadingTimeout);
            });
    };

    const fetchColumns = async () => {
        let column: any = [
            {
                accessor: 'workorder',
                Header: 'Work Order',
                width: 70,
                Cell: ({ row }) => (row?.original?.workOrderNumber ? (
                    <Link
                        className="link text-truncate"
                        title={row?.original?.workOrderNumber}
                        to={`${routes?.workOrderDetail?.path}/${row?.original?.workOrderId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {row?.original?.workOrderNumber}
                    </Link>
                ) : (
                    <NoDataCell />
                )
                )

            },
            {
                accessor: 'service',
                Header: 'Service',
                width: 70,
                Cell: ({ row }) => (
                    row?.original?.service ? (
                        <Link
                            className="link text-truncate"
                            title={row?.original?.service?.serviceName}
                            to={`${routes?.serviceMasterDetail?.path}/${row?.original?.service?._id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {row?.original?.service?.serviceName}
                        </Link>
                    ) : (
                        <NoDataCell />
                    )
                )
            },
            {
                accessor: 'status',
                Header: 'Service Status',
                width: 70,
                Cell: ({ row }) => (row?.original?.status ? (
                    <p> {row?.original?.status} </p>
                ) : (
                    <NoDataCell />
                )
                )
            }
        ];
        setColumns(column);
    };

    return (

        <Box>
            {loading ? (
                <Grid container spacing={2} style={{ padding: '8px' }}>
                    <CommonSkeleton lenArray={[...Array(7).keys()]} />
                </Grid>
            ) : (
                <CustomContainer>
                    {columns ? (
                        <CustomReactTable
                            height={'calc(100vh - 200px)'}
                            columns={columns}
                            onSelect={() => { }}
                            state={state}
                            dispatch={dispatch}
                            renderedFrom={renderedFrom}
                            isClientSideGrid={false}
                            refreshGrid={fetchActiveServicesData}
                            showOnlyShowFilteredRecordSwitch={true}
                            showFilters={true}
                            resource={sidebarResource.workStations}
                            hideAction={true}
                        />
                    ) : null}
                </CustomContainer>
            )}
        </Box>

    );
};

export default ActiveService;
