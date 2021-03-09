import React, { useEffect, useState } from 'react';
import { Box, Button, IconButton, Typography, Grid } from '@material-ui/core';
import { makeStyles } from "@material-ui/core/styles";
import { Formik, Form } from "formik";
import { getObjKeys, removeEmptyKeys } from '../../constants/helpers';
import { useHistory } from "react-router-dom";
import { CloseIcon } from '@material-ui/data-grid';
import { withStyles } from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import MuiDialogContent from '@material-ui/core/DialogContent';
import MuiDialogActions from '@material-ui/core/DialogActions';
import Loader from '../../components/Loader'
import { formValidation } from '../../constants/helpers';
import FormTypes from "./../../components/Helpers/FormTypes";
import axiosInstance from './../../axios/axiosInstance'
import { CustomEventEmitter } from './../../axios/events';

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

export default function CreateOpportunity({ open, onClose, onSuccess }) {

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
        getOpportunityFields();
        // eslint-disable-next-line
    }, []);

    const getOpportunityFields = () => {
        axiosInstance().get('/field?resource=Opportunity').then(({ data: { data } }) => {

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
        ["amount", "probability"].forEach(k => {
            if (values[k]) {
                values[k] = parseInt(values[k])
            } else if (values.hasOwnProperty(k)) {
                delete values[k]
            }
        })
        axiosInstance().post("/opportunity", values)
            .then(() => {
                CustomEventEmitter.dispatch("show-toast", { type: "success", errorMsg: "Opportunity created Succesfully" });
                setIsFormSubmitted(false)
                onSuccess()
            })
            .then(() => {
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
            <MuiDialogTitle disableTypography className={classes.root}>
                <Typography variant="h6">Create Opportunity</Typography>
                {onClose ? (
                    <IconButton aria-label="close" className={classes.closeButton} onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                ) : null}
            </MuiDialogTitle>

            {
                entityData.fields.length == 0 && <DialogContent dividers style={{ minWidth: '943px', minHeight: '500px' }}>
                    <Loader text="Fetching Data" style={{ marginTop: 100 }} />
                </DialogContent>
            }
            {
                entityData.fields.length > 0 && <Formik
                    initialValues={entityData.initialValues}
                    validate={(values) => formValidation(values, entityData.fields)}
                >
                    {({
                        values,
                        errors,
                        touched,
                        setFieldValue,
                    }) => (
                        <Form>
                            <>

                                <DialogContent dividers style={{ padding: '10px', marginLeft: "15px", marginRight: '15px', minWidth: '943px', minHeight: '500px' }}>

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
                                        Create Opportunity
                                        </Button>
                                </DialogActions>
                            </>
                        </Form>
                    )}

                </Formik>
            }

        </Dialog>

    )
}
