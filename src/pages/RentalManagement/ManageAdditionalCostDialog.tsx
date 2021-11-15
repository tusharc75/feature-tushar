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
import { object, string, number } from "yup";

const AdditionalCostSchema = object().shape({
    type: string().required("Please select cost type"),
    description: string().required("Please add description"),
    qty: number().min(1, "Please add quantity").required("Please add quantity"),
    uom: string().required("Please add UOM").nullable(),
    amount: number().min(1, "Please add amount").required("Please add amount"),
});

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
                    validationSchema={AdditionalCostSchema}
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
                                                        required={true}
                                                        margin="dense"
                                                        error={touched["type"] && Boolean(errors["type"])}
                                                        helperText={touched["type"] && errors["type"]}
                                                    />}
                                                />
                                            </Grid>

                                            <Grid item xs={12} sm={12} md={6}>
                                                <TextField
                                                    variant="outlined"
                                                    type="text"
                                                    label="Description"
                                                    required={true}
                                                    name="description"
                                                    fullWidth
                                                    margin="dense"
                                                    value={values.description}
                                                    error={touched["description"] && Boolean(errors["description"])}
                                                    helperText={touched["description"] && errors["description"]}
                                                    onChange={(e) => {
                                                        setFieldValue(
                                                            "description",
                                                            e.target.value
                                                        );
                                                    }}
                                                />
                                            </Grid>


                                            <Grid item xs={12} sm={12} md={6}>
                                                <TextField
                                                    variant="outlined"
                                                    type="number"
                                                    label="Quantity"
                                                    required={true}
                                                    name="quantity"
                                                    fullWidth
                                                    margin="dense"
                                                    value={values.qty}
                                                    error={touched["qty"] && Boolean(errors["qty"])}
                                                    helperText={touched["qty"] && errors["qty"]}
                                                    onChange={(e) => {
                                                        setFieldValue(
                                                            "qty",
                                                            e.target.value.replace(/[^0-9]/g, '')
                                                        );
                                                    }}
                                                />
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
                                                        margin="dense"
                                                        error={touched["uom"] && Boolean(errors["uom"])}
                                                        helperText={touched["uom"] && errors["uom"]}
                                                    />}
                                                />
                                            </Grid>


                                            <Grid item xs={12} sm={12} md={6}>
                                                <TextField
                                                    variant="outlined"
                                                    id="amount"
                                                    type="number"
                                                    label="Amount"
                                                    required={true}
                                                    name="amount"
                                                    fullWidth
                                                    margin="dense"
                                                    value={values.amount}
                                                    error={touched["amount"] && Boolean(errors["amount"])}
                                                    helperText={touched["amount"] && errors["amount"]}
                                                    onChange={(e) => {
                                                        setFieldValue(
                                                            "amount",
                                                            e.target.value.replace(/[^0-9]/g, '')
                                                        );
                                                    }}
                                                    InputProps={{
                                                        startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment>
                                                    }}
                                                />

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
