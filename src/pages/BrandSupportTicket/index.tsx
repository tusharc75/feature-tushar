import { Autocomplete, Box, TextField } from '@mui/material';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomContainer from '../../components/CustomContainer';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import {
    gridLoadingTimeout,
    prepareDataForGrid,
} from '../../constants/helpers';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import axios, { CancelTokenSource } from 'axios';

const BrandSupportTicket = () => {
    const renderedFrom = camelCase("Brand Support Tickets");
    const toastConfig = useContext(CustomToastContext);
    const { state, dispatch } = useTableReducer({ renderedFrom });
    const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly, dataRows } = state;
    const { generateColumns } = useColumns();
    const {
        state: { user, selectedEntity, permissions }
    }: any = useData();
    const [selectedBrand, setSelectedBrand] = useState(null);
    const [brandList, setBrandList] = useState([]);
    const [renderCount, setRenderCount] = useState(0);
    const [columns, setColumns] = useState(null);

    useEffect(() => {
        fetchBrand();
    }, []);

    useEffect(() => {
        fetchGridColumns();
    }, [selectedBrand]);

    useEffect(() => {
        if (renderCount > 0) {
            const cancelTokenSource = axios.CancelToken.source();
            fetchData(cancelTokenSource);
            return () => cancelTokenSource.cancel();
        } else setRenderCount((preCount) => preCount + 1);
    }, [search, page, limit, filters, sorting, selectedEntity, showFilteredRecordsOnly, selectedBrand]);

    const fetchBrand = () => {
        axiosInstance()
            .get(`${routes.supportTicket.path}/brand-information/all`)
            .then(({ data: { data } }) => {
                setBrandList(data);
            })
    };

    const fetchGridColumns = async () => {
        const brand = selectedBrand ? selectedBrand?.optionValue : user?.user?.brand;
        axiosInstance()
            .get(`${routes.supportTicket.path}/fields?brand=${brand}`)
            .then(({ data: { data } }) => {
                const newColumns = generateColumns(
                    renderedFrom,
                    data,
                ).map((col) => ({
                    ...col,
                    isColumnEditable: false,
                    editAble: false,
                    editable: false
                }));
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
        if (selectedBrand) {
            deepFilter = `${deepFilter}&brand=${selectedBrand?.optionValue || user?.user?.brand}`;
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
            deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || []).map((m) => m._id))}`;
        }
        return deepFilter;
    };

    const fetchData = async (cancelTokenSource?: CancelTokenSource) => {
        dispatch({ type: 'loading', loading: true });
        const queryString = getQueryString();
        axiosInstance()
            .get(`${routes.supportTicket.path}${queryString}`, { cancelToken: cancelTokenSource?.token })
            .then(({ data: { data } }) => {
                let count = data?.count;
                let rows = data?.data?.map((u) => {
                    let finalObject: any = prepareDataForGrid(u, user);
                    finalObject['originalData'] = u;
                    finalObject['isChecked'] = selectedRecords.some((s) => s._id === u._id);
                    finalObject['canEdit'] = false;
                    return finalObject;
                })
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

    const handleSearch = (e) => {
        dispatch({ type: 'search', search: e.target.value });
    };

    return (
        <section className="main-container-v1">
            <div className="headerbox-v1">
                <CustomBreadCrumbs routes={[{ title: routes.brandSupportTicket.title }]} />
                <ImportExportLinks
                    permissions={{ isCreate: true, isUpdate: true, isRead: true }}
                    module={'Brand Support Tickets'}
                    api={routes.supportTicket.path}
                    afterImportCompleted={() => { }}
                    isExportAllOrSomeFeature={true}
                    total={rowCount}
                    recordsToExport={selectedRecords?.length}
                    ids={selectedRecords?.map((obj) => obj._id)}
                    onExportToExcelSuccess={() => {
                        fetchData();
                    }}
                    additionalParams={`${getQueryString(true)}&ignoreInternalFields=${true}&brand=${selectedBrand?.optionValue}`}
                    onlyExport={true}
                />
            </div>
            <CustomContainer>
                <ListingPageHeader
                    isActionButtonVisible={false}
                    isAddButtonVisible={false}
                    searchValue={search}
                    onSearch={handleSearch}
                    leftSideContents={
                        <>
                            <Autocomplete
                                style={{ width: 250 }}
                                value={selectedBrand}
                                onChange={(_, value) => {
                                    setSelectedBrand(value);
                                }}
                                options={brandList}
                                getOptionLabel={(option) => option.optionLabel}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        margin='none'
                                        size='small'
                                        label='Brand'
                                        variant='outlined'
                                    />
                                )}
                            />
                        </>
                    }
                />
                {columns ? (
                    <CustomReactTable
                        height={'calc(100vh - 200px)'}
                        columns={columns}
                        state={state}
                        dispatch={dispatch}
                        renderedFrom={renderedFrom}
                        refreshGrid={fetchData}
                        showOnlyShowFilteredRecordSwitch={true}
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

export default BrandSupportTicket;
