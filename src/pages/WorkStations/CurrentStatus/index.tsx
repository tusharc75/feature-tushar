import { Box, Grid } from '@material-ui/core';
import { useContext, useEffect, useState } from 'react';
import routes from 'src/components/Helpers/Routes';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { useData } from 'src/StateProvider/Provider';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTableNew';
import { camelCase } from 'lodash';
import { Link } from 'react-router-dom';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { gridLoadingTimeout, prepareDataForGrid, sidebarResource } from '../../../constants/helpers';

const CurrentStatus = ({ id }) => {

    const renderedFrom = `${camelCase(routes?.workStations.title)}_activeService`;
    const toastConfig = useContext(CustomToastContext);
    const { state, dispatch } = useTableReducer();
    const [columns, setColumns] = useState(null);

    const {
        state: { user, permissions }
    }: any = useData();

    useEffect(() => {
        fetchColumns();
        fetchData();
    }, [id]);

    const fetchData = () => {
        dispatch({ type: 'loading', loading: true });
        axiosInstance()
            .get(`${routes.workStations.path}/current-status/${id}`)
            .then(({ data: { data } }) => {
                let count = data?.count
                let rows = data?.data?.map((u) => {
                    let finalObject = prepareDataForGrid(u, user);
                    finalObject = { ...finalObject };
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
        let column: any = [{
            accessor: 'workorder',
            Header: 'Work Order',
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
            ))
        },
        {
            accessor: 'service',
            Header: 'Service',
            Cell: ({ row }) => (
                row?.original?.service ? (
                    <Link className="link text-truncate"
                        title={row?.original?.service}
                        to={`${routes?.serviceMasterDetail?.path}/${row?.original?.serviceId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {row?.original?.service}
                    </Link>
                ) : (
                    <NoDataCell />
                )
            )
        },
        {
            accessor: 'status',
            Header: 'Status',
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

    return (<Box>
        {columns ? (
            <CustomReactTable
                height={'calc(100vh - 200px)'}
                columns={columns}
                onSelect={() => { }}
                state={state}
                dispatch={dispatch}
                renderedFrom={renderedFrom}
                isClientSideGrid={false}
                refreshGrid={fetchData}
                showOnlyShowFilteredRecordSwitch={false}
                showFilters={false}
                resource={sidebarResource.workStations}
                hideAction={true}
                hideSelection={true}
            />
        ) : <Grid container spacing={2} style={{ padding: '8px' }}>
            <CommonSkeleton lenArray={[...Array(7).keys()]} />
        </Grid>}
    </Box>);
};

export default CurrentStatus;
