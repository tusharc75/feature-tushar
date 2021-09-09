import React, { useContext, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Stepper from "@material-ui/core/Stepper";
import Step from "@material-ui/core/Step";
import StepLabel from "@material-ui/core/StepLabel";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import axiosInstance from "../../axios/axiosInstance";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import clsx from "clsx";
import { GiBackwardTime } from "react-icons/gi";
import IconButton from '@material-ui/core/IconButton';

import {
    StepIconProps,
    Grid,
    Dialog,
    ListItemText,
    ListItem,
    List,
    ListItemIcon,
    Checkbox,
    TextField,
} from "@material-ui/core";
import {
    IoIosArrowDroprightCircle,
    IoIosArrowDropleftCircle,
} from "react-icons/io";
import { GoPencil } from "react-icons/go";
import { BsCheckCircle } from "react-icons/bs";
import { AiOutlineCloseCircle } from "react-icons/ai";
import { FcCancel } from "react-icons/fc";
import { FcClock } from "react-icons/fc";
import { FcApproval } from "react-icons/fc";
import { FaHourglassHalf } from "react-icons/fa";

import { isMobile } from "react-device-detect";

const useStyles = makeStyles((theme) => ({
    backButton: {
        marginRight: theme.spacing(1),
    },
    instructions: {
        fontWeight: "bold",
    },
    pStepper: {
        padding: "10px 4px",
        borderRadius: "4px",
        [theme.breakpoints.down("xs")]: {
            padding: "4px",
        },
    },
    pbStepper: {
        overflow: "none",
        [theme.breakpoints.down("xs")]: {
            overflow: "auto"
        },
    },
    step: {
        paddingLeft: "8px",
        paddingRight: "8px",
        padding: "5px 8px",
        width: "20%",
        textAlign: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "1px",
        borderRadius: "4px",
        border: "1px solid #d6d5d5",
        [theme.breakpoints.down("xs")]: {
            width: "50%",
            padding: "2px"
        },
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
    sent: {
        color: "#00acc1",
        fontWeight: "bold",
    },
    approved: {
        color: "#6ca826",
        fontWeight: "bold",
    },
    rejected: {
        color: "#d60f0f",
        fontWeight: "bold",
    },
}));

const useColorlibStepIconStyles = makeStyles((theme) => ({
    root: {
        color: "#d1c4c4",
        width: 30,
        height: 30,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
    },
    active: {
        color: "#047d1c !important",
    },
    completed: {
        color: "#3f3f02 !important",
    },
    rejected: {
        color: "#b3a6a6 !important",
    },
}));

const Steps = (props) => {
    const {
        steps,
        currentStep,
        setCurrentStep
    } = props;
    const classes = useStyles();
    let activeStep = currentStep;
    const toastConfig = useContext(CustomToastContext);
    const ColorlibStepIcon = (props: StepIconProps) => {
        const classes = useColorlibStepIconStyles();
        var { active, completed } = props;
        var rejected = false;
        let status = 1;
        if (active) {
            status = 1;
            active = true;
            completed = false;
            rejected = false;
        }
        if (props.icon === steps.length && props.active) {

            status = 4;
            active = false;
            completed = false;
            rejected = true;

        }

        const icons: { [index: string]: React.ReactElement } = {
            1: <GiBackwardTime size={20} />,
            2: <GoPencil size={20} />,
            3: <BsCheckCircle size={20} />,
            4: <AiOutlineCloseCircle size={20} color={rejected ? "red" : ""} />,
            5: <FaHourglassHalf size={20} />,
        };

        return (
            <div
                className={clsx(classes.root, {
                    [classes.active]: active,
                    [classes.completed]: completed,
                    [classes.rejected]: rejected,
                })}
            >
                {icons["3"]}
            </div>
        );
    };



    return (
        <div>
            <div className="position-relative">
                {/* {!versionStatus.includes("Accepted by Customer") &&
                    approvedQuote.approved && approvedQuote.versionApproved === version && (
                        <div className="d-flex align-items-center justify-content-center flex-column m-3">
                            <Typography className={classes.approved}>
                                Quote version - {approvedQuote.versionApproved} of this quote has
                                been Approved
                            </Typography>
                        </div>
                    )} */}
                <Grid container>
                    <Grid
                        item
                        xs={12}
                        sm={2}
                        md={1}
                        className="d-flex align-items-center justify-content-center mt-2"
                    >
                        {!isMobile && (
                            <>
                                <div>
                                    {(
                                        <div>
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                disabled={currentStep === 4 || currentStep === 0}
                                                onClick={() => {
                                                    setCurrentStep(currentStep - 1)
                                                }}
                                                size="small"
                                                startIcon={<IoIosArrowDropleftCircle />}
                                            >
                                                Back
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </Grid>
                    <Grid item xs={12} sm={8} md={10}>
                        <div className={classes.pStepper}>
                            <Grid container>
                                <Grid
                                    item
                                    xs={6}
                                    className="d-flex align-items-center justify-content-start mt-1 mb-1"
                                >
                                    {isMobile && (
                                        <>
                                            <div>
                                                {(
                                                    <div>
                                                        <IconButton
                                                            color="primary"
                                                            disabled={currentStep === 4}
                                                            onClick={() => {
                                                                setCurrentStep(currentStep + 1)
                                                            }}
                                                            size="small"
                                                        >
                                                            <IoIosArrowDropleftCircle />
                                                        </IconButton>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </Grid>
                                <Grid
                                    item
                                    xs={6}
                                    className="d-flex align-items-center justify-content-end mt-1 mb-1"
                                >
                                    {isMobile && (
                                        <>
                                            <div>
                                                {(
                                                    <div>
                                                        {(
                                                            <IconButton
                                                                color="primary"
                                                                onClick={() => {
                                                                    setCurrentStep(currentStep + 1)
                                                                }}
                                                                size="small"
                                                                disabled={currentStep === 4}
                                                            >
                                                                Next
                                                            </IconButton>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </Grid>
                            </Grid>
                            <Stepper className={`${classes.pbStepper} stepper-responsive`} activeStep={activeStep}>
                                {steps.map((label, i) => (
                                    <Step
                                        key={label}
                                        className={clsx(classes.step, {
                                            [classes.active]:
                                                currentStep > i ||
                                                steps[currentStep] === "End",
                                            [classes.currentStep]: currentStep === i,
                                            [classes.inActive]: currentStep !== i,
                                        })}
                                    >
                                        <StepLabel
                                            style={{ color: "#555" }}
                                            StepIconComponent={ColorlibStepIcon}
                                            className={"currentStepColor"}
                                        >
                                            {label}
                                        </StepLabel>
                                    </Step>
                                ))}
                            </Stepper>
                        </div>
                    </Grid>
                    <Grid
                        item
                        xs={12}
                        sm={2}
                        md={1}
                        className="d-flex align-items-center justify-content-center"
                    >
                        {!isMobile && (
                            <>
                                <div>
                                    {(
                                        <div>
                                            {(
                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    onClick={() => {
                                                        setCurrentStep(currentStep + 1)
                                                    }}
                                                    size="small"
                                                    disabled={currentStep === 4}
                                                    endIcon={<IoIosArrowDroprightCircle />}
                                                >
                                                    Next
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </Grid>
                </Grid>
            </div>

        </div>
    );
};

export default Steps;
