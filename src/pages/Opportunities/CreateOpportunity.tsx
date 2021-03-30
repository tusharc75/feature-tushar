import { useEffect, useState, useContext } from 'react';
import { Box, Button, Grid } from '@material-ui/core';
import { makeStyles } from "@material-ui/core/styles";
import { Formik, Form } from "formik";
import { getObjKeys, removeEmptyKeys, getOwnerDropdownDataSource, getCollaboratorDropdownDataSource } from '../../constants/helpers';
import { useHistory } from "react-router-dom";
import { withStyles } from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import MuiDialogContent from '@material-ui/core/DialogContent';
import MuiDialogActions from '@material-ui/core/DialogActions';
import { yupSchema } from '../../constants/helpers'
import FormTypes from "./../../components/Helpers/FormTypes";
import axiosInstance from './../../axios/axiosInstance'
import CommonSkeleton from '../../components/Helpers/CommonSkeleton'
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';

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

export default function CreateOpportunity({ open, onClose, onSuccess }) {
    const toastConfig = useContext(CustomToastContext);
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
        setOwnerDataSource(getOwnerDropdownDataSource(selectedCollaborator, ownerCollaboratorCommonDataSource))
    }

    const onCollaboratorOwnerMultiselectOpen = (selectedOwnerId) => {
        setCollaboratorDataSource(getCollaboratorDropdownDataSource(selectedOwnerId, ownerCollaboratorCommonDataSource))
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

    const handleSave = (values, setTouched, errors, setErrors) => {
        if (Object.keys(errors).length) {
            entityData.fields.forEach((input) => {
                if (input.required || values[input.fieldName]) {
                    setTouched(input.fieldName, true);
                }
            });
            toastConfig.setToastConfig({ open: true, type: "error", message: "Please fill all required fields" });
            setErrors({ ...errors });
        } else {
            setIsFormSubmitted(true);
            values = removeEmptyKeys(values);
            ["amount", "probability"].forEach(k => {
                if (values[k]) {
                    values[k] = parseInt(values[k])
                } else if (values.hasOwnProperty(k)) {
                    delete values[k]
                }
            })
            axiosInstance().post("/opportunity", values)
                .then(({ data }) => {
                    toastConfig.setToastConfig({ open: true, type: "success", message: data.message });
                    setIsFormSubmitted(false)
                    onSuccess()
                }).catch((error) => {
                    toastConfig.setToastConfig(error);
                    setIsFormSubmitted(false);
                });
        }
    }
    return (
        <Dialog
            maxWidth="md"
            aria-labelledby="customized-dialog-title"
            onClose={onClose}
            open={open}
        >
            <CustomDialogHeader title="Create Opportunity" onClose={onClose} />

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
                >
                    {({
                        values,
                        errors,
                        touched,
                        setFieldValue,
                        setFieldTouched,
                        setErrors
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
                                    onClick={() => { handleSave(values, setFieldTouched, errors, setErrors) }}
                                >
                                    Create Opportunity
                                        </Button>
                            </DialogActions>
                        </>
                    )}
                </Formik>
            }
        </Dialog>

    )
}
