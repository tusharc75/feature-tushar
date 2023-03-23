import { Grid, IconButton, TextField } from "@material-ui/core";
import { Autocomplete } from "@material-ui/lab";
import { Fragment, useContext, useEffect, useReducer, useState } from "react";
import axiosInstance from "src/axios/axiosInstance";
import CustomAgGrid, { reducer, intialState } from "src/components/AgGridComponents/CustomAgGrid";
import CustomBreadCrumbs from "src/components/CustomBreadCrumbs";
import CustomContainer from "src/components/CustomContainer";
import routes from "src/components/Helpers/Routes";
import { dateFormat, gridLoadingTimeout, LOG_RESOURCE } from "src/constants/helpers";
import { DateTimeRenderer } from '../../components/AgGridComponents/CustomAgGridCellRenderers';
import { Link } from 'react-router-dom';
import VisibilityIcon from '@material-ui/icons/Visibility';
import HtmlTooltip from "src/components/CustomTooltipTitle";
import ChangesDialog from "./ChangesDialog";
import { useData } from "../../StateProvider/Provider";
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import moment from "moment";

const ResourceLogs = () => {

    const toastConfig = useContext(CustomToastContext);

    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes } = state;
    const {
        state: { user, permissions },
    }: any = useData();
    const [gridApi, setGridApi] = useState(null);
    const [openDialog, setOpenDialog] = useState({ open: false, changes: null })
    const [option, setOption] = useState([]);

    const [selectedResource, setSelectedResource] = useState(null);
    const [selectedOption, setSelectedOption] = useState(null);
    const [resourceOptions, setResourceOptions] = useState([]);

    useEffect(() => {
        const data: any = []
        for (var key in LOG_RESOURCE) {
            if (permissions[key]?.isRead === true) {
                data.push({ optionLabel: routes[key].title, optionValue: LOG_RESOURCE[key], key: key });
            }
        }
        setResourceOptions(data);
        if (data?.length === 1) {
            setSelectedResource(data[0])
        }
    }, []);

    useEffect(() => {
        if (selectedResource) {
            axiosInstance()
                .get(`/sa-formbuilder/lookup?lookupResource=${selectedResource?.optionValue}`)
                .then(({ data: { data } }) => {
                    setOption(data[selectedResource?.optionValue] || [])
                })
                .catch((error) => {
                    toastConfig.setToastConfig(error);
                });
        }
    }, [selectedResource])

    useEffect(() => {
        if (selectedResource) {
            fetchData()
        }
    }, [selectedResource, selectedOption])

    const getQueryString = () => {
        let query = null;
        query = `resource=${selectedResource?.optionValue}`
        if (selectedOption) {
            query = `${query}&referenceId=${selectedOption.optionValue}`
        }
        return query
    }

    const fetchData = async () => {
        dispatch({ type: 'loading', loading: true });
        if (gridApi) {
            gridApi.setRowData([]);
        }
        const queryString = getQueryString()
        axiosInstance().get(`/log?${queryString}`).then(({ data: { data: { data, count } } }) => {
            let rows = data?.map((u) => {
                var changes = [];
                u?.changes?.forEach((e) => {
                    if (e?.fieldLabel) {
                        var oldValue = e?.oldValue;
                        var newValue = e?.newValue;

                        if (e?.type === "date") {
                            if (oldValue && moment(oldValue)?.isValid) {
                                oldValue = moment(oldValue).format(dateFormat)
                            }
                            if (newValue && moment(newValue)?.isValid) {
                                newValue = moment(newValue).format(dateFormat)
                            }
                        }
                        else if (e?.type === "dropDown" && e?.lookup) {
                            oldValue = oldValue?.label;
                            newValue = newValue?.label;
                        }

                        if (oldValue && newValue) {
                            changes.push(`${e.fieldLabel} changed from ${oldValue} to ${newValue}`)
                        }
                        else {
                            changes.push(`${e.fieldLabel} changed to ${newValue}`)
                        }
                    }
                })
                u.changeLogs = changes;
                u.changes = changes?.toString();
                u.key = selectedResource?.key;
                return u;
            });
            dispatch({ type: 'initialize', data: rows, count: count });
            setTimeout(() => { dispatch({ type: 'loading', loading: false }); }, gridLoadingTimeout);
        })
            .catch((error) => {
                toastConfig.setToastConfig(error);
            });
    };

    const ResourceRenderer = (params) => (
        <Fragment>
            <Link className="link text-truncate"
                title={params?.value?.optionLabel} to={`${routes[`${params?.data?.key}Detail`]?.path}/${params?.value?.optionValue}`}>
                {params?.value?.optionLabel}
            </Link>
        </Fragment>
    );

    const UpdatedByRenderer = (params) => (
        <Fragment>
            <Link className="link text-truncate"
                title={params?.value?.optionLabel} to={`${routes.userDetail.path}/${params?.value?.optionValue}`}>
                {params?.value?.optionLabel}
            </Link>
        </Fragment>
    );

    const columns = [
        {
            field: 'resource',
            headerName: 'Resource',
            show: true,
            cellRenderer: 'resourceRenderer',
            filter: false,
            sortable: false,
        },
        {
            field: 'updatedBy',
            headerName: 'Updated By',
            show: true,
            cellRenderer: 'updatedByRenderer',
            filter: false,
            sortable: false,
        },
        {
            field: 'date',
            headerName: 'Updated Date Time',
            show: true,
            cellRenderer: 'dateTimeRenderer',
            filter: false,
            sortable: false,
        },
        {
            field: 'changes',
            headerName: 'Changes',
            show: true,
            cellRenderer: 'commonRenderer',
            filter: false,
            sortable: false
        }
    ];

    const ActionsRenderer = (params) => {
        return <>
            <HtmlTooltip title="View Changes">
                <IconButton
                    onClick={() => setOpenDialog({ open: true, changes: params?.data?.changeLogs })}
                >
                    <VisibilityIcon color="primary" fontSize='small' />
                </IconButton>
            </HtmlTooltip>
        </>
    }

    const frameworkComponents = {
        resourceRenderer: ResourceRenderer,
        updatedByRenderer: UpdatedByRenderer,
        dateTimeRenderer: DateTimeRenderer,
        actionsRenderer: ActionsRenderer
    };

    return (
        <Fragment>
            <Grid container className="headerbox">
                <Grid item md={4} sm={11} xs={10}>
                    <CustomBreadCrumbs routes={[routes.resourceLogs]} />
                </Grid>
            </Grid>
            <CustomContainer>
                <div className="header-panel">
                    <Grid container spacing={2} alignItems="center">
                        <Grid xs={12} sm={6} md={4} lg={4}>
                            <Autocomplete
                                fullWidth
                                options={resourceOptions}
                                getOptionLabel={(option) => option.optionLabel}
                                value={selectedResource}
                                onChange={(event, newValue) => {
                                    setSelectedResource(newValue);
                                }}
                                size="small"
                                renderInput={(params) =>
                                    <TextField {...params} label="Select Resource" variant="outlined" />
                                }
                            />
                        </Grid>
                        {selectedResource &&
                            <Grid item xs={12} sm={6} md={4} lg={4}>
                                <Autocomplete
                                    options={option}
                                    fullWidth
                                    getOptionLabel={(option: any) => option.optionLabel}
                                    getOptionSelected={(option: any, value: any) => option.optionValue === value.optionValue}
                                    value={selectedOption}
                                    onChange={(event, newValue) => {
                                        setSelectedOption(newValue);
                                    }}
                                    size="small"
                                    renderInput={(params) => <TextField
                                        {...params}
                                        label={`Select ${selectedResource?.optionLabel}`}
                                        variant="outlined"
                                    />}
                                />
                            </Grid>
                        }
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
                    allowAction={true}
                    renderedFrom={'resourceLogs'}
                    refreshGrid={fetchData}
                />
            </CustomContainer>
            {openDialog?.open && (
                <ChangesDialog
                    open={openDialog?.open}
                    onClose={() => setOpenDialog({ open: false, changes: null })}
                    changes={openDialog?.changes}
                />
            )}
        </Fragment>
    )
}

export default ResourceLogs;