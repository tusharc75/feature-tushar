import { makeStyles } from '@material-ui/core';

const useStyles = makeStyles(() => ({
  mobileStep: {
    backgroundColor: '#DEE2E6'
  },
  createLayout: {
    minHeight: '45px',
    backgroundColor: '#DEE2E6',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'fixed',
    width: '100%',
    bottom: -3,
    zIndex: 123,
    left: 0
  },
  stepLayout: {
    paddingTop: '3px',
    fontWeight: 600,
    color: 'var(--primary-light)'
  }
}));

export default function CustomMobileStepperOpportunities({ nextButton, backButton, stepName }) {
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
  );
}
