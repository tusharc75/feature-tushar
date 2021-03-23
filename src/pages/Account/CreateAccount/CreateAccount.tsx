import React, { useState, useEffect } from 'react';
import { Box, Button, Grid } from '@material-ui/core';
import { makeStyles } from "@material-ui/core/styles";
import { Formik, Form } from "formik";
import { formValidation } from '../../../constants/helpers';
import CustomButton from '../../../components/Helpers/Button'
import { commonStyle } from '../../Contact/CommonStyles'
import CustomToast from '../../../components/Helpers/CustomToast'
import { withStyles } from '@material-ui/core/styles';
import MuiDialogContent from '@material-ui/core/DialogContent';
import MuiDialogActions from '@material-ui/core/DialogActions';
import Loader from '../../../components/Loader'
import FormTypes from "./../../../components/Helpers/FormTypes";
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton'
import "../account.module.scss"

const useStyles = makeStyles((theme) => ({
    ...commonStyle(theme)
}));

const DialogContent = withStyles((theme) => ({
    root: {
        padding: theme.spacing(2),
    },
}))(MuiDialogContent);

const arr = [...Array(9).keys()]
const DialogActions = withStyles((theme) => ({
    root: {
        margin: 0,
        padding: theme.spacing(1),
    },
}))(MuiDialogActions);


export default function CreateAccount(props) {

    const classes = useStyles();
    const { entityData, alertData, handleSnackbar, handleSubmit, loading, onClose } = props

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
        // eslint-disable-next-line
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
        if (!selectedCollaborator || selectedCollaborator.length == 0) {
            setOwnerDataSource(ownerCollaboratorCommonDataSource);
        } else {
            const ownerDataSource = [];

            ownerCollaboratorCommonDataSource.map(d => {
                const isCollaboratorSelected = selectedCollaborator.find(collaborator => collaborator.optionValue == d.optionValue);
                if (!isCollaboratorSelected) {
                    ownerDataSource.push(d);
                }
            })
            setOwnerDataSource(ownerDataSource);
        }
    }

    const onCollaboratorOwnerMultiselectOpen = (selectedOwner) => {
        if (selectedOwner) {
            setCollaboratorDataSource(ownerCollaboratorCommonDataSource.filter(d => d.optionValue != selectedOwner.optionValue));
        } else {
            setCollaboratorDataSource(ownerCollaboratorCommonDataSource);
        }
    }
    //  Owner, Collaborator Code - End

    return (<>
        {
            alertData ? <CustomToast
                open={alertData.open || false}
                close={() => handleSnackbar('', '', false)}
                errorMsg={alertData.errorMsg || ''}
                type={alertData.type || ''}
            /> : null
        }
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
                            <Form>
                                <>
                                    <DialogContent dividers style={{ padding: '10px', marginLeft: "15px", marginRight: '15px' }}>
                                        {
                                            formsData &&
                                            formsData.map((form, i) => (
                                                <div key={i}>
                                                    <h2>{form.name}</h2>
                                                    <Box marginY={2}>
                                                        <Grid spacing={2} container>
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
                                        {/* <InputField
                                            errors={errors}
                                            values={values}
                                            setFieldValue={setFieldValue}
                                            touched={touched}
                                            fieldsData={entityData.fields}
                                            size="small"
                                            fullWidth
                                            isTooltip={true}
                                        /> */}
                                    </DialogContent>
                                </>
                                <DialogActions>
                                    <Button onClick={onClose} variant="outlined" color="primary" >
                                        Cancel
                                             </Button>

                                    <CustomButton
                                        loading={loading}
                                        style={{ float: "right" }}
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
                                </DialogActions>
                            </Form>
                        )}
                    </Formik>
                </>
                : <DialogContent dividers style={{ minWidth: '943px', minHeight: '500px' }}>
                    <CommonSkeleton
                        lenArray={arr}
                    />
                </DialogContent>
        }
    </ >
    )
}
