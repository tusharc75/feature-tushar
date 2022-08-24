import React, { Fragment, useContext, useEffect, useRef, useState } from 'react';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { Formik, Form } from "formik";
import { dateTimeFormat, getObjKeys, getObjKeysWithValues, workOrder, yupSchema } from 'src/constants/helpers';
import { FaDiceOne } from 'react-icons/fa';
import { Box, Grid, IconButton } from '@material-ui/core';
import FormTypes from 'src/components/ServiceMaster/FormTypes';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomButton from 'src/components/Helpers/CustomButton';
import ConfirmCancelDialog from 'src/components/ConfirmCancelDialog';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import { TiArrowBack } from 'react-icons/ti';
import { RiShareForwardFill } from 'react-icons/ri';
import { isMobile } from 'react-device-detect';
import DeleteButton from 'src/components/Helpers/DeleteButton';
import moment from 'moment';

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            marginTop: theme.spacing(3),
            width: '100%',
        },
        backButton: {
            marginRight: theme.spacing(1),
        },
        pbStepper: {
            overflow: 'none',
            justifyContent: 'space-evenly',
            [theme.breakpoints.down('xs')]: {
                overflow: 'auto'
            }
        },
        instructions: {
            marginTop: theme.spacing(1),
            marginBottom: theme.spacing(1),
        },
    }),
);


