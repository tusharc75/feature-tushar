import { Box } from '@material-ui/core';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomContainer from '../../components/CustomContainer';
import { prepareDataForGrid } from '../../constants/helpers';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';


const Deals = () => {

    const renderedFrom = camelCase(routes?.deals.title);
    const toastConfig = useContext(CustomToastContext);

    const { state, dispatch } = useTableReducer();
    const { page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;

    const {
        state: { user, selectedEntity }
    }: any = useData();

    const [columns, setColumns] = useState(null);
    const { generateColumns } = useColumns();

    useEffect(() => {
        fetchGridColumns();
    }, []);

    useEffect(() => {
        fetchDeals();
    }, [page, limit, filters, sorting, selectedEntity, showFilteredRecordsOnly, search]);

    const fetchGridColumns = async () => {
        axiosInstance().get(`/field?resource=Deals`).then(({ data: { data } }) => {
            const newColumns = generateColumns(renderedFrom, data, routes.dealDetail.path, true);
            setColumns([...newColumns, ...getStaticFields()]);
        })
            .catch((err) => {
                toastConfig.setToastConfig(err);
            });
    };

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
            deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || [])?.map((m) => m._id))}`;
        }
        return deepFilter;
    };

    const fetchDeals = async () => {
        dispatch({ type: 'loading', loading: true });
        const queryString = getQueryString();
        axiosInstance().get(`${routes.deals.path}${queryString}`).then(({ data: { data, count } }) => {
            let rows = data?.map((u) => {
                let finalObject: any = prepareDataForGrid(u, user);
                return finalObject;
            });
            dispatch({ type: 'initialize', data: rows, count: count });
            dispatch({ type: 'loading', loading: false });
        })
            .catch((err) => {
                dispatch({ type: 'loading', loading: false });
                toastConfig.setToastConfig(err);
            });
    };

    return (
        <section className="main-container-v1">
            <div className="headerbox-v1">
                <CustomBreadCrumbs routes={[routes.deals]} />
            </div>
            <CustomContainer>
                {columns ? (
                    <CustomReactTable
                        height={'calc(100vh - 200px)'}
                        columns={columns}
                        state={state}
                        dispatch={dispatch}
                        renderedFrom={renderedFrom}
                        isClientSideGrid={false}
                        refreshGrid={fetchDeals}
                        showOnlyShowFilteredRecordSwitch={false}
                        showFilters={true}
                    />
                ) : (
                    <Box p={2} height={500}>
                        <CommonSkeleton lenArray={[...Array(10).keys()]} />
                    </Box>
                )}
            </CustomContainer>
        </section>
    );
};

export default Deals;
