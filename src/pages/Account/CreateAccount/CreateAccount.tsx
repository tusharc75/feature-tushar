import React, { useState, useEffect } from 'react';
import { Box, Button, Grid } from '@material-ui/core';
import { makeStyles } from "@material-ui/core/styles";
import { Formik, Form } from "formik";
import { formValidation, getCollaboratorDropdownDataSource, getOwnerDropdownDataSource } from '../../../constants/helpers';
import CustomButton from '../../../components/Helpers/Button'
import { commonStyle } from '../../Contact/CommonStyles'
import { withStyles } from '@material-ui/core/styles';
import MuiDialogContent from '@material-ui/core/DialogContent';
import FormTypes from "./../../../components/Helpers/FormTypes";
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton'
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter'
import Dialog from '@material-ui/core/Dialog'
import { CustomEventEmitter } from '../../../axios/events'

const useStyles = makeStyles((theme) => ({
    ...commonStyle(theme),
    root: {
        margin: 0,
        padding: theme.spacing(2),
    },
    container: {
        position: "relative",
    }
}));
const DialogContent = withStyles((theme) => ({
    root: {
        padding: theme.spacing(2),
    },
}))(MuiDialogContent);

const arr = [...Array(9).keys()]

export default function CreateAccount(props) {

    const classes = useStyles();
    const { entityData, handleSubmit, loading, onClose, open } = props

    //  Owner, Collaborator Code - Start
    const [formsData, setFormsData] = useState([]);
    const [ownerCollaboratorCommonDataSource, setOwnerCollaboratorCommonDataSource] = useState([]);
    const [ownerDataSource, setOwnerDataSource] = useState([]);
    const [collaboratorDataSource, setCollaboratorDataSource] = useState([]);

    useEffect(() => {
        const ownerCollaboratorDropdownData = entityData.fields.filter(d => ["owner", "collaborator"].indexOf(d.fieldName) !== -1);
        if (ownerCollaboratorDropdownData.length > 0) {
            setOwnerCollaboratorCommonDataSource(ownerCollaboratorDropdownData[0].option);
            setOwnerDataSource(ownerCollaboratorDropdownData[0].option)
            setCollaboratorDataSource(ownerCollaboratorDropdownData[0].option)
        }
        sortArray();
    }, [entityData.fields]);

    const sortArray = () => {
        const sections = [];
        entityData.fields.forEach((field) => {
            if (!sections.includes(field.sectionName)) {
                sections.push(field.sectionName);
            }
        });

        const customData = sections.map((name) => {
            let fields = entityData.fields.filter((field) => field.sectionName === name);

            const sectionFields = fields.map((formData) => formData);
            return { name, sectionFields };
        });

        setFormsData(customData);
    };

    const onOwnerDropdownOpen = (selectedCollaborator) => {
        setOwnerDataSource(getOwnerDropdownDataSource(selectedCollaborator, ownerCollaboratorCommonDataSource))
    }

    const onCollaboratorOwnerMultiselectOpen = (selectedOwnerId) => {
        setCollaboratorDataSource(getCollaboratorDropdownDataSource(selectedOwnerId, ownerCollaboratorCommonDataSource))
    }
    //  Owner, Collaborator Code - End

    return (<>
        <Dialog
            disableBackdropClick={true}
            maxWidth="md"
            aria-labelledby="customized-dialog-title"
            onClose={onClose}
            open={open}
        >
            <CustomDialogHeader onClose={onClose} title="Add Account" />

            {
                entityData.fields.length > 0 ?
                    <>
                        <Formik
                            initialValues={entityData.initialValues}
                            validate={(values) => formValidation(values, entityData.fields)}
                            onSubmit={() => { }}
                        >
                            {({
                                setValues,
                                setErrors,
                                values,
                                errors,
                                touched,
                                setFieldValue,
                                setFieldTouched,
                                validateForm,
                                resetForm
                            }) => (
                                <>
                                    <CustomDialogContent>
                                        <Form autoComplete="off" autoCorrect="off" noValidate>
                                            {
                                                formsData &&
                                                formsData.map((form, i) => (
                                                    <div key={i}>
                                                        <h2 className="form-label-style">{form.name}</h2>
                                                        <Box marginY={2}>
                                                            <Grid spacing={3} container>
                                                                {form.sectionFields.map((field) => (
                                                                    <Grid key={field.fieldName} item xs={12} sm={6} md={6}>
                                                                        {
                                                                            field.fieldName == "owner" ?
                                                                                <FormTypes values={values}
                                                                                    errors={errors}
                                                                                    touched={touched}
                                                                                    label={field.fieldLabel}
                                                                                    name={field.fieldName}
                                                                                    type={field.type}
                                                                                    options={ownerDataSource}
                                                                                    setFieldValue={setFieldValue}
                                                                                    required={field.required}
                                                                                    fullWidth
                                                                                    isTooltip={true}
                                                                                    size="small"
                                                                                    onOpen={() => { onOwnerDropdownOpen(values.collaborator) }}
                                                                                /> : field.fieldName == "collaborator" ?
                                                                                    <FormTypes
                                                                                        values={values}
                                                                                        errors={errors}
                                                                                        touched={touched}
                                                                                        label={field.fieldLabel}
                                                                                        name={field.fieldName}
                                                                                        type={field.type}
                                                                                        options={collaboratorDataSource}
                                                                                        setFieldValue={setFieldValue}
                                                                                        required={field.required}
                                                                                        fullWidth
                                                                                        isTooltip={true}
                                                                                        size="small"
                                                                                        onOpen={() => { onCollaboratorOwnerMultiselectOpen(values.owner) }}
                                                                                    /> : field.fieldName == "isShippingAddressSameAsBillingAddress" ?
                                                                                        <FormTypes
                                                                                            values={values}
                                                                                            errors={errors}
                                                                                            touched={touched}
                                                                                            label={field.fieldLabel}
                                                                                            name={field.fieldName}
                                                                                            type={field.type}
                                                                                            options={collaboratorDataSource}
                                                                                            setFieldValue={setFieldValue}
                                                                                            required={field.required}
                                                                                            fullWidth
                                                                                            isTooltip={true}
                                                                                            size="small"
                                                                                            onChange={(e) => {
                                                                                                setFieldValue(field.fieldName, e.target.checked)
                                                                                                if (e.target.checked && values.billingAddress) {
                                                                                                    setFieldValue("shippingAddress", values.billingAddress)
                                                                                                }
                                                                                            }}
                                                                                        /> : field.fieldName == "billingAddress" ?
                                                                                            <FormTypes
                                                                                                values={values}
                                                                                                errors={errors}
                                                                                                touched={touched}
                                                                                                label={field.fieldLabel}
                                                                                                name={field.fieldName}
                                                                                                type={field.type}
                                                                                                options={field.option}
                                                                                                setFieldValue={setFieldValue}
                                                                                                required={field.required}
                                                                                                fullWidth
                                                                                                isTooltip={true}
                                                                                                size="small"
                                                                                                onChange={(event, newValue) => {
                                                                                                    setFieldValue(field.fieldName, newValue);
                                                                                                    if (values.isShippingAddressSameAsBillingAddress == true) {
                                                                                                        setFieldValue("shippingAddress", newValue)
                                                                                                    }
                                                                                                }}
                                                                                            /> : field.fieldName == "shippingAddress" ?
                                                                                                <FormTypes
                                                                                                    values={values}
                                                                                                    errors={errors}
                                                                                                    touched={touched}
                                                                                                    label={field.fieldLabel}
                                                                                                    name={field.fieldName}
                                                                                                    type={field.type}
                                                                                                    options={field.option}
                                                                                                    setFieldValue={setFieldValue}
                                                                                                    required={field.required}
                                                                                                    fullWidth
                                                                                                    isTooltip={true}
                                                                                                    size="small"
                                                                                                    disabled={values.isShippingAddressSameAsBillingAddress == true}
                                                                                                /> : <FormTypes
                                                                                                    // {...rest}
                                                                                                    values={values}
                                                                                                    errors={errors}
                                                                                                    touched={touched}
                                                                                                    label={field.fieldLabel}
                                                                                                    name={field.fieldName}
                                                                                                    type={field.type}
                                                                                                    options={field.option}
                                                                                                    setFieldValue={setFieldValue}
                                                                                                    required={field.required}
                                                                                                    fullWidth
                                                                                                    isTooltip={true}
                                                                                                    size="small"
                                                                                                />
                                                                        }

                                                                    </Grid>
                                                                ))}
                                                            </Grid>
                                                        </Box>
                                                    </div>
                                                ))
                                            }


                                        </Form>
                                    </CustomDialogContent>
                                    <CustomDialogFooter>
                                        <Button onClick={onClose} variant="outlined" color="primary" >
                                            Cancel
                                             </Button>

                                        <CustomButton
                                            loading={loading}
                                            variant="contained"
                                            color="primary"
                                            disabled={loading || Object.keys(errors).length > 0 ? true : false}
                                            onClick={(e) => {
                                                e.preventDefault()
                                                handleSubmit(setFieldTouched, values, setValues, setErrors, false, resetForm)
                                            }}
                                        >
                                            Save
                                    </CustomButton>
                                    </CustomDialogFooter>
                                </>
                            )}
                        </Formik>
                    </>
                    : <CustomDialogContent>
                        <CommonSkeleton
                            lenArray={arr}
                        />
                    </CustomDialogContent>
            }
        </Dialog>
    </ >

    )
}
