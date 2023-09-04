import { Fragment, useContext, useEffect, useState } from "react";
import { Box, Button, Checkbox, Dialog, FormControlLabel, Grid, IconButton, TextField } from "@material-ui/core";
import { isMobile, isTablet } from "react-device-detect";
import { CustomDialogTransition, sidebarResource, yupSchema } from "src/constants/helpers";
import { FieldArray, Form, Formik } from "formik";
import CustomDialogHeader from "src/components/CustomDialog/CustomDialogHeader";
import CustomDialogContent from "src/components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "src/components/CustomDialog/CustomDialogFooter";
import CustomButton from "src/components/Helpers/CustomButton";
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import AddIcon from '@material-ui/icons/Add';
import CloseIcon from '@material-ui/icons/Close';
import { Autocomplete } from "@material-ui/lab";
import axiosInstance from "src/axios/axiosInstance";
import routes from "src/components/Helpers/Routes";
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import CommonSkeleton from "src/components/Helpers/CommonSkeleton";
import { UserDropdown } from "src/components/Activity/Helpers/userDropdown";

export default function ManageRules({ deviceTemplate, open, id = null, onClose, onSuccess }) {

    const OPERATOR = [
        {
            optionLabel: 'Less than',
            optionValue: 'lessThan',
        },
        {
            optionLabel: 'Less than or equals',
            optionValue: 'lessThanOrEquals',
        },
        {
            optionLabel: 'Greater than',
            optionValue: 'greaterThan',
        },
        {
            optionLabel: 'Greater than or equals',
            optionValue: 'greaterThanOrEquals',
        }
    ]

    const toastConfig = useContext(CustomToastContext);

    const [fullScreen, setFullScreen] = useState(true);
    const [iotDataPoints, setIotDataPoints] = useState([]);
    const [initialValue, setInitialValue] = useState(null)

    useEffect(() => {
        fetchData()
    }, [id])

    const fetchData = () => {
        if (id) {
            axiosInstance().get(`${routes.deviceTemplates.path}/rule/${id}`)
                .then(({ data: { data } }) => {
                    setInitialValue({
                        ruleName: data?.ruleName,
                        condition: data?.condition,
                        isEmailAlert: data?.isEmailAlert,
                        emailAlertUsers: data?.emailAlertUsers?.map(e => ({ userId: e })),
                        isCreateTask: data?.isCreateTask,
                        taksAssignUsers: data?.taksAssignUsers?.map(t => ({ userId: t }))
                    })
                })
                .catch((error) => {
                    toastConfig.setToastConfig(error);
                })
        } else {
            setInitialValue({
                ruleName: '',
                condition: [''],
                isEmailAlert: false,
                emailAlertUsers: [],
                isCreateTask: false,
                taksAssignUsers: []
            })
        }
    }

    const findIotDataoints = () => {
        const query = [{ field: 'deviceTemplate', term: deviceTemplate }]
        axiosInstance().get(`${routes.iotDataPoints.path}?filterById=${JSON.stringify(query)}&filterType=and`)
            .then(({ data: { data: { data } } }) => {
                setIotDataPoints(data?.map(d => ({ optionLabel: d?.fieldLabel, optionValue: d?._id })))
            })
    }

    useEffect(() => {
        findIotDataoints()
    }, [])

    const handleSubmit = (values) => {
        if (id) {
            values._id = id;
            axiosInstance().put(`${routes.deviceTemplates.path}/rule`, values)
                .then(({ data: { data, message } }) => {
                    toastConfig.setToastConfig({
                        open: true,
                        type: 'success',
                        message: message
                    });
                    onSuccess()
                })
                .catch((error) => {
                    toastConfig.setToastConfig(error);
                });
        } else {
            values.deviceTemplate = deviceTemplate;
            axiosInstance().post(`${routes.deviceTemplates.path}/rule`, values)
                .then(({ data: { data, message } }) => {
                    toastConfig.setToastConfig({
                        open: true,
                        type: 'success',
                        message: message
                    });
                    onSuccess()
                })
                .catch((error) => {
                    toastConfig.setToastConfig(error);
                });
        }
    };

    function validate(values) {
        const errors = {};
        if (values.ruleName === '') {
            errors['ruleName'] = 'Please enter rule name';
        }
        return errors;
    }

    return (
        <>
            <Dialog
                maxWidth="md"
                fullWidth
                fullScreen={fullScreen || isMobile || isTablet}
                TransitionComponent={CustomDialogTransition}
                aria-labelledby="customized-dialog-title"
                onClose={(e, reason) => {
                    if (reason !== 'backdropClick') {
                        onClose()
                    }
                }}
                open={open}
            >
                {initialValue ? (
                    <Formik
                        initialValues={initialValue}
                        validateOnMount
                        validate={validate}
                        onSubmit={handleSubmit}
                    >
                        {({ values, errors, touched, setFieldValue, submitForm }) => (
                            <Fragment>
                                <CustomDialogHeader
                                    title={'Create Rule'}
                                    onClose={onClose}
                                    isMinimized={!fullScreen}
                                    onMinimizeMaximize={() => {
                                        setFullScreen((prevState) => !prevState);
                                    }}
                                    showManimizeMaximize={true}
                                />
                                <CustomDialogContent>
                                    <Form autoComplete="off" autoCorrect="off" noValidate>
                                        <Grid container spacing={2} direction="column">
                                            <Grid item>
                                                <Grid container spacing={2}>
                                                    <Grid item md={6} lg={6}>
                                                        <TextField
                                                            margin="dense"
                                                            type="text"
                                                            label="Rule Name"
                                                            name="ruleName"
                                                            variant="outlined"
                                                            required
                                                            fullWidth
                                                            disabled={false}
                                                            value={values['ruleName']}
                                                            error={touched['ruleName'] && Boolean(errors['ruleName'])}
                                                            helperText={touched['ruleName'] && errors['ruleName']}
                                                            onChange={(e) => {
                                                                setFieldValue('ruleName', e.target.value);
                                                            }}
                                                        />
                                                    </Grid>
                                                </Grid>
                                            </Grid>
                                            <Grid item>
                                                <h2 style={{ margin: 0 }} className="form-label-style">Conditions</h2>
                                                <Box p={2} pb={0}>
                                                    <Grid container spacing={2} direction="column">
                                                        <FieldArray name='condition'>
                                                            {({ push, remove }) => (
                                                                <>
                                                                    {values?.condition?.map((cnd, i) => {
                                                                        return (
                                                                            <Grid item>
                                                                                <Box display='flex' justifyContent='space-between' alignItems='center'>
                                                                                    <Box width='30%'>
                                                                                        <Autocomplete
                                                                                            options={iotDataPoints}
                                                                                            getOptionLabel={(option) => option?.optionLabel}
                                                                                            value={iotDataPoints?.find((data) => data?.optionValue === values?.condition[i]?.dataPoint) ?? ''}
                                                                                            fullWidth
                                                                                            onChange={(e, newValue) => {
                                                                                                setFieldValue(`condition.${i}.dataPoint`, newValue?.optionValue);
                                                                                            }}
                                                                                            size="small"
                                                                                            renderInput={(params) => (
                                                                                                <TextField
                                                                                                    {...params}
                                                                                                    label="Data Points"
                                                                                                    variant="outlined"
                                                                                                />
                                                                                            )}
                                                                                        />
                                                                                    </Box>
                                                                                    <Box width='30%'>
                                                                                        <Autocomplete
                                                                                            options={OPERATOR}
                                                                                            getOptionLabel={(option: any) => option?.optionLabel ?? ''}
                                                                                            value={OPERATOR?.find((data) => data?.optionValue === values?.condition[i]?.operator) ?? ''}
                                                                                            fullWidth
                                                                                            onChange={(event, newValue: any) => {
                                                                                                setFieldValue(`condition.${i}.operator`, newValue?.optionValue);
                                                                                            }}
                                                                                            size="small"
                                                                                            renderInput={(params) => (
                                                                                                <TextField
                                                                                                    {...params}
                                                                                                    label="Operator"
                                                                                                    variant="outlined"
                                                                                                />
                                                                                            )}
                                                                                        />
                                                                                    </Box>
                                                                                    <Box width='30%'>
                                                                                        <TextField
                                                                                            margin="dense"
                                                                                            type="number"
                                                                                            label="value"
                                                                                            name="value"
                                                                                            variant="outlined"
                                                                                            fullWidth
                                                                                            value={values?.condition[i]?.value}
                                                                                            // error={touched['value'] && Boolean(errors['value'])}
                                                                                            // helperText={touched['value'] && errors['value']}
                                                                                            onChange={(e) => {
                                                                                                setFieldValue(`condition.${i}.value`, parseFloat(e.target.value));
                                                                                            }}
                                                                                        />
                                                                                    </Box>
                                                                                    <Box width='5%' display='flex' justifyContent='space-between' alignItems='center'>
                                                                                        <IconButton
                                                                                            size="small"
                                                                                            aria-label="close"
                                                                                            onClick={() => remove(i)}
                                                                                        >
                                                                                            <CloseIcon fontSize="small" color={'primary'} />
                                                                                        </IconButton>
                                                                                        <IconButton
                                                                                            size="small"
                                                                                            aria-label="add"
                                                                                            onClick={() => push('')}
                                                                                        >
                                                                                            <AddIcon fontSize="small" color={'primary'} />
                                                                                        </IconButton>
                                                                                    </Box>
                                                                                </Box>
                                                                            </Grid>
                                                                        )
                                                                    })}
                                                                </>
                                                            )}
                                                        </FieldArray>
                                                    </Grid>
                                                </Box>
                                            </Grid>
                                            <Grid item>
                                                <Grid container spacing={2}>
                                                    <Grid item md={6} lg={6} sm={12} xs={12}>
                                                        <FormControlLabel
                                                            style={{ margin: 0 }}
                                                            control={
                                                                <Checkbox
                                                                    checked={values['isEmailAlert']}
                                                                    onChange={(e) => {
                                                                        setFieldValue('isEmailAlert', e.target.checked);
                                                                    }}
                                                                    name="isEmailAlert"
                                                                    color="primary"
                                                                />
                                                            }
                                                            label="Email Alert"
                                                        />
                                                    </Grid>
                                                    <Grid item md={6} lg={6} sm={12} xs={12}>
                                                        {
                                                            values['isEmailAlert'] && (
                                                                <UserDropdown
                                                                    name="emailAlertUsers"
                                                                    label="Email Alert Users"
                                                                    errors={errors}
                                                                    touched={touched}
                                                                    required={false}
                                                                    setFieldValue={(name, value) => {
                                                                        setFieldValue(name, value);
                                                                    }}
                                                                    multiple={true}
                                                                    value={values['emailAlertUsers']}
                                                                    email={[]}
                                                                />
                                                            )
                                                        }
                                                    </Grid>
                                                </Grid>
                                            </Grid>
                                            <Grid item>
                                                <Grid container spacing={2}>
                                                    <Grid item md={6} lg={6} sm={12} xs={12}>
                                                        <FormControlLabel
                                                            style={{ margin: 0 }}
                                                            control={
                                                                <Checkbox
                                                                    checked={values['isCreateTask']}
                                                                    onChange={(e) => {
                                                                        setFieldValue('isCreateTask', e.target.checked);
                                                                    }}
                                                                    name="isCreateTask"
                                                                    color="primary"
                                                                />
                                                            }
                                                            label="Create Task"
                                                        />
                                                    </Grid>
                                                    <Grid item md={6} lg={6} sm={12} xs={12}>
                                                        {
                                                            values['isCreateTask'] && (
                                                                <UserDropdown
                                                                    name="taksAssignUsers"
                                                                    label="Taks Assign Users"
                                                                    errors={errors}
                                                                    touched={touched}
                                                                    required={false}
                                                                    setFieldValue={(name, value) => {
                                                                        setFieldValue(name, value);
                                                                    }}
                                                                    multiple={true}
                                                                    value={values['taksAssignUsers']}
                                                                    email={[]}
                                                                />
                                                            )
                                                        }
                                                    </Grid>
                                                </Grid>
                                            </Grid>
                                        </Grid>
                                    </Form >
                                </CustomDialogContent >
                                <CustomDialogFooter>
                                    <Button
                                        type="button"
                                        variant="outlined"
                                        color="primary"
                                        size="small"
                                        onClick={onClose}
                                    >
                                        Cancel
                                    </Button>
                                    <CustomButton
                                        loading={false}
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
                            </Fragment >
                        )}
                    </Formik >
                ) : (
                    <Box p={2} height={500}>
                        <CommonSkeleton lenArray={[...Array(10).keys()]} />
                    </Box>
                )}
            </Dialog >
        </>
    )
}