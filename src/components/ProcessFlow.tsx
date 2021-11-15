import React from "react";
import CustomSteps from "./CustomSteps/CustomSteps";
import { Button } from "@material-ui/core";
import {
  IoIosArrowDroprightCircle,
  IoIosArrowDropleftCircle,
} from "react-icons/io";
import { isMobile, isTablet } from 'react-device-detect';
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
                {activeStep > 0 &&
                activeStep <= steps.length &&
                !hideBackButton ? (
                  <Button
                    variant={isMobile ? "text" : "contained"}
                    color="primary"
                    className="mr-1"
                    onClick={() =>
                      handleMarkAsCompleted({ isSetBackStep: true })
                    }
                    disabled={isProcessing}
                    size="small"
                    startIcon={<IoIosArrowDropleftCircle />}
                  >
                    {isMobile ? "" : "Back"}
                  </Button>
                ) : null}
                {activeStep < steps.length - 1 ? (
                  isProcessing ? (
                    <Button
                      variant="outlined"
                      color="primary"
                      disabled={true}
                      onClick={() => {}}
                    >
                      Processing...
                    </Button>
                  ) : (
                    <Button
                      variant= {isMobile ? "text" : "contained"}
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
                  )
                ) : (
                  ""
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
