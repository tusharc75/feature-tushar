import React from 'react'
import { List, ListItem, ListItemText, Typography } from '@material-ui/core';
import { DataGrid } from '@material-ui/data-grid'
import CustomDataGridNoDataFound from '../../components/Helpers/CustomDataGridNoDataFound'
import { useHistory } from 'react-router-dom';
import routes from '../../components/Helpers/Routes';
import { quoteStepColors } from '../../constants/helpers';
import { isMobile } from 'react-device-detect';

export default function VersionStatus({ loadingVersions, versionStatusData }) {

    const history = useHistory();

    return (
        isMobile ? <>
            <List className="p-0">
                {
                    versionStatusData?.data?.map(d => (
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
        </> : <div style={{ maxHeight: 500, width: "100%" }} className="mt-2">
            <DataGrid
                components={{
                    NoRowsOverlay: CustomDataGridNoDataFound,
                }}
                loading={loadingVersions}
                autoHeight
                density="compact"
                rows={loadingVersions ? [] : versionStatusData.data}
                columns={versionStatusData.columns}
                disableSelectionOnClick
                disableMultipleSelection
                disableColumnFilter
                hideFooter
            />
        </div>
    )
}
