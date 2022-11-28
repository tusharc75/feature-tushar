import React, { useEffect, useReducer, useState } from 'react'
import { IconButton, List, ListItem, ListItemText, Tooltip, Typography } from '@material-ui/core';
import { DataGrid } from '@material-ui/data-grid'
import CustomDataGridNoDataFound from '../../components/Helpers/CustomDataGridNoDataFound'
import { useHistory } from 'react-router-dom';
import routes from '../../components/Helpers/Routes';
import { quoteBuilder, quoteStepColors } from '../../constants/helpers';
import { isMobile } from 'react-device-detect';
import CustomAgGrid, { intialState, reducer } from '../../components/AgGridComponents/CustomAgGrid';
import { CommonRenderer, DateRenderer } from '../../components/AgGridComponents/CustomAgGridCellRenderers';
import NoDataCell from '../../components/Helpers/NoDataCell';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import ManageQuoteDialog from './ManageQuote/ManageQuoteDialog';
import { useData } from '../../StateProvider/Provider';

export default function VersionStatus({ versionStatusData, handleCloneQuoteWithVersionFromAllVersion }) {

    const history = useHistory();
    const {
        state: { permissions }
    }: any = useData();
    //  Grid Variables - Start
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const {
        dataRows,
        rowCount,
        loading,
        page,
        limit,
        pageSizes,
    } = state;

    useEffect(() => {

        dispatch({
            type: "initialize", data: versionStatusData,
            count: versionStatusData?.length
        });
    }, [])

    const NameRenderer = (params) =>
        params.value ? (
            <span
                title={params.value}
                className="text-truncate link"
                onClick={() => {
                    history.push(`quotes/detail/${params.data.quoteId}`, {
                        versionNumber: `${params.data.versionNumber}`,
                        tabValue: 1
                    })
                }}
            >
                {params.value}
            </span>
        ) : (
            <NoDataCell />
        );


    const ActionsRenderer = params => <>

        {permissions[quoteBuilder.qbResource]?.isCreate ?

            <Tooltip title="Clone quote with versions">
                <IconButton
                    size="small"
                    aria-label="clone version"
                    onClick={() => {
                        handleCloneQuoteWithVersionFromAllVersion(params.data.quoteId, params.data.versionNumber)
                    }}
                >
                    <FileCopyIcon fontSize="small" color="primary" />
                </IconButton>
            </Tooltip>
            :
            <Tooltip className="cursor-stop" title={`You don't have permission to clone`}>
                <IconButton size="small" aria-label="clone version">
                    <FileCopyIcon fontSize="small" color="primary" />
                </IconButton>
            </Tooltip>
        }
    </>

    const columns = [
        { field: 'versionNumber', headerName: 'Version #', show: true, cellRenderer: 'commonRenderer' },
        { field: 'status', headerName: 'Status', show: true, cellRenderer: 'nameRenderer' },
        { field: 'comment', headerName: 'Comment', show: true, cellRenderer: 'commonRenderer' },
        { field: 'processStatus', headerName: 'Current Step', show: true, cellRenderer: 'commonRenderer' },
        { field: 'totalCost', headerName: 'Total Cost', show: true, cellRenderer: 'commonRenderer' },
        { field: 'totalSalesPrice', headerName: 'Total Sales Price', show: true, cellRenderer: 'commonRenderer' },
    ]

    const frameworkComponents = {
        nameRenderer: NameRenderer,
        commonRenderer: CommonRenderer,
        dateRenderer: DateRenderer,
        actionsRenderer: ActionsRenderer
    };

    return (
        <>
            {isMobile ? <>
                <List className="p-0">
                    {
                        versionStatusData?.map(d => (
                            <ListItem alignItems="flex-start" key={d.versionNumber} className="mb-2 border border-radius-2" button
                                style={{
                                    backgroundColor: quoteStepColors[d.status?.toLowerCase()]?.backgroundColor ?? quoteStepColors["__default__"].backgroundColor,
                                    border: `1px solid ${quoteStepColors[d.status?.toLowerCase()]?.backgroundColor ?? quoteStepColors["__default__"].backgroundColor}`,
                                    color: quoteStepColors[d.status?.toLowerCase()]?.color ?? quoteStepColors["__default__"].color
                                }}
                                onClick={() => {
                                    history.push(`${routes.quoteBuilderDetail.path}/${d._id}`, {
                                        versionNumber: `${d.versionNumber}`,
                                        tabValue: 1
                                    })
                                }}
                            >
                                <ListItemText
                                    primary={
                                        <React.Fragment>
                                            <Typography
                                                component="span"
                                                variant="body2"
                                                style={{ color: quoteStepColors[d.status?.toLowerCase()]?.color ?? "#fff" }}
                                            >
                                                Version # {d.versionNumber}
                                            </Typography>
                                            {` - ${d.status}`}
                                        </React.Fragment>
                                    }
                                    secondary={
                                        <React.Fragment>
                                            <Typography
                                                component="span"
                                                variant="body2"
                                                style={{ color: quoteStepColors[d.status?.toLowerCase()]?.color ?? "#fff" }}
                                            >
                                                Current Step - {d.processStatus}
                                            </Typography>
                                        </React.Fragment>
                                    }
                                />
                            </ListItem>
                        ))
                    }

                    {/* <Divider variant="inset" component="li" /> */}
                </List>
            </> : Object.keys(frameworkComponents).length > 0 ?
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
                    allowSelection={false}
                    loading={loading}
                    renderedFrom={"quoteResourceVersionStatus"}
                    isClientSideGrid={true}
                /> : null
            }
        </>
    )
}