const Service = ({ serviceDataFields, serviceData, workOrderId, fetchWorkOrderData, setNextStep }) => {
    const classes = useStyles();
    const toastConfig = useContext(CustomToastContext);
    const [currentStep, setCurrentStep] = useState(0);
    const [initialData, setInitialData] = useState<any>({ fields: [], values: {} });
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [stepConstant, setStepConstant] = useState([])
    const [stepData, setStepData] = useState(null);

    useEffect(() => {
        setInitialDataFields();
        setCurrentStep(0);
        setStepConstant(serviceDataFields?.steps?.map(d => d.stepName));

    }, [serviceDataFields]);

    useEffect(() => {
        if (currentStep > -1) {
            setInitialDataFields();
        }
    }, [currentStep, serviceData]);

    const setInitialDataFields = () => {
        setInitialData({ fields: [], values: {} });
        let fieldsDataForCreate = serviceDataFields?.steps[currentStep]?.fields ? serviceDataFields?.steps[currentStep]?.fields : []
        let tempServiceData = serviceData.find(d => d.serviceId === serviceDataFields?._id && d.stepId === serviceDataFields?.steps[currentStep]?._id)
        if (tempServiceData) {
            setStepData(tempServiceData)
            setInitialData({ fields: fieldsDataForCreate, values: getObjKeysWithValues(tempServiceData, fieldsDataForCreate) });
        }
        else {
            setStepData(null)
            setInitialData({ fields: fieldsDataForCreate, values: getObjKeys("", fieldsDataForCreate) });
        }
        let tempServiceDataFieldsId = serviceDataFields?.steps?.map(d => d._id)
        let tempServiceDataId = serviceData?.map(d => d.stepId)
        if (tempServiceDataFieldsId.every(el => tempServiceDataId.includes(el))) {
            setNextStep(true)
        }
    };

    const handleNext = () => {
        if (currentStep < stepConstant.length - 1) setCurrentStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleBack = () => {
        setCurrentStep((prevActiveStep) => prevActiveStep - 1);
    };


    const handleSubmit = async (values) => {

        let tempData = {
            "serviceId": serviceDataFields?._id,
            "stepId": serviceDataFields?.steps[currentStep]?._id,
        }
        axiosInstance()
            .put(`${workOrder.api}/update-steps-data/${workOrderId}`, { ...tempData, ...values })
            .then(({ data }) => {
                toastConfig.setToastConfig({
                    open: true,
                    type: "success",
                    message: data.message,
                });
                handleNext()
                fetchWorkOrderData()
            })
            .catch((error) => {
                toastConfig.setToastConfig(error);
            });

    };

    function validate(values) {
        const errors = {};
        return errors;
    }

    const handleScroll = (errors) => {
        const err = Object.keys(errors);
        if (err.length) {
            const input = document.querySelector(
                `input[name=${err[0]}]`,
            );
            input.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'start',
            });
        }
    }

    return (
        <div className={classes.root}>
            <div className="position-relative">

                <Stepper className={`${classes.pbStepper} stepper-responsive mt-2`} activeStep={currentStep} alternativeLabel>
                    {stepConstant?.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

            </div>

            <div>
                {
                    (
                        <Box marginY={2} p={2}>
                            {initialData.fields.length ? (
                                <Formik
                                    initialValues={initialData.values}
                                    validationSchema={yupSchema(initialData.fields)}
                                    onSubmit={handleSubmit}
                                    validate={validate}
                                    enableReinitialize
                                >
                                    {({ values, errors, setFieldValue, touched, submitForm }) => (
                                        <Fragment>
                                            <Form autoComplete="off" autoCorrect="off" noValidate >
                                                {
                                                    <div key="display_stepper_content">
                                                        <Box marginY={2}>
                                                            <Grid spacing={3} container>
                                                                {
                                                                    initialData.fields?.map((field, index) => (
                                                                        <Grid key={index} item xs={12} sm={6} md={6}>
                                                                            <FormTypes
                                                                                {...field}
                                                                                fieldData={field}
                                                                                values={values}
                                                                                label={field.fieldLabel}
                                                                                name={field.fieldName}
                                                                                type={field.type}
                                                                                required={field.required}
                                                                                options={field.option ? field.option : []}
                                                                                setFieldValue={(name, value) => {
                                                                                    setFieldValue(name, value)
                                                                                }}
                                                                                fullWidth
                                                                                size="small"
                                                                            />
                                                                        </Grid>
                                                                    ))
                                                                }
                                                            </Grid>
                                                        </Box>
                                                    </div>
                                                }
                                            </Form>
                                            <Grid container spacing={2}>
                                                {stepData?.startDate && <Grid item xs={12} md={12} sm={12}>
                                                    <Typography style={{ fontWeight: "bold" }}>{`${"Duration "}`}</Typography>
                                                    <Typography display='inline'>
                                                        &nbsp;&nbsp;Start Date &nbsp;&nbsp;
                                                    </Typography>
                                                    <Typography style={{ fontWeight: "bold", color: "#258C89" }} display='inline'>
                                                        {`: ${moment(stepData?.startDate).format(dateTimeFormat)}`}
                                                    </Typography>
                                                    {stepData?.endDate && (
                                                        <>
                                                            <Typography display='inline'>
                                                                &nbsp;&nbsp;End Date&nbsp;&nbsp;
                                                            </Typography>
                                                            <Typography style={{ fontWeight: "bold", color: "#258C89" }} display='inline'>
                                                                {`: ${moment(stepData?.endDate).format(dateTimeFormat)}`}
                                                            </Typography>
                                                            <Typography display='inline'>
                                                                &nbsp;&nbsp;Time Duration&nbsp;&nbsp;
                                                            </Typography>
                                                            <Typography style={{ fontWeight: "bold", color: "#258C89" }} display='inline'>
                                                                {`: ${moment(stepData?.endDate).diff(moment(stepData?.startDate), 'hours')} hours`}
                                                            </Typography>
                                                        </>
                                                    )}

                                                </Grid>}

                                                <Grid item xs={12} md={12} sm={12}>
                                                    <Box display="flex" justifyContent="space-between" m={1}>
                                                        <Box display="flex">
                                                            <Button
                                                                variant="outlined"
                                                                color="primary"
                                                                size="small"
                                                                disabled={stepData?.startDate || stepData?.endDate}
                                                                onClick={() => {
                                                                    let tempData = {
                                                                        "serviceId": serviceDataFields?._id,
                                                                        "stepId": serviceDataFields?.steps[currentStep]?._id,
                                                                    }
                                                                    axiosInstance()
                                                                        .put(`${workOrder.api}/${workOrderId}/step/start `, tempData)
                                                                        .then(({ data }) => {
                                                                            toastConfig.setToastConfig({
                                                                                open: true,
                                                                                type: "success",
                                                                                message: data.message,
                                                                            });
                                                                            fetchWorkOrderData()
                                                                        })
                                                                        .catch((error) => {
                                                                            toastConfig.setToastConfig(error);
                                                                        });
                                                                }}
                                                            >
                                                                Start
                                                            </Button>
                                                            <Box mx={isMobile ? 0.5 : 1} />
                                                            <DeleteButton
                                                                text="End"
                                                                disabled={!stepData?.startDate || stepData?.endDate}
                                                                onClick={() => {
                                                                    let tempData = {
                                                                        "serviceId": serviceDataFields?._id,
                                                                        "stepId": serviceDataFields?.steps[currentStep]?._id,
                                                                    }
                                                                    axiosInstance()
                                                                        .put(`${workOrder.api}/${workOrderId}/step/end `, tempData)
                                                                        .then(({ data }) => {
                                                                            toastConfig.setToastConfig({
                                                                                open: true,
                                                                                type: "success",
                                                                                message: data.message,
                                                                            });
                                                                            fetchWorkOrderData()
                                                                        })
                                                                        .catch((error) => {
                                                                            toastConfig.setToastConfig(error);
                                                                        });
                                                                }}
                                                            />
                                                        </Box>
                                                        <Box display="flex">
                                                            <Button
                                                                variant="outlined"
                                                                color="primary"
                                                                size="small"
                                                                disabled={currentStep === 0}
                                                                onClick={handleBack}
                                                            >
                                                                Back
                                                            </Button>
                                                            <Box mx={isMobile ? 0.5 : 1} />
                                                            <CustomButton
                                                                variant="contained"
                                                                color="primary"
                                                                type="submit"
                                                                disabled={stepData?.endDate === undefined || stepData?.endDate === null}
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    handleScroll(errors)
                                                                    submitForm();
                                                                }}
                                                            > Save</CustomButton>
                                                        </Box>
                                                    </Box>
                                                </Grid>
                                            </Grid>


                                            {
                                                showConfirmDialog ?
                                                    <ConfirmCancelDialog
                                                        close={() => setShowConfirmDialog(false)}
                                                        open={showConfirmDialog}
                                                        onSave={() => {
                                                            setShowConfirmDialog(false)
                                                            submitForm();
                                                        }}
                                                        onClose={() => {
                                                            setShowConfirmDialog(false)
                                                        }}
                                                    /> : null
                                            }
                                        </Fragment>
                                    )}
                                </Formik>
                            ) :
                                <Box p={2} height={500} bgcolor="white">
                                    <CommonSkeleton lenArray={[...Array(10).keys()]} />
                                </Box>
                            }
                        </Box>
                    )}
            </div>
        </div>
    );
}
export default Service;