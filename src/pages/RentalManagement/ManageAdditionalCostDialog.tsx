import { Box, Button, ButtonGroup, Container, Dialog, FormControl, Grid, IconButton, InputAdornment, InputLabel, OutlinedInput, TextField } from '@material-ui/core'
import { Add, Delete } from '@material-ui/icons'
import { Autocomplete } from '@material-ui/lab'
import { Formik, Form, FieldArray, Field } from 'formik'
import React, { useState } from 'react'
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent'
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader'
import { isMobile, isTablet } from "react-device-detect";
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter'
import CustomButton from '../../components/Helpers/CustomButton'
import { CustomDialogTransition } from '../../constants/helpers'
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog'

export default function ManageAdditionalCostDialog({ open, currencySymbol, isNew, record, costTypeList, uomTypeList, onClose, onSubmit }) {

    const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)

    return (
        <>
            <Dialog
                fullWidth
                maxWidth="md"
                fullScreen={fullScreen || (isMobile || isTablet)}
                TransitionComponent={CustomDialogTransition}
                aria-labelledby="customized-dialog-title"
                onClose={(e, reason) => {
                    if (reason !== 'backdropClick') {
                        setShowConfirmDialog(true)
                    }
                }}
                open={open}
            >
                <CustomDialogHeader
                    title={`${isNew ? "Add Additional Cost" : "Update Additional Cost"}`}
                    isMinimized={!fullScreen}
                    onMinimizeMaximize={() => {
                        setFullScreen(prevState => !prevState)
                    }}
                    showManimizeMaximize={true}
                    onClose={onClose}
                />

                <Formik
                    initialValues={record}
                    enableReinitialize={true}
                    onSubmit={onSubmit}
                >
                    {({
                        submitForm,
                        values,
                        errors,
                        touched,
                        setFieldValue
                    }) => (
                        <>
                            <CustomDialogContent>
                                <Form>
                                    <Container className="p-0">
                                        <Grid
                                            container
                                            spacing={2}
                                        >
                                            <Grid item xs={12} sm={12} md={6}>
                                                <Autocomplete
                                                    size="small"
                                                    style={{ minWidth: 200 }}
                                                    value={values.type}
                                                    options={costTypeList}
                                                    getOptionLabel={(option: any) => option ? option : ""}
                                                    onChange={(_, newValue) => {
                                                        setFieldValue(
                                                            "type",
                                                            newValue
                                                        );
                                                    }}

                                                    renderInput={(params) => <TextField
                                                        {...params}
                                                        variant="outlined"
                                                        name="nameField"
                                                        label="Cost Type"
                                                    />}
                                                />
                                            </Grid>

                                            <Grid item xs={12} sm={12} md={6}>
                                                <FormControl fullWidth variant="outlined" size="small">
                                                    <InputLabel htmlFor="description">Description</InputLabel>
                                                    <OutlinedInput
                                                        id="description"
                                                        type="text"
                                                        name="description"
                                                        value={values.description}
                                                        onChange={(e) => {
                                                            setFieldValue(
                                                                "description",
                                                                e.target.value
                                                            );
                                                        }}
                                                    />
                                                </FormControl>
                                            </Grid>


                                            <Grid item xs={12} sm={12} md={6}>
                                                <FormControl fullWidth variant="outlined" size="small">
                                                    <InputLabel htmlFor="quantity">Quantity</InputLabel>
                                                    <OutlinedInput
                                                        id="quantity"
                                                        type="text"
                                                        // size="small"
                                                        name="quantity"
                                                        value={values.qty}
                                                        onChange={(e) => {
                                                            setFieldValue(
                                                                "qty",
                                                                e.target.value.replace(/[^0-9]/g, '')
                                                            );
                                                        }}
                                                    />
                                                </FormControl>
                                            </Grid>

                                            <Grid item xs={12} sm={12} md={6}>
                                                <Autocomplete
                                                    size="small"
                                                    style={{ minWidth: 200 }}
                                                    value={values.uom}
                                                    freeSolo
                                                    autoSelect
                                                    options={uomTypeList}
                                                    getOptionLabel={(option: any) => option ? option : ""}
                                                    onChange={(_, newValue) => {
                                                        setFieldValue(
                                                            "uom",
                                                            newValue
                                                        );
                                                    }}

                                                    renderInput={(params) => <TextField
                                                        {...params}
                                                        variant="outlined"
                                                        name="nameField"
                                                        label="UOM"
                                                    />}
                                                />
                                            </Grid>


                                            <Grid item xs={12} sm={12} md={6}>
                                                <FormControl fullWidth variant="outlined" size="small">
                                                    <InputLabel htmlFor="amount">Amount</InputLabel>
                                                    <OutlinedInput
                                                        id="amount"
                                                        startAdornment={currencySymbol ? <InputAdornment position="start">{currencySymbol}</InputAdornment> : ""}
                                                        type="text"
                                                        name="amount"
                                                        value={values.amount}
                                                        onChange={(e) => {
                                                            setFieldValue(
                                                                "amount",
                                                                e.target.value.replace(/[^0-9]/g, '')
                                                            );
                                                        }}
                                                    />
                                                </FormControl>
                                            </Grid>

                                        </Grid>
                                    </Container>
                                </Form>
                            </CustomDialogContent>

                            <CustomDialogFooter>
                                <Button
                                    onClick={onClose}
                                    variant="outlined"
                                    color="primary"
                                    size="small"
                                >
                                    Cancel
                                </Button>
                                <CustomButton
                                    variant="contained"
                                    color="primary"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        submitForm();
                                    }}
                                >
                                    Save
                                </CustomButton>
                            </CustomDialogFooter>

                        </>
                    )}
                </Formik>
            </Dialog>

            {
                showConfirmDialog ?
                    <ConfirmCancelDialog
                        open={showConfirmDialog}
                        onSave={() => {

                        }}
                        onClose={() => {
                            setShowConfirmDialog(false)
                            onClose({})
                        }}
                    /> : null
            }
        </>
    )
}
