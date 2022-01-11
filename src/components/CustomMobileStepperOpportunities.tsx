import React, { useContext, useEffect, useState } from "react";
import {
    withStyles,
    Grid,
    Typography,
    Button,
    MobileStepper,
    useTheme,
    makeStyles  
  
  } from "@material-ui/core";

  import KeyboardArrowLeft from '@material-ui/icons/KeyboardArrowLeft';
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';
import { isMobile } from "react-device-detect";
import CustomSteps from "./CustomSteps/CustomSteps";
import {
    IoIosArrowDroprightCircle,
    IoIosArrowDropleftCircle,
  } from "react-icons/io";

  const useStyles = makeStyles((theme) => ({
    mobileStep: {
    backgroundColor: "#DEE2E6",
    
  },
  createLayout:{
    minHeight:"45px",
    backgroundColor: "#DEE2E6",
    display:"flex",
    justifyContent:"space-between",
    alignItems:"center",
    position:"fixed",
    width:"100%",
    bottom:-3,
    zIndex:123
  },
  stepLayout:{
    paddingTop:"3px",
    fontWeight: 600,
    color: "var(--primary-light)"
  }
  
}));


  export default function CustomMobileStepperOpportunities({nextButton,backButton , stepName}) {
   
    const theme = useTheme();
    const classes = useStyles();
  
    return (
              //   <MobileStepper
              //   variant={variant}
              //   steps={6}
              //   position="bottom"
              //   activeStep={active}
              //   style={{ maxWidth: 400, flexGrow: 1 }}
              //   nextButton={nextButton}
              //   backButton={backButton}
              //   className={classes.mobileStep}
              // />
              <div className={classes.createLayout}>
                  {/* <Button
                  variant={"contained"}
                  color="primary"
                  className="mr-1"
                  >
                  hello
                  </Button> */}

                  {backButton}

                  <span className={classes.stepLayout}>{stepName}</span>

                  {/* <Button
                  variant={"contained"}
                  color="primary"
                  className="mr-1"
                  >
                  hello
                  </Button> */}
                  {nextButton}

              </div>
  
        
    ) }
