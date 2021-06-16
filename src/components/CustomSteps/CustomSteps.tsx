import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import { FaCheckCircle } from 'react-icons/fa';

const useStyles = makeStyles((theme) => ({
    root: {
        // width: "98%",
        // padding: "10px",
        // margin: "1%",
        // marginBottom: '25px',
        // boxShadow: "1px 3px 3px #ddd"
    },
    button: {
        marginRight: theme.spacing(1),
    },
    instructions: {
        marginTop: theme.spacing(1),
        marginBottom: theme.spacing(1),
    },
    inActive: {
        background: "#ebebeb",
    },
    currentStep: {
        background: "#ffffff",
    },
    active: {
        background: "#53ac65",
    },
}));


export default function CustomSteps({ steps, active }) {
    const classes = useStyles();
    const [activeStep, setActiveStep] = useState(0);
    const [skipped, setSkipped] = useState(new Set());

    const isStepOptional = (step) => {
        return step === 1;
    };

    const isStepSkipped = (step) => {
        return skipped.has(step);
    };

    const handleNext = () => {
        let newSkipped = skipped;
        if (isStepSkipped(activeStep)) {
            newSkipped = new Set(newSkipped.values());
            newSkipped.delete(activeStep);
        }

        setActiveStep((prevActiveStep) => prevActiveStep + 1);
        setSkipped(newSkipped);
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleSkip = () => {
        if (!isStepOptional(activeStep)) {
            // You probably want to guard against something like this,
            // it should never occur unless someone's actively trying to break something.
            throw new Error("You can't skip a step that isn't optional.");
        }

        setActiveStep((prevActiveStep) => prevActiveStep + 1);
        setSkipped((prevSkipped) => {
            const newSkipped = new Set(prevSkipped.values());
            newSkipped.add(activeStep);
            return newSkipped;
        });
    };

    const handleReset = () => {
        setActiveStep(0);
    };

    return (
        <div className={classes.root}>
            <Stepper activeStep={active + 1}>
                {steps.map((step, index) => {
                    const stepProps: any = {};
                    const labelProps: any = {};
                    // if (isStepOptional(index)) {
                    //     labelProps["optional"] = <Typography variant="caption">Optional</Typography>;
                    // }
                    if (isStepSkipped(index)) {
                        stepProps.completed = false;
                    }
                    return (
                        <Step
                            key={index} {...stepProps}
                            style={{ width: `${100 / steps.length}%` }}
                            className={`${index <= active ? classes.active : (index === (active + 1)) ? classes.currentStep : classes.inActive}`}
                        //className={`${active > index ? classes.completed : (index === active ? classes.current : "")} ${classes[setBackGroundColor[step.text]] ?? ''}`}
                        >
                            <StepLabel
                                {...labelProps}
                                icon={active > index ? <FaCheckCircle /> : (index === active ? index + 1 : index + 1)}>
                                {step.text}</StepLabel>
                        </Step>
                    );
                })}
            </Stepper>
            {/* <div>
                {activeStep === steps.length ? (
                    <div>
                        <Typography className={classes.instructions}>
                            All steps completed - you&apos;re finished
                </Typography>
                        <Button onClick={handleReset} className={classes.button}>
                            Reset
                </Button>
                    </div>
                ) : (
                    <div>
                        <Typography className={classes.instructions}>{getStepContent(activeStep)}</Typography>
                        <div>
                            <Button disabled={activeStep === 0} onClick={handleBack} className={classes.button}>
                                Back
                  </Button>
                            {isStepOptional(activeStep) && (
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleSkip}
                                    className={classes.button}
                                >
                                    Skip
                                </Button>
                            )}

                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleNext}
                                className={classes.button}
                            >
                                {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
                            </Button>
                        </div>
                    </div>
                )}
            </div> */}
        </div >
    );
}
