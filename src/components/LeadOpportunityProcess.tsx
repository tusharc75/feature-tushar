import React from 'react'
import CustomSteps from "./CustomSteps/CustomSteps";
import { Button } from "@material-ui/core";
import {
    IoIosArrowDroprightCircle,
    IoIosArrowDropleftCircle,
} from "react-icons/io";
export default function LeadOpportunityProcess(props) {

    const { steps, activeStep, isProcessing, handleMarkAsCompleted, hideBackButton = false,
        disableBackNext = false
    } = props


    return <>
        {
            steps.length > 0 &&
            <div className="stepper-box" style={{ paddingBottom: (activeStep < (steps.length - 1)) ? "" : "10px" }} >
                <div className="mainview" >
                    <CustomSteps steps={steps} active={activeStep} />
                </div>
                {
                    disableBackNext ? null :
                        <div className="actionview">
                            <div className="d-flex justify-content-end">
                                {activeStep > 0 && activeStep <= steps.length && !hideBackButton ? (
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        className="mr-1"
                                        onClick={() => handleMarkAsCompleted({ isSetBackStep: true })}
                                        disabled={isProcessing}
                                        size="small"
                                        startIcon={<IoIosArrowDropleftCircle />}>
                                        Back
                                    </Button>
                                ) : null}
                                {
                                    activeStep < steps.length - 1 ?
                                        isProcessing ? <Button variant="outlined"
                                            color="primary"
                                            disabled={true}
                                            onClick={() => { }}>
                                            Processing...
                                        </Button> :
                                            <Button variant="contained"
                                                color="primary"
                                                size="small"
                                                disabled={!steps[activeStep]?.canCompleteManually}
                                                onClick={handleMarkAsCompleted}
                                                endIcon={<IoIosArrowDroprightCircle />}
                                            >
                                                {activeStep === steps.length - 2 ? "Finish" : "Next"}
                                            </Button> : ""
                                }
                            </div>
                        </div>
                }
            </div>
        }
    </>
}
