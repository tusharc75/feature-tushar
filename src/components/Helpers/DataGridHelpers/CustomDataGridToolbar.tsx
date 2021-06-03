import React from 'react'
import {
    GridToolbarContainer,
    GridToolbarExport,
    GridToolbarColumnsButton,
    GridToolbarDensitySelector,
    GridToolbarFilterButton
} from '@material-ui/data-grid';

export default function CustomDataGridToolbar() {
    return (
        <React.Fragment>
            <GridToolbarContainer>
                <GridToolbarColumnsButton />
                <GridToolbarFilterButton />
                <GridToolbarDensitySelector />
                {/* <GridToolbarExport /> */}
            </GridToolbarContainer>
        </React.Fragment>
    )
}

