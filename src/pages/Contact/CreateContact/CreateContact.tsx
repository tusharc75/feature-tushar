import React, { useEffect, useState } from 'react';
import { CreateNewContact } from '../../../axios/index';
import { Box, Button, IconButton, Typography, Grid } from '@material-ui/core';
import { makeStyles } from "@material-ui/core/styles";
import { Formik, Form } from "formik";
import { getObjKeys, removeEmptyKeys } from '../../../constants/helpers';
import { useHistory } from "react-router-dom";
import CloseIcon from '@material-ui/icons/Close';
import { withStyles } from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import MuiDialogContent from '@material-ui/core/DialogContent';
import MuiDialogActions from '@material-ui/core/DialogActions';
import Loader from '../../../components/Loader'
import { formValidation } from '../../../constants/helpers';
import FormTypes from "./../../../components/Helpers/FormTypes";
import axiosInstance from './../../../axios/axiosInstance'
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton'
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';

const useStyles = makeStyles((theme) => ({
    // root: {
    //     margin: 0,
    //     padding: theme.spacing(2),
    // },
    // closeButton: {
    //     position: 'absolute',
    //     right: theme.spacing(1),
    //     top: theme.spacing(1),
    //     color: theme.palette.grey[500],
    // },
}));

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

const arr = [...Array(9).keys()]
export default function CreateContact({ open, onClose, onSuccess }) {

    const classes = useStyles();
    const history = useHistory();
    const [entityData, setEntityData] = useState({
        fields: [],
        initialValues: {},
    });
    const [isFormSubmitted, setIsFormSubmitted] = useState(false)

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

    useEffect(() => {
        getContactFields();
        // eslint-disable-next-line
    }, []);

    const getContactFields = () => {
        axiosInstance().get('/field?resource=Contact').then(({ data: { data } }) => {

            const newFields = [];
            data.filter(d => d.isCreate).map((_f) => newFields.push(_f.fieldData));

            setEntityData({
                fields: newFields,
                initialValues: getObjKeys("", newFields),
            });
        });
    };

    const handleSave = (values) => {
        setIsFormSubmitted(true);
        removeEmptyKeys(values);

        axiosInstance().post("/contact", values).then(() => {
            onSuccess();
        }).then(() => {
            setIsFormSubmitted(false);
        });
    }


    return (
        <Dialog
            maxWidth="md"
            aria-labelledby="customized-dialog-title"
            onClose={onClose}
            open={open}
        >
            <CustomDialogHeader title="Create Contact" onClose={onClose} />

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
                    validate={(values: any) => formValidation(values, entityData.fields)}
                    onSubmit={() => { }}
                >
                    {({
                        values,
                        errors,
                        touched,
                        setFieldValue,
                    }) => (
                        <>
                            <DialogContent dividers >
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

                            <DialogActions>
                                <Button
                                    type="button"
                                    variant="outlined"
                                    color="primary"
                                    onClick={onClose}
                                >
                                    Cancel
                                        </Button>
                                <Button
                                    disabled={isFormSubmitted}
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    onClick={() => { handleSave(values) }}
                                >
                                    Create Contact
                                        </Button>
                            </DialogActions>
                        </>
                    )}
                </Formik>
            }
        </Dialog>

    )
}
