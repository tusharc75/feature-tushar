import { useEffect, useState, useContext } from 'react';
import { Box, Button, Grid } from '@material-ui/core';
import { makeStyles } from "@material-ui/core/styles";
import { Formik, Form } from "formik";
import { getObjKeys,formValidation, removeEmptyKeys, getOwnerDropdownDataSource, getCollaboratorDropdownDataSource } from '../../../constants/helpers';
import { useHistory } from "react-router-dom";
import { withStyles } from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import MuiDialogContent from '@material-ui/core/DialogContent';
import MuiDialogActions from '@material-ui/core/DialogActions';
import { yupSchema } from '../../../constants/helpers'
import FormTypes from "./../../../components/Helpers/FormTypes";
import axiosInstance from './../../../axios/axiosInstance'
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton'
import CustomButton from '../../../components/Helpers/Button'
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter'

import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import _ from 'lodash'
const useStyles = makeStyles((theme) => ({
    root: {
        margin: 0,
        padding: theme.spacing(2),
    },
    closeButton: {
        position: 'absolute',
        right: theme.spacing(1),
        top: theme.spacing(1),
        color: theme.palette.grey[500],
    },
}));
const arr = [...Array(10).keys()]
const DialogContent = withStyles((theme) => ({
    root: {
        padding: theme.spacing(2),
    },
}))(MuiDialogContent);

const DialogActions = withStyles((theme) => ({
    root: {
        margin: 0,
        padding: theme.spacing(1),
    },
}))(MuiDialogActions);

export default function ManageOpportunity({ open,isNew,onClose,entityData,handleSubmit}) {
    const toastConfig = useContext(CustomToastContext);
    const classes = useStyles();
    const history = useHistory();
    

    //  Owner, Collaborator Code - Start
    const [formsData, setFormsData] = useState([]);
    const [ownerCollaboratorCommonDataSource, setOwnerCollaboratorCommonDataSource] = useState([]);
    const [ownerDataSource, setOwnerDataSource] = useState([]);
    const [collaboratorDataSource, setCollaboratorDataSource] = useState([]);
    const [loading, setLoading] = useState(false);

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
        setOwnerDataSource(getOwnerDropdownDataSource(selectedCollaborator, ownerCollaboratorCommonDataSource))
    }

    const onCollaboratorOwnerMultiselectOpen = (selectedOwnerId) => {
        setCollaboratorDataSource(getCollaboratorDropdownDataSource(selectedOwnerId, ownerCollaboratorCommonDataSource))
    }
    //  Owner, Collaborator Code - End

   
    const onSubmit = async (setTouched, values, setValues, setErrors, saveAndNew = false, resetForm) => {
        const errors = formValidation(values, _.cloneDeep(entityData.fields));
        if (Object.keys(errors).length) {
            entityData.fields.forEach((input) => {
                if (input.required) {
                    setTouched(input.fieldName, true);
                }
            });
        } else {
            setLoading(true)
            handleSubmit(values, saveAndNew, setValues)
            setErrors({});
        }

    }
    return (
        <Dialog
            maxWidth="md"
            aria-labelledby="customized-dialog-title"
            onClose={onClose}
            open={open}
        >
            <CustomDialogHeader onClose={onClose} title={isNew ? "Create Opportunity" : `Editing ${entityData.initialValues.opportunityName}`} />

            {
                entityData.fields.length == 0 && <DialogContent dividers style={{ minWidth: '943px', minHeight: '500px' }}>
                    <CommonSkeleton
                        lenArray={arr}
                    />
                </DialogContent>
            }
            {
                entityData.fields.length > 0 && <Formik
                    initialValues={entityData.initialValues}
                    validationSchema={yupSchema(entityData.fields)}
                    validateOnMount
                    onSubmit={() => { }}
                    // validate={(values) => formValidation(values, entityData.fields)}
                >
                    {({
                        values,
                        setValues,
                        errors,
                        touched,
                        setFieldValue,
                        setFieldTouched,
                        setErrors,
                        resetForm
                    }) => (

                        <>
                            <DialogContent dividers>
                                <Form>
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
                                                                            onOpen={() => { onOwnerDropdownOpen(values["collaborator"]) }}
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
                                                                                onOpen={() => { onCollaboratorOwnerMultiselectOpen(values["owner"]) }}
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
                                    /> */}
                                </Form>
                            </DialogContent>

                            

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
                                                onSubmit(setFieldTouched, values, setValues, setErrors, false, resetForm)
                                            }}
                                        >
                                            Save
                                        </CustomButton>
                                    </CustomDialogFooter>
                        </>
                    )}
                </Formik>
            }
        </Dialog>

    )
}
