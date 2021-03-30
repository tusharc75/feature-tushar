import { useEffect, useState, useContext } from 'react';
import { Box, Button, Grid } from '@material-ui/core';
import { makeStyles } from "@material-ui/core/styles";
import { Formik, Form } from "formik";
import { getObjKeys, getOwnerDropdownDataSource, getCollaboratorDropdownDataSource, yupSchema } from '../../constants/helpers';
import { useHistory } from "react-router-dom";
import { withStyles } from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import MuiDialogContent from '@material-ui/core/DialogContent';
import MuiDialogActions from '@material-ui/core/DialogActions';
import FormTypes from "../../components/Helpers/FormTypes";
import axiosInstance from '../../axios/axiosInstance'
import CustomButton from '../../components/Helpers/Button'
import CommonSkeleton from '../../components/Helpers/CommonSkeleton'
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';

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
    // modal: {
    //     padding: '10px',
    // },
    // content: {
    //     marginLeft: "6px",
    //     marginRight: '6px',
    //     minWidth: '943px',
    //     minHeight: '500px'
    // }
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
export default function CreateContact({ open, onClose, fetchData }) {
    const toastConfig = useContext(CustomToastContext);
    const classes = useStyles();
    const history = useHistory();
    const [entityData, setEntityData] = useState({
        fields: [],
        initialValues: {},
    });

    const [formsData, setFormsData] = useState([]);
    const [ownerCollaboratorData, setOwnerCollaboratorData] = useState([]);
    const [ownerData, setOwnerData] = useState([]);
    const [collaboratorData, setCollaboratorData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const ownerCollabOptions = entityData.fields.filter(d => ["owner", "collaborator"].indexOf(d.fieldName) !== -1);
        if (ownerCollabOptions.length > 0) {
            setOwnerCollaboratorData(ownerCollabOptions[0].option);
            setOwnerData(ownerCollabOptions[0].option)
            setCollaboratorData(ownerCollabOptions[0].option)
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
        setOwnerData(getOwnerDropdownDataSource(selectedCollaborator, ownerCollaboratorData))
    }

    const onCollabOwnerMultiselectOpen = (selectedOwnerId) => {
        setCollaboratorData(getCollaboratorDropdownDataSource(selectedOwnerId, ownerCollaboratorData))
    }

    useEffect(() => {
        getContactFields();
    }, []);

    const getContactFields = () => {
        axiosInstance().get('/field?resource=Lead').then(({ data: { data } }) => {

            const newFields = [];
            data.filter(d => d.isCreate).map((_f) => newFields.push(_f.fieldData));

            setEntityData({
                fields: newFields,
                initialValues: getObjKeys("", newFields),
            });
        });
    };

    const handleSubmit = async (errors, setTouched, values, setValues, setErrors) => {
        if (Object.keys(errors).length) {
            entityData.fields.forEach((input) => {
                if (input.required || values[input.fieldName]) {
                    setTouched(input.fieldName, true);
                }
            });
            toastConfig.setToastConfig({ open: true, type: "error", message: 'Please fill all required fields' });
            setErrors({ ...errors });
        } else {
            if (values.noOfEmployees) {
                values.noOfEmployees = parseInt(values.noOfEmployees)
            } else if (values.hasOwnProperty('noOfEmployees')) {
                delete values.noOfEmployees
            }
            handleCreateLead(values)
        }
    }

    const handleCreateLead = (values) => {
        setLoading(true)

        axiosInstance().post('/lead', values)
            .then(({ data }) => {
                toastConfig.setToastConfig({ open: true, type: "success", message: data.message });
                setLoading(false)
                onClose()
                fetchData()
            }).catch((error) => {
                toastConfig.setToastConfig(error);
                setLoading(false);
            });
    }
    
    return (
        <Dialog
            maxWidth="md"
            aria-labelledby="customized-dialog-title"
            onClose={onClose}
            open={open}
            disableBackdropClick={true}
        >
            <CustomDialogHeader title="Create Lead" onClose={onClose} />

            {
                entityData.fields.length == 0 && <DialogContent dividers>
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
                        setErrors,
                        setValues
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
                                                                            options={ownerData}
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
                                                                                options={collaboratorData}
                                                                                setFieldValue={setFieldValue}
                                                                                required={field.required}
                                                                                fullWidth
                                                                                isTooltip={true}
                                                                                size="small"
                                                                                onOpen={() => { onCollabOwnerMultiselectOpen(values["owner"]) }}
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

                                <CustomButton
                                    loading={loading}
                                    disabled={loading}

                                    style={{ float: "right" }}
                                    variant="contained"
                                    color="primary"
                                    // disabled={Object.keys(errors).length > 0 ? true : false}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        handleSubmit(errors, setFieldTouched, values, setValues, setErrors)
                                    }}
                                >
                                    Create Lead
                                    </CustomButton>
                            </DialogActions>
                        </>
                    )}

                </Formik>
            }

        </Dialog>

    )
}
