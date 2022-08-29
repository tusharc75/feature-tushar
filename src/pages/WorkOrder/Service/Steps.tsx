import React, { Fragment, useContext, useEffect, useRef, useState } from 'react';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { Formik, Form } from "formik";
import { dateTimeFormat, getObjKeys, getObjKeysWithValues, serviceMaster, workOrder, yupSchema } from 'src/constants/helpers';
import { Box, Divider, Grid, IconButton, Paper } from '@material-ui/core';
import CustomButton from 'src/components/Helpers/CustomButton';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import moment from 'moment';
import { RiShareForwardFill } from 'react-icons/ri';
import { TiArrowBack } from 'react-icons/ti';
import FormTypes from 'src/components/Helpers/FormTypes';

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
        stepContent: {
            margin: theme.spacing(1),
        }
    }),
);

const Service = ({ workOrderId, serviceId, serviceData, getServiceData, serviceSteps, setServiceId }) => {

    const classes = useStyles();
    const toastConfig = useContext(CustomToastContext);
    const [currentStep, setCurrentStep] = useState(0);
    const [initialData, setInitialData] = useState<any>({ fields: [], values: {} });

    const [stepList, setStepList] = useState([])
    const [stepData, setStepData] = useState(null);
    const [serviceDetails, setServiceDetails] = useState(null);

    useEffect(() => {
        axiosInstance()
            .get(`${workOrder.api}/service/detail/${serviceId}`)
            .then(({ data: { data } }) => {
                setServiceDetails(data)
                const steps = data?.steps?.map(d => d.stepName);
                setStepList(steps);
                var curStep = 0;
                const compltedSteps = serviceData?.filter((e) => e.serviceId === serviceDetails?._id && e.status === "end");
                if (compltedSteps?.length < steps?.length) {
                    curStep = compltedSteps?.length;
                }
                else if (compltedSteps?.length === steps?.length) {
                    curStep = compltedSteps?.length - 1;
                }
                setCurrentStep(curStep)
            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
            });
    }, [serviceId]);

    useEffect(() => {
        if (currentStep > -1) {
            setInitialDataFields();
        }
    }, [currentStep, serviceData, serviceDetails]);

    const setInitialDataFields = () => {
        setInitialData({ fields: [], values: {} });
        if (serviceDetails?.steps?.length) {
            let fieldsDataForCreate = serviceDetails?.steps[currentStep]?.fields ? serviceDetails?.steps[currentStep]?.fields : []
            let tempServiceData = serviceData.find(d => d.serviceId === serviceDetails?._id && d.stepId === serviceDetails?.steps[currentStep]?._id)
            if (tempServiceData) {
                setStepData(tempServiceData)
                setInitialData({ fields: fieldsDataForCreate, values: getObjKeysWithValues(tempServiceData, fieldsDataForCreate) });
            }
            else {
                setStepData(null)
                setInitialData({ fields: fieldsDataForCreate, values: getObjKeys("", fieldsDataForCreate) });
            }
            let tempServiceDataFieldsId = serviceDetails?.steps?.map(d => d._id)
            let tempServiceDataId = serviceData?.map(d => d.stepId)
            if (tempServiceDataFieldsId.every(el => tempServiceDataId.includes(el))) {
                //setNextStep(true)
            }
        }
    };

    const handleNext = () => {
        setCurrentStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleBack = () => {
        setCurrentStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleSubmit = async (values) => {
        let tempData = {
            "serviceId": serviceId,
            "stepId": serviceDetails?.steps[currentStep]?._id,
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
                getServiceData()
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

    const handleStartEnd = (type) => {
        axiosInstance()
            .put(`${workOrder.api}/${workOrderId}/step/${type}`, {
                "serviceId": serviceId,
                "stepId": serviceDetails?.steps[currentStep]?._id,
            })
            .then(({ data }) => {
                toastConfig.setToastConfig({
                    open: true,
                    type: "success",
                    message: data.message,
                });
                getServiceData()
            })
            .catch((error) => {
                toastConfig.setToastConfig(error);
            });
    }

    console.log(initialData)

    return (stepList?.length ?
        <Box>
            <Box p={2} display={"flex"} justifyContent="center">
                <Box>
                    <IconButton
                        color="primary"
                        onClick={handleBack}
                        size="small"
                        disabled={currentStep === 0}
                    >
                        <TiArrowBack size={25} />
                    </IconButton>
                </Box>
                <Box flexGrow={1}>
                    <Stepper className={`${classes.pbStepper} stepper-responsive mt-2`} activeStep={currentStep} alternativeLabel>
                        {stepList?.map((label) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                </Box>
                <Box>
                    <IconButton
                        color="primary"
                        onClick={handleNext}
                        size="small"
                        disabled={currentStep === stepList?.length - 1}
                    >
                        <RiShareForwardFill size={25} />
                    </IconButton>
                </Box>
            </Box>
            <Divider />
            {!stepData?.status || stepData?.status === "start" ? <Fragment>
                <Box p={2}>
                    {!stepData?.status ?
                        <Button
                            variant="outlined"
                            color="secondary"
                            size="small"
                            onClick={() => { handleStartEnd("start") }}
                        >
                            Start
                        </Button> : null}
                    {stepData?.status === "start" ?
                        <Button
                            variant="outlined"
                            color="secondary"
                            size="small"
                            onClick={() => { handleStartEnd("end") }}
                        >
                            End
                        </Button> : null}
                </Box>
                <Divider />
            </Fragment> : null}


            {initialData.fields.length ?
                <Fragment>
                    <Box p={2}>
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
                                        <Box marginY={2}>
                                            <Grid spacing={3} container>
                                                {initialData.fields?.map((field, index) => (
                                                    <Grid key={index} item xs={12} sm={6} md={6}>
                                                        <FormTypes
                                                            {...field}
                                                            fieldData={field}
                                                            values={values}
                                                            label={field.fieldLabel}
                                                            name={field.fieldName}
                                                            type={field.type}
                                                            required={field.required}
                                                            options={field.options ? field.options : []}
                                                            setFieldValue={(name, value) => {
                                                                setFieldValue(name, value)
                                                            }}
                                                            errors={errors}
                                                            touched={touched}
                                                            fullWidth
                                                            size="small"
                                                        />
                                                    </Grid>
                                                ))}
                                            </Grid>
                                        </Box>
                                    </Form>
                                    <Box display="flex" justifyContent="flex-end" pt={2}>
                                        <CustomButton
                                            variant="contained"
                                            color="primary"
                                            type="submit"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleScroll(errors)
                                                submitForm();
                                            }}
                                        > Save
                                        </CustomButton>
                                    </Box>
                                </Fragment>
                            )}
                        </Formik>
                    </Box>
                    <Divider />
                </Fragment> : null}
            <Box p={2}>
                <Grid container>
                    <Grid item xs={12} >
                        <Box display="flex">
                            {stepData?.startDate ?
                                <Box>
                                    <Typography variant="caption">Start Date Time</Typography>
                                    <Typography variant="body2"> {moment(stepData?.startDate).format(dateTimeFormat)}</Typography>
                                </Box>
                                : null}
                            {stepData?.endDate ?
                                <Box ml={2}>
                                    <Typography variant="caption">End Date Time</Typography>
                                    <Typography variant="body2"> {moment(stepData?.endDate).format(dateTimeFormat)}</Typography>
                                </Box>
                                : null}
                            {stepData?.startDate && stepData?.endDate ?
                                <Box ml={2}>
                                    <Typography variant="caption">Duration</Typography>
                                    <Typography variant="body2">{`${moment(stepData?.endDate).diff(moment(stepData?.startDate), 'hours')} hours`}</Typography>
                                </Box>
                                : null}
                        </Box>
                    </Grid>
                </Grid>
            </Box>
        </Box> : null
    );
}
export default Service;