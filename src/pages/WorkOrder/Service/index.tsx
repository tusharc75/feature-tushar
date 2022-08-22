import React, { Fragment, useContext, useEffect, useRef, useState } from 'react';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { Formik, Form } from "formik";
import { getObjKeys, getObjKeysWithValues, workOrder, yupSchema } from 'src/constants/helpers';
import { FaDiceOne } from 'react-icons/fa';
import { Box, Grid } from '@material-ui/core';
import FormTypes from 'src/components/ServiceMaster/FormTypes';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomButton from 'src/components/Helpers/CustomButton';
import ConfirmCancelDialog from 'src/components/ConfirmCancelDialog';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import Steps from 'src/pages/RentalManagement/Steps';

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            width: '100%',
        },
        backButton: {
            marginRight: theme.spacing(1),
        },
        instructions: {
            marginTop: theme.spacing(1),
            marginBottom: theme.spacing(1),
        },
    }),
);


const Service = ({ serviceDataFields, serviceData, workOrderId, fetchWorkOrderData }) => {
    const classes = useStyles();
    const toastConfig = useContext(CustomToastContext);
    const [currentStep, setCurrentStep] = useState(0);
    const [initialData, setInitialData] = useState<any>({ fields: [], values: {} });
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [stepConstant, setStepConstant] = useState([])
    const [nextStep, setNextStep] = useState(true);

    useEffect(() => {
        setInitialDataFields();
        setCurrentStep(0);
        setStepConstant(serviceDataFields?.steps?.map(d => d.stepName));

    }, [serviceDataFields]);

    useEffect(() => {
        if (currentStep > -1) {
            setInitialDataFields();
        }
    }, [currentStep]);

    const setInitialDataFields = () => {
        setInitialData({ fields: [], values: {} });
        let fieldsDataForCreate = serviceDataFields?.steps[currentStep]?.fields ? serviceDataFields?.steps[currentStep]?.fields : []
        let tempServiceData = serviceData.find(d => d.serviceId === serviceDataFields?._id && d.stepId === serviceDataFields?.steps[currentStep]?._id)
        if (tempServiceData) {
            setInitialData({ fields: fieldsDataForCreate, values: getObjKeysWithValues(tempServiceData, fieldsDataForCreate) });
        }
        else {
            setInitialData({ fields: fieldsDataForCreate, values: getObjKeys("", fieldsDataForCreate) });
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

    return (
        <div className={classes.root}>
            <Steps
                isNextStep={false}
                nextStep={nextStep}
                steps={stepConstant}
                currentStep={currentStep}
                setCurrentStep={setCurrentStep}
                isStepEnded={false}
            />
            {/* <Stepper activeStep={currentStep} alternativeLabel>
                {stepConstant?.map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper> */}
            <div>
                {
                    // currentStep === stepConstant?.length ? (
                    //     <div>
                    //         <Typography className={classes.instructions}>All steps completed</Typography>
                    //         <Button onClick={handleReset}>Reset</Button>
                    //     </div>
                    // ) : 
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
                                            <CustomDialogFooter>
                                                <Button
                                                    variant="outlined"
                                                    color="primary"
                                                    size="small"
                                                    disabled={currentStep === 0}
                                                    onClick={handleBack}
                                                >
                                                    Back
                                                </Button>
                                                <CustomButton
                                                    variant="contained"
                                                    color="primary"
                                                    type="submit"
                                                    disabled={currentStep === serviceDataFields?.steps.length}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        submitForm();
                                                    }}
                                                > Save</CustomButton>
                                            </CustomDialogFooter>
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