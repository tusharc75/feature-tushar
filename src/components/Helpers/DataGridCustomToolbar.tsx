import React from 'react'
import {
    GridToolbarContainer,
    GridToolbarExport,
    GridColumnsToolbarButton,
    GridDensitySelector,
    GridFilterToolbarButton
} from '@material-ui/data-grid';

export default function DataGridCustomToolbar() {
    return (
        <React.Fragment>
            <GridToolbarContainer>
                <GridColumnsToolbarButton />
                <GridFilterToolbarButton />
                <GridDensitySelector />
                {/* <GridToolbarExport /> */}
            </GridToolbarContainer>
        </React.Fragment>
    )
}

