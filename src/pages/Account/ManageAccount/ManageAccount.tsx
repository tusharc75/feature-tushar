import React, { useState, useEffect } from 'react';
import { Box, Button, Grid } from '@material-ui/core';
import { Formik, Form } from "formik";
import { getCollaboratorDropdownDataSource, getOwnerDropdownDataSource, yupSchema } from '../../../constants/helpers';
import CustomButton from '../../../components/Helpers/Button'
import { commonStyle } from '../../Contact/CommonStyles'
import FormTypes from "../../../components/Helpers/FormTypes";
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton'
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter'
import Dialog from '@material-ui/core/Dialog'
import _ from 'lodash'

const arr = [...Array(9).keys()]

export default function ManageAccount(props) {

    const { entityData, handleSubmit, onClose, open, isNew, loading } = props

    //  Owner, Collaborator Code - Start
    const [formsData, setFormsData] = useState([]);
    const [ownerCollaboratorCommonDataSource, setOwnerCollaboratorCommonDataSource] = useState([]);
    const [ownerDataSource, setOwnerDataSource] = useState([]);
    const [collaboratorDataSource, setCollaboratorDataSource] = useState([]);

    // const [loading, setLoading] = useState(false);

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

    const onSubmit = async (setTouched, values, setValues, setErrors, saveAndNew = false, resetForm, errors) => {
        if (Object.keys(errors).length) {
            entityData.fields.forEach((input) => {
                if (input.required) {
                    setTouched(input.fieldName, true);
                }
            });
        } else {
            handleSubmit(values, saveAndNew, setValues)
            setErrors({});
        }

    }

    return (<>
        <Dialog
            disableBackdropClick={true}
            maxWidth="md"
            aria-labelledby="customized-dialog-title"
            onClose={onClose}
            open={open}
        >
            <CustomDialogHeader onClose={onClose} title={isNew ? "Add Account" : `Editing ${entityData.initialValues.accountName}`} />

            {
                entityData.fields.length > 0 ?
                    <>
                        <Formik
                            initialValues={entityData.initialValues}
                            validationSchema={yupSchema(entityData.fields)}
                            validateOnMount
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
                                                                                        multiple
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
                                                onSubmit(setFieldTouched, values, setValues, setErrors, false, resetForm, errors)
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
