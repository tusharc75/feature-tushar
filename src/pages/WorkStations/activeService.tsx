import { Box, Grid } from '@material-ui/core';
import { useContext, useEffect, useState } from 'react';
import routes from 'src/components/Helpers/Routes';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { useData } from 'src/StateProvider/Provider';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CustomContainer from '../../components/CustomContainer';
import SearchBox from 'src/components/Helpers/SearchBox';
import styles from '../Leads/Header.module.scss';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTableNew';
import { camelCase } from 'lodash';
import { Link } from 'react-router-dom';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { gridLoadingTimeout, prepareDataForGrid, sidebarResource } from '../../constants/helpers';

const ActiveService = (workStationId) => {
    const toastConfig = useContext(CustomToastContext);
    const [loading, setLoading] = useState(false);
    const { state, dispatch } = useTableReducer();
    const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
    const [columns, setColumns] = useState(null);
    const renderedFrom = camelCase(routes?.workStations.title);
    const localStorageSelectedRecords = `${renderedFrom}_selected`;
    const {
        state: { user, permissions }
    }: any = useData();

    useEffect(() => {
        if (workStationId) {
            fetchActiveServicesData();
            fetchColumns();
        }
    }, []);

    const getQueryString = (isExport = false) => {
        let deepFilter = `?page=${page}&limit=${limit}`;
        if (isExport) {
            deepFilter = `?`;
        }
        const { filterByIds, deepFilters } = gridFilterParser(filters);
        if (filterByIds?.length) {
            deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterByIds)}`;
        }
        if (deepFilters?.length) {
            deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(deepFilters))}`;
        }
        if (filterByIds?.length || deepFilters?.length) {
            deepFilter = `${deepFilter}&filterType=and`;
        }
        if (sorting.length > 0) {
            deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
        }
        if (search) {
            deepFilter = `${deepFilter}&search=${encodeURIComponent(search)}`;
        }
        if (showFilteredRecordsOnly) {
            const savedRecords = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : [];
            deepFilter = `${deepFilter}&getById=${JSON.stringify(savedRecords.map((m) => m._id))}`;
        }
        return deepFilter;
    };

    const fetchActiveServicesData = async () => {
        dispatch({ type: 'loading', loading: true });
        const queryString = getQueryString();
        axiosInstance()
            .get(`${routes.workStationsActiveService.path}/${workStationId.workStationId}${queryString}`)
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

    const handleSearch = (e) => {
        dispatch({ type: 'search', search: e.target.value });
    };

    return (

        <Box>
            {loading ? (
                <Grid container spacing={2} style={{ padding: '8px' }}>
                    <CommonSkeleton lenArray={[...Array(7).keys()]} />
                </Grid>
            ) : (
                <CustomContainer>
                    <div className="header-panel">
                        <div className="flex flex-wrap gap-[8px] justify-end">
                            <SearchBox onChange={handleSearch} className={styles.search_box_input} value={search} size="small" />
                        </div>
                    </div>
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
