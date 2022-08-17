import React, { Fragment, useRef, useState } from 'react';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { Formik, Form } from "formik";
import { getObjKeys, getObjKeysWithValues, yupSchema } from 'src/constants/helpers';
import { FaDiceOne } from 'react-icons/fa';
import { Box, Grid } from '@material-ui/core';
import FormTypes from 'src/components/ServiceMaster/FormTypes';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomButton from 'src/components/Helpers/CustomButton';
import ConfirmCancelDialog from 'src/components/ConfirmCancelDialog';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

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


const Service = ({ data }) => {
    const classes = useStyles();
    const [activeStep, setActiveStep] = useState(0);
    const ref = useRef(null);
    const [initialData, setInitialData] = useState<any>({ fields: data?.configureFields ? data?.configureFields : [], values: {} });
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)


    const handleNext = () => {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleReset = () => {
        setActiveStep(0);
    };

    const handleSubmit = async (values) => {

    };

    function validate(values) {
        const errors = {};
        return errors;
    }

    return (
        <div className={classes.root}>
            <Stepper activeStep={activeStep} alternativeLabel>
                {data?.steps?.map((label) => (
                    <Step key={label?.step}>
                        <StepLabel>{label?.step}</StepLabel>
                    </Step>
                ))}
            </Stepper>
            <div>
                {activeStep === data?.steps?.length ? (
                    <div>
                        <Typography className={classes.instructions}>All steps completed</Typography>
                        <Button onClick={handleReset}>Reset</Button>
                    </div>
                ) : (
                    <Box marginY={2} p={2}>
                        {initialData.fields.length ? (
                            <Formik
                                initialValues={initialData.values}
                                validationSchema={yupSchema(initialData.fields)}
                                onSubmit={handleSubmit}
                                validate={validate}
                                innerRef={ref}
                            >
                                {({ values, errors, setFieldValue, touched, submitForm }) => (
                                    <Fragment>
                                        <Form autoComplete="off" autoCorrect="off" noValidate >
                                            {
                                                <div key="display_stepper_content">
                                                    <Box marginY={2}>
                                                        <Grid spacing={3} container>
                                                            {
                                                                data?.configureFields?.map((field, index) => (
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
                                                disabled={activeStep === 0}
                                                onClick={handleBack}
                                            >
                                                Back
                                            </Button>
                                            <CustomButton
                                                variant="contained"
                                                color="primary"
                                                type="submit"
                                                disabled={activeStep === data?.steps.length}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleNext()
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