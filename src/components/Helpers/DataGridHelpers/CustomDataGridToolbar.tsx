import React from 'react'
import {
    GridToolbarContainer,
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
            </GridToolbarContainer>
        </React.Fragment>
    )
}

