import { DataGrid } from '@material-ui/data-grid'
import React from 'react'
import CustomDataGridNoDataFound from './Helpers/CustomDataGridNoDataFound';

export default function ChildHierarchy({ loading, childData }) {
    return (
        <div style={{ maxHeight: 500, width: "100%" }} className="mt-2">
            <DataGrid
                components={{
                    NoRowsOverlay: CustomDataGridNoDataFound,
                }}
                loading={loading}
                autoHeight
                density="compact"
                rows={loading ? [] : childData.data}
                columns={childData.columns}
                disableSelectionOnClick
                disableMultipleSelection
                disableColumnFilter
                hideFooter
            />
        </div>
    )
}
