import { Grid, IconButton, TextField } from "@material-ui/core";
import { Autocomplete } from "@material-ui/lab";
import { Fragment, useEffect, useReducer, useState } from "react";
import axiosInstance from "src/axios/axiosInstance";
import CustomAgGrid, { reducer, intialState } from "src/components/AgGridComponents/CustomAgGrid";
import CustomBreadCrumbs from "src/components/CustomBreadCrumbs";
import CustomContainer from "src/components/CustomContainer";
import routes from "src/components/Helpers/Routes";
import { gridLoadingTimeout, prepareDataForGrid } from "src/constants/helpers";
import { useData } from "src/StateProvider/Provider";
import { DateTimeRenderer } from '../../components/AgGridComponents/CustomAgGridCellRenderers';
import { Link } from 'react-router-dom';
import VisibilityIcon from '@material-ui/icons/Visibility';
import HtmlTooltip from "src/components/CustomTooltipTitle";
import ChangesDialog from "./ChangesDialog";

const ResourceLogs = () => {

    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes } = state;
    const {
        state: { user }
    }: any = useData();
    const [gridApi, setGridApi] = useState(null);
    const [openDialog, setOpenDialog] = useState({open:false, changes:null})
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
            var changes = [];
            u?.changes?.forEach((e) => {
                if (e?.fieldLabel) {
                    if (e?.oldValue && e?.newValue) {
                        changes.push(`${e.fieldLabel} changed from ${e?.oldValue} to ${e?.newValue}`)
                    }
                    else {
                        changes.push(`${e.fieldLabel} changed to ${e?.newValue}`)
                    }
                }
            })
            u.changes = changes?.toString();
            return u;
        });
        dispatch({ type: 'initialize', data: rows, count: response?.data?.data?.count });
        setTimeout(() => {
            dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
    };

    useEffect(() => {
        fetchRecords()
    }, [selectedSerializedAsset])


    const AssetNumberRenderer = (params) => (
        <Fragment>
            <Link className="link text-truncate"
                title={params?.value?.optionLabel} to={`${routes.serializedAssetDetail.path}/${params?.value?.optionValue}`}>
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
            headerName: 'Asset Number',
            show: true,
            cellRenderer: 'assetNumberRenderer',
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
        },
        {
            field: 'action',
            headerName: 'Action',
            width: 170,
            cellRenderer: 'actionRenderer'
          }
    ];

    const ActionRenderer = (params) => {
        return <>
        <HtmlTooltip title="View Changes">
          <IconButton 
          onClick={()=>setOpenDialog({open: true, changes:params?.data?.changes})}
          >
          <VisibilityIcon color="primary" fontSize='small' />
          </IconButton>
        </HtmlTooltip>
      </>
    }

    const frameworkComponents = {
        assetNumberRenderer: AssetNumberRenderer,
        updatedByRenderer: UpdatedByRenderer,
        dateTimeRenderer: DateTimeRenderer,
        actionRenderer: ActionRenderer
    };

    return (
        <Fragment>
            <Grid container className="headerbox">
                <Grid item md={4} sm={11} xs={10}>
                    <CustomBreadCrumbs routes={[routes.resourceLogs]} />
                </Grid>
                <Grid item md={8} sm={1} xs={2}>
                </Grid>
            </Grid>
            <CustomContainer>
                <div className="header-panel">
                    <Grid container>
                        <Grid item xs={12} sm={6} md={4} lg={4}>
                            <Autocomplete
                                options={serializedAsset}
                                fullWidth
                                getOptionLabel={(option: any) => option.optionLabel}
                                getOptionSelected={(option: any, value: any) => option.optionValue === value.optionValue}
                                value={selectedSerializedAsset}
                                onChange={(event, newValue) => {
                                    setSelectedSerializedAsset(newValue);
                                }}
                                size="small"
                                renderInput={(params) => <TextField
                                    {...params}
                                    label={`Select ${routes.serializedAsset.title}`}
                                    variant="outlined"
                                />}
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
            {openDialog?.open && (
        <ChangesDialog  
        open={openDialog?.open}
        onClose={()=>setOpenDialog({open:false, changes:null})}
        changes={openDialog?.changes}
        />
      )}
        </Fragment>
    )
}

export default ResourceLogs;