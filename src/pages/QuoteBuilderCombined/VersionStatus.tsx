import React, { useEffect, useReducer, useState } from 'react'
import { List, ListItem, ListItemText, Typography } from '@material-ui/core';
import { DataGrid } from '@material-ui/data-grid'
import CustomDataGridNoDataFound from '../../components/Helpers/CustomDataGridNoDataFound'
import { useHistory } from 'react-router-dom';
import routes from '../../components/Helpers/Routes';
import { quoteStepColors } from '../../constants/helpers';
import { isMobile } from 'react-device-detect';
import CustomAgGrid, { intialState, reducer } from '../../components/AgGridComponents/CustomAgGrid';
import { CommonRenderer, DateRenderer } from '../../components/AgGridComponents/CustomAgGridCellRenderers';
import NoDataCell from '../../components/Helpers/NoDataCell';

export default function VersionStatus({ loadingVersions, versionStatusData }) {

    const history = useHistory();
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
                    history.push(`quotes/detail/${params.data._id}`, {
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
        dateRenderer: DateRenderer
    };

    return (
        isMobile ? <>
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
                actionWidth={100}
                allowAction={false}
                allowSelection={false}
                loading={loading}
                renderedFrom={"quoteResourceVersionStatus"}
                refreshGrid={() => { }}
                isClientSideGrid={true}
            /> : null

    )
}
