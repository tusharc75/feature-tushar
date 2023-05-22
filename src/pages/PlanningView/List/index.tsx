import React, { useEffect, useState, useContext, useReducer } from 'react'
import { useHistory } from 'react-router-dom';
import { TextField, Box } from '@material-ui/core';
import axiosInstance from 'src/axios/axiosInstance';
import { Autocomplete } from '@material-ui/lab';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import routes from 'src/components/Helpers/Routes';
import { gridLoadingTimeout, isObjectEmpty, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import useColumns, { getFrameworkComponents, getStaticFields, gridFilterParser } from 'src/constants/useColumns';
import CustomAgGrid, { intialState, reducer } from 'src/components/AgGridComponents/CustomAgGrid';

function ListView({ resourceList }) {

    const toastConfig = useContext(CustomToastContext);
    const {
        state: { user, selectedEntity, permissions }
    }: any = useData();
    const { getColumnData } = useColumns();

    const [gridApi, setGridApi] = useState(null);
    const [frameWorkComponent, setFrameWorkComponent] = useState({});
    const [state, dispatch] = useReducer(reducer, intialState);
    const [renderedFrom, setRenderedFrom] = useState('')
    const [selectedResource, setSelectedResource] = useState(null);
    const [columns, setColumns] = useState([])

    const { dataRows, rowCount, loading, page, limit, pageSizes, filters, sorting, appendRows } = state;

    const fetchGridColumns = async () => {
        axiosInstance()
            .get(`/field?resource=${selectedResource.resource}`)
            .then(({ data: { data } }) => {
                let columns = [];
                let rendererNames = [];
                data.forEach((o) => {
                    let currentColumn = getColumnData(renderedFrom, o?.fieldData, selectedResource.path);
                    if (currentColumn !== null) {
                        columns = [...columns, currentColumn?.columnData];
                        if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
                            rendererNames.push(currentColumn?.rendererName);
                        }
                    }
                });
                let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
                tempFrameworkComponent = {
                    ...tempFrameworkComponent,
                };
                setFrameWorkComponent({ ...tempFrameworkComponent });
                columns = [...columns, ...getStaticFields()];
                setColumns([...columns]);
            });
    };

    useEffect(() => {
        if (selectedResource) {
            setRenderedFrom(`${routes[selectedResource.key].title}`)
            fetchGridColumns();
        }
        else {
            setColumns([])
        }
    }, [selectedResource]);

    useEffect(() => {
        if (selectedResource) {
            fetchData()
        }
    }, [selectedResource, page, filters, limit, sorting])

    const getQueryString = () => {
        let deepFilter = `?page=${page}&limit=${limit}`;
        if (selectedEntity) {
            deepFilter = `${deepFilter}&entity=${selectedEntity}`;
        }

        const { filterByIds, deepFilters } = gridFilterParser(filters)

        if (filterByIds?.length) {
            deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterByIds)}`;
        }
        if (deepFilters?.length) {
            deepFilter = `${deepFilter}&deepFilter=${JSON.stringify(deepFilters)}`;
        }

        if (filterByIds?.length || deepFilters?.length) {
            deepFilter = `${deepFilter}&filterType=and`;
        }

        if (sorting.length > 0) {
            deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
        }
        return deepFilter;
    };

    const fetchData = async () => {
        dispatch({ type: 'loading', loading: true });
        const queryString = getQueryString();
        if (gridApi) {
            gridApi.setRowData([]);
        }
        try {
            let data: any = [], count;
            const response: any = await axiosInstance().get(`${routes[selectedResource.key].path}${queryString}`);
            data = response?.data?.data?.data ? response?.data?.data?.data : response?.data?.data;
            count = response?.data?.data?.count ? response?.data?.data?.count : response?.data?.count;
            let rows = data.map((u) => {
                let finalObject: any = prepareDataForGrid(u, user);
                finalObject['isChecked'] = false;
                return finalObject;
            });
            if (appendRows) {
                dispatch({ type: 'initialize', data: [...dataRows, ...rows], count: count });
            } else {
                dispatch({ type: 'initialize', data: rows, count: count });
            }
            setTimeout(() => {
                dispatch({ type: 'loading', loading: false });
            }, gridLoadingTimeout);
        } catch (error) {
            dispatch({ type: 'loading', loading: false });
            toastConfig.setToastConfig(error);
        }
    }

    return (<Box display="flex" flexDirection='column'>
        <Box ml={1}>
            <Autocomplete
                options={resourceList}
                getOptionLabel={(option) => option && option?.title || ''}
                style={{ width: "350px" }}
                value={selectedResource}
                onChange={(event, newValue) => {
                    setSelectedResource(newValue)
                }}
                size="small"
                renderInput={(params) =>
                    <TextField
                        {...params}
                        label="Select Resource"
                        size="small"
                        variant="outlined"
                    />
                }
            />
        </Box>
        {Object.keys(frameWorkComponent).length > 0 && columns?.length ? (
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
                renderedFrom={renderedFrom}
                refreshGrid={fetchData}
                showFilters={true}
                allowSelection={false}
                resource={selectedResource?.resource}
                showOnlyShowFilteredRecordSwitch={false}
            />
        )
            : null}
    </Box>)
}

export default ListView;