import React from "react";
import CustomSteps from "./CustomSteps/CustomSteps";
import CustomMobileStepperOpportunities from "./CustomMobileStepperOpportunities";
import { Button, Typography } from "@material-ui/core";
import {
  IoIosArrowDroprightCircle,
  IoIosArrowDropleftCircle,
} from "react-icons/io";
import { isMobile, isTablet } from 'react-device-detect';
import { AiOutlineLeft } from "react-icons/ai";
import { BsChevronRight } from "react-icons/bs";
export default function ProcessFlow(props) {
  const {
    steps,
    activeStep,
    isProcessing,
    handleMarkAsCompleted,
    hideBackButton = false,
    disableBackNext = false,
  } = props;



  return (
    <>
      {steps.length > 0 && (
        isMobile && !isTablet ? <CustomMobileStepperOpportunities stepName={((activeStep + 1) + "/" + steps.length) + " " + steps[activeStep]?.text} nextButton={(
          isProcessing ? (
            <Button
              variant="outlined"
              color="primary"
              disabled={true}
              onClick={() => { }}
            >
              Processing...
            </Button>
          ) : (
            <Button
              variant={"text"}
              color="primary"
              size="small"
              className="mr-1 MobileStep-next-back-button"
              disabled={
                !steps[activeStep + 1]?.canCompleteManually ||
                  isProcessing
                  ? true
                  : false

              }
              onClick={handleMarkAsCompleted}
              endIcon={<BsChevronRight />}
            >

              {activeStep === steps.length - 2 ? "Finish" : "Next"}
            </Button>
          )
        )} backButton={
          <Button
            variant={"text"}
            color="primary"
            className="ml-1 MobileStep-next-back-button"
            onClick={() =>
              handleMarkAsCompleted({ isSetBackStep: true })
            }
            disabled={activeStep === 0 ? true : false}
            size="small"
            startIcon={<AiOutlineLeft />}
          >
            {activeStep === 0 ? "" : "Back"}
          </Button>
        } /> :


          <div
            className="stepper-box"
            style={{ paddingBottom: activeStep < steps.length - 1 ? "" : "10px" }}
          >
            <div className="mainview">

              <CustomSteps steps={steps} active={activeStep} />
            </div>
            {disableBackNext ? null : (
              <div className="actionview">
                <div className="d-flex justify-content-space-between ">
                  <Button
                    variant={isMobile ? "text" : "contained"}
                    color="primary"
                    className="mr-1"
                    onClick={() =>
                      handleMarkAsCompleted({ isSetBackStep: true })
                    }
                    disabled={isProcessing || activeStep === 0}
                    size="small"
                    startIcon={<IoIosArrowDropleftCircle />}
                  >
                    {isMobile ? "" : "Back"}
                  </Button>
                  {isProcessing ? (
                    <Button
                      variant="outlined"
                      color="primary"
                      disabled={true}
                      onClick={() => { }}
                    >
                      Processing...
                    </Button>
                  ) : (
                    <Button
                      variant={isMobile ? "text" : "contained"}
                      color="primary"
                      size="small"
                      disabled={
                        !steps[activeStep + 1]?.canCompleteManually ||
                          isProcessing
                          ? true
                          : false
                      }
                      onClick={handleMarkAsCompleted}
                      endIcon={<IoIosArrowDroprightCircle />}
                    >

                      {activeStep === steps.length - 2 ? isMobile ? "" : "Finish" : isMobile ? "" : "Next"}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

      )}
    </>
  );
}
