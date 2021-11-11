import React, { useContext } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Stepper from "@material-ui/core/Stepper";
import Step from "@material-ui/core/Step";
import StepLabel from "@material-ui/core/StepLabel";
import Button from "@material-ui/core/Button";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import clsx from "clsx";
import { GiBackwardTime } from "react-icons/gi";
import IconButton from '@material-ui/core/IconButton';
import {
    StepIconProps,
    Grid,
} from "@material-ui/core";
import {
    IoIosArrowDroprightCircle,
    IoIosArrowDropleftCircle,
} from "react-icons/io";
import { GoPencil } from "react-icons/go";
import { BsCheckCircle } from "react-icons/bs";
import { AiOutlineCloseCircle } from "react-icons/ai";
import { FaHourglassHalf } from "react-icons/fa";

import { isMobile } from "react-device-detect";
import {TiArrowBack} from "react-icons/ti";
import {RiShareForwardFill} from "react-icons/ri";

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
        justifyContent: "space-evenly",
        [theme.breakpoints.down("xs")]: {
            overflow: "auto"
        },
    },
    step: {
        paddingLeft: "8px",
        paddingRight: "8px",
        padding: "10px 8px",
        width: "20%",
        textAlign: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "2px",
        borderRadius: "12px 40px 40px 50px",
        border: "1px solid #d6d5d5",
        [theme.breakpoints.down("xs")]: {
            width: "50%",
            padding: "2px"
        },
    },
    inActive: {
        flex: "1",
        background: "#ebebeb",
        borderLeft: "6px solid var(--grey)",
    },
    currentStep: {
        flex: "1",
        background: "#ffffff",
        borderLeft: "6px solid #378280",
        color: "#378280 !important",

    },
    active: {
        flex: "1",
        background: "#c8e9ce",
        borderBottom: "0px solid var(--warning)",
        color: "var(--secondary) !important",
        borderLeft: "6px solid var(--secondary)",
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
        isNextStep,
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
                <Grid container xs={12}>
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
                                            <IconButton
                                                disabled={currentStep === 5 || currentStep === 0}
                                                onClick={() => {
                                                    setCurrentStep(currentStep - 1)
                                                }}
                                                className={"stepperButton"}
                                            >
                                                <TiArrowBack size={30} />
                                            </IconButton>
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
                                >
                                    {isMobile && (
                                        <>
                                            <div>
                                                {(
                                                    <div>
                                                        <IconButton
                                                            color="primary"
                                                            disabled={currentStep === 5 || currentStep === 0}
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
                                                                disabled={currentStep >= 5 || (currentStep === 0 && isNextStep)}

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
                                            // StepIconComponent={ColorlibStepIcon}
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
                        className="d-flex align-items-center justify-content-center mt-2 "
                    >
                        {!isMobile && (
                            <>
                                <div>
                                    {(
                                        <div>
                                            {(
                                                <IconButton

                                                    onClick={() => {
                                                        setCurrentStep(currentStep + 1)
                                                    }}
                                                    disabled={currentStep >= 5 || (currentStep === 0 && isNextStep)}
                                                    className={"stepperButtonNext"}
                                                >
                                                    <RiShareForwardFill />
                                                </IconButton>
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
