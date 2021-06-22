import { DataGrid } from '@material-ui/data-grid'
import React from 'react'
import CustomDataGridNoDataFound from '../../components/Helpers/CustomDataGridNoDataFound'

export default function VersionStatus({ loadingVersions, versionStatusData }) {
    return (
        <div style={{ maxHeight: 500, width: "100%" }} className="mt-2">
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
