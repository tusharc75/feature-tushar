import React from 'react'
<<<<<<< HEAD
// import {
//     GridToolbarContainer,
//     GridToolbarExport,
//     GridColumnsToolbarButton,
//     GridDensitySelector,
//     GridFilterToolbarButton
// } from '@material-ui/data-grid';

export default function CustomDataGridToolbar() {
    return (
        <></>
        // <React.Fragment>
        //     <GridToolbarContainer>
        //         <GridColumnsToolbarButton />
        //         <GridFilterToolbarButton />
        //         <GridDensitySelector />
        //         {/* <GridToolbarExport /> */}
        //     </GridToolbarContainer>
        // </React.Fragment>
=======
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
>>>>>>> af508d50be8953b2408b8ca30be7aaa0b27b5b35
    )
}

