
import React, { useState, useEffect, useContext } from 'react';
import { Box, Button, Grid, IconButton, TextField, Tooltip, Typography } from '@material-ui/core';
import { Formik, Form } from "formik";
import { getCollaboratorDropdownDataSource, getOwnerDropdownDataSource, yupSchema } from '../../../constants/helpers';
import CustomButton from '../../../components/Helpers/Button'
import FormTypes from "../../../components/Helpers/FormTypes";
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton'
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter'
import Dialog from '@material-ui/core/Dialog'
import _ from 'lodash'
import { useData } from '../../../StateProvider/Provider';
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import AddIcon from '@material-ui/icons/AddCircle'
import InfoIcon from "@material-ui/icons/Info";
import { makeStyles } from "@material-ui/core/styles";

const arr = [...Array(9).keys()]

const useStyles = makeStyles((theme) => ({
    createAccountTooltip: {
        marginBottom: "6px"
    }
}));
export default function ManageContact(props) {

    const { entityData, handleSubmit, onClose, open, isNew, loading, onCreateAccount, accountSource } = props
    const classes = useStyles();
    const toastConfig = useContext(CustomToastContext);
    const { state: { user } }: any = useData();
    const [disableOwnerSelection] = useState(!isNew && user.user._id !== entityData.initialValues.owner);

    //  Owner, Collaborator Code - Start
    const [formsData, setFormsData] = useState([]);
    const [ownerCollaboratorCommonDataSource, setOwnerCollaboratorCommonDataSource] = useState([]);
    const [ownerDataSource, setOwnerDataSource] = useState([]);
    const [collaboratorDataSource, setCollaboratorDataSource] = useState([]);


    useEffect(() => {
        if (entityData.fields.length > 0) {
            const ownerCollaboratorDropdownData = entityData.fields.filter(d => ["owner", "collaborator"].indexOf(d.fieldName) !== -1);
            if (ownerCollaboratorDropdownData.length > 0) {
                setOwnerCollaboratorCommonDataSource(ownerCollaboratorDropdownData[0].option);
                setOwnerDataSource(ownerCollaboratorDropdownData[0].option)
                setCollaboratorDataSource(ownerCollaboratorDropdownData[0].option)
            }
            sortArray();
        }
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
                if (input.required || values[input.fieldName]) {
                    setTouched(input.fieldName, true);
                }
            });
        } else {
            handleSubmit(values, saveAndNew, setValues)
            setErrors({});
        }

    }
    // let customAccountSource = [...accountSource,
    // { isCreateNew: true, optionValue: "", optionLabel: "", default: false }
    // ]
    return (<>
        <Dialog
            disableBackdropClick={true}
            maxWidth="md"
            aria-labelledby="customized-dialog-title"
            onClose={onClose}
            open={open}
        >
            <CustomDialogHeader onClose={onClose} title={isNew ? "Add Contact" : `Editing ${entityData.initialValues.firstName}`} />

            {
                entityData.fields.length > 0 ?
                    <>
                        <Formik
                            initialValues={entityData.initialValues}
                            validationSchema={yupSchema(entityData.fields)}
                            // validate={(values) => formValidation(values, entityData.fields)}
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
                                                                                    disabled={disableOwnerSelection}
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
                                                                                    /> : field.fieldName == "accountName" ?
                                                                                        <Grid container spacing={1} alignItems="center">
                                                                                            <Grid item xs={10} sm={10} md={10} >
                                                                                                <FormTypes
                                                                                                    values={values}
                                                                                                    errors={errors}
                                                                                                    touched={touched}
                                                                                                    label={field.fieldLabel}
                                                                                                    name={field.fieldName}
                                                                                                    type={field.type}
                                                                                                    options={accountSource}
                                                                                                    setFieldValue={setFieldValue}
                                                                                                    required={field.required}
                                                                                                    fullWidth
                                                                                                    isTooltip={false}
                                                                                                    size="small"
                                                                                                    doNotShowInfoTooltip={true}
                                                                                                />
                                                                                            </Grid>
                                                                                            <Grid item xs={1} sm={1} md={1}>
                                                                                                <Tooltip title="Create Account" className={classes.createAccountTooltip} >
                                                                                                    <IconButton onClick={onCreateAccount} size="small">
                                                                                                        <AddIcon color="primary" />
                                                                                                    </IconButton>
                                                                                                </Tooltip>
                                                                                            </Grid>
                                                                                            <Grid item xs={1} sm={1} md={1}>
                                                                                                <Tooltip title={field?.tooltipMessage ?? ""}>
                                                                                                    <InfoIcon color="disabled" />
                                                                                                </Tooltip>
                                                                                            </Grid>
                                                                                        </Grid>
                                                                                        : <FormTypes
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
