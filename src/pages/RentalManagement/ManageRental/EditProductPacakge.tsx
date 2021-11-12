import React from 'react'
import { Dialog, Grid, TextField, FormControl, InputLabel, Select } from '@material-ui/core'

import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader'
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent'
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter'



const EditProductPacakge = () => {
    return (
        <Dialog open onClose={() => { }} maxWidth="md" fullWidth>
            <CustomDialogHeader title="Edit Product/Package" onClose={() => { }} />
            <CustomDialogContent>
                <Grid></Grid>
            </CustomDialogContent>
            <CustomDialogFooter>

            </CustomDialogFooter>
        </Dialog>
    )
}

export default EditProductPacakge
