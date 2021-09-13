import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import { FaCheckCircle } from 'react-icons/fa';
import { isMobile } from "react-device-detect";

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
    pbStepper: {
        overflow: "none",
        [theme.breakpoints.down("xs")]: {
            overflow: "auto"
        },
    },
}));

export default function CustomSteps({ steps, active }) {
    const classes = useStyles();
    const [skipped, ] = useState(new Set());

    const isStepSkipped = (step) => {
        return skipped.has(step);
    };

    return (
        <div className={classes.root}>
            <Stepper className={`${classes.pbStepper} stepper-responsive`} activeStep={active + 1}>
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
                            style={isMobile ? { width: "50%" } : { width: `${100 / steps.length}%` }}
                            className={`${index <= active ? classes.active : (index === (active + 1)) ? classes.currentStep : classes.inActive}`}
                        //className={`${active > index ? classes.completed : (index === active ? classes.current : "")} ${classes[setBackGroundColor[step.text]] ?? ''}`}
                        >
                            <StepLabel
                                {...labelProps}
                                icon={active >= index ? <FaCheckCircle /> : (index === active ? index + 1 : index + 1)}>
                                {step.text}</StepLabel>
                        </Step>
                    );
                })}
            </Stepper>
        </div>
    );
}
