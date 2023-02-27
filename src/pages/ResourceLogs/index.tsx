import { Grid, TextField } from "@material-ui/core";
import { Autocomplete } from "@material-ui/lab";
import { capitalize } from "lodash";
import { Fragment, useEffect, useReducer, useState } from "react";
import { isMobile, isTablet } from "react-device-detect";
import axiosInstance from "src/axios/axiosInstance";
import CustomAgGrid, { reducer, intialState } from "src/components/AgGridComponents/CustomAgGrid";
import CustomBreadCrumbs from "src/components/CustomBreadCrumbs";
import CustomContainer from "src/components/CustomContainer";
import ImportExportLinks from "src/components/Helpers/ImportExportLinks";
import routes from "src/components/Helpers/Routes";
import { gridLoadingTimeout, prepareDataForGrid } from "src/constants/helpers";
import { useData } from "src/StateProvider/Provider";
import { DateTimeRenderer } from '../../components/AgGridComponents/CustomAgGridCellRenderers';

const ResourceLogs = () => {

    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes } = state;
    const {
        state: { user }
    }: any = useData();
    const [gridApi, setGridApi] = useState(null);

    const [serializedAsset, setSerializedAsset] = useState(null);
    const [selectedSerializedAsset, setSelectedSerializedAsset] = useState(null);

    useEffect(() => {
        axiosInstance()
            .get('/sa-formbuilder/lookup?lookupResource=Serialized Asset')
            .then(({ data: { data } }) => {
                setSerializedAsset(data['Serialized Asset'])
            })
            .catch((err) => { });
    }, [])

    const getQueryString = () => {
        let query = null;
        const resource = 'Serialized Asset';

        query = `resource=${resource}`

        if (selectedSerializedAsset) {
            query = `${query}&referenceId=${selectedSerializedAsset.optionValue}`
        }

        return query
    }

    const fetchRecords = async () => {
        dispatch({ type: 'loading', loading: true });
        if (gridApi) {
            gridApi.setRowData([]);
        }
        let data;
        const queryString = getQueryString()
        const response = await axiosInstance().get(`/log?${queryString}`);
        data = response?.data?.data?.data;
        let rows = data.map((u) => {
            let finalObject: any = prepareDataForGrid(u, user);
            finalObject.type = capitalize(u.type);
            finalObject.serialNumber = u?.serialNumber?.map((e) => e.serialNumber)?.toString();
            return finalObject;
        });

        dispatch({ type: 'initialize', data: rows, count: response?.data?.data?.count });
        setTimeout(() => {
            dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
    };

    useEffect(() => {
        fetchRecords()
    }, [selectedSerializedAsset])

    const columns = [
        {
            field: 'date',
            headerName: 'Date',
            show: true,
            cellRenderer: 'dateTimeRenderer',
            filter: false,
            sortable: false
        },
    ];

    const frameworkComponents = {
        dateTimeRenderer: DateTimeRenderer
    };

    return (
        <Fragment>
            <Grid container className="headerbox">
                <Grid item md={4} sm={11} xs={10}>
                    <CustomBreadCrumbs routes={[routes.resourceLogs]} />
                </Grid>
                <Grid item md={8} sm={1} xs={2}>
                    {/* <ImportExportLinks
                        permissions={leadsPermissions}
                        module="lead(s)"
                        api={leadApi}
                        afterImportCompleted={() => {
                            fetchLeads();
                        }}
                        isExportAllOrSomeFeature={true}
                        total={rowCount}
                        recordsToExport={selectedRecords.length}
                        ids={selectedRecords.length ? selectedRecords.map((obj) => obj._id) : []}
                        onExportToExcelSuccess={() => {
                            if (gridApi) gridApi.deselectAll();
                            else fetchLeads();
                        }}
                        additionalParams={getQueryString(true)}
                    /> */}
                </Grid>
            </Grid>

            <CustomContainer>
                <div className="header-panel">
                    <Grid container>
                        <Grid item xs={12} sm={6} md={4} lg={4}>
                            <Autocomplete
                                options={serializedAsset}
                                fullWidth
                                // multiple
                                // disableCloseOnSelect
                                getOptionLabel={(option: any) => option.optionLabel}
                                getOptionSelected={(option: any, value: any) => option.optionValue === value.optionValue}
                                value={selectedSerializedAsset}
                                onChange={(event, newValue) => {
                                    setSelectedSerializedAsset(newValue);
                                }}
                                size="small"
                                renderInput={(params) => <TextField {...params} label={`Select Asset`} variant="outlined" />}
                            />
                        </Grid>
                    </Grid>
                </div>

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
                    loading={loading}
                    allowSelection={false}
                    allowAction={false}
                    renderedFrom={'resourceLogs'}
                    refreshGrid={fetchRecords}
                />

            </CustomContainer>
        </Fragment>
    )
}

export default ResourceLogs;