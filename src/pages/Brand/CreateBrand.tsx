import React from 'react';
import { makeStyles } from '@mui/styles';
import { Container, CssBaseline, Typography, Stepper, Step, StepLabel, Button, Paper, Box, TextField, Theme } from '@mui/material';
import Grid from '@mui/material/Grid2';
const useStyles = makeStyles((theme: Theme) => ({
  root: {
    flexGrow: 1,
    width: '100%',
    [theme.breakpoints.down('sm')]: {
      textAlign: 'center'
    }
  },
  container: {
    margin: theme.spacing(2, 0),
    padding: theme.spacing(5, 10),
    [theme.breakpoints.down('md')]: {
      padding: theme.spacing(5, 5)
    }
  },
  backButton: {
    marginRight: theme.spacing(1)
  },
  instructions: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1)
  },
  formContainer: {
    padding: theme.spacing(10, 15),
    [theme.breakpoints.down('md')]: {
      padding: theme.spacing(10, 10)
    },
    [theme.breakpoints.down('xs')]: {
      padding: theme.spacing(10, 5)
    }
  },
  inputContainer: {
    width: '100%',
    marginBottom: theme.spacing(4)
  },
  input: {
    width: '100%'
  },
  buttonsContainer: {
    display: 'flex',
    justifyContent: 'flex-end'
  }
}));

function getSteps() {
  return ['User Details', 'Entity Details', 'Brand Details'];
}

function getStepContent(stepIndex) {
  switch (stepIndex) {
    case 0:
      return 'Select campaign settings...';
    case 1:
      return 'What is an ad group anyways?';
    case 2:
      return 'This is the bit I really care about!';
    default:
      return 'Unknown stepIndex';
  }
}

const CreateBrand = () => {
  const classes = useStyles();
  const [activeStep, setActiveStep] = React.useState(0);
  const steps = getSteps();

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
  };
  return (
    <div className={classes.root}>
      <CssBaseline />
      <Container fixed>
        <Paper className={classes.container}>
          <Grid container justifyContent="space-between">
            <Grid size={{ xs:12, sm:12, md:6}}>
              <Typography variant="h6">Create New Brand</Typography>
              <Typography variant="body2">Follow all the steps to create a brand</Typography>
            </Grid>
            <Grid size={{ xs:12, sm:12, md:6}}>
              <Stepper activeStep={activeStep} alternativeLabel>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Grid>
          </Grid>

          {/* User Detail Form */}

          {activeStep === 0 ? (
            <Box className={classes.formContainer}>
              <h2>User Details</h2>

              <Grid container spacing={10} justifyContent="space-between">
                <Grid size={{ xs:12, sm:12, md:6}}>
                  <Box className={classes.inputContainer}>
                    <TextField label="First Name" className={classes.input} />
                  </Box>
                  <Box className={classes.inputContainer}>
                    <TextField label="Email" className={classes.input} />
                  </Box>
                  <Box className={classes.inputContainer}>
                    <TextField label="Mobile No." className={classes.input} />
                  </Box>
                </Grid>
                <Grid size={{ xs:12, sm:12, md:6}}>
                  <Box className={classes.inputContainer}>
                    <TextField label="Last Name" className={classes.input} />
                  </Box>
                  <Box className={classes.inputContainer}>
                    <TextField label="Employee No." className={classes.input} />
                  </Box>
                  <Box className={classes.inputContainer}>
                    <TextField label="Office No." className={classes.input} />
                  </Box>
                </Grid>
              </Grid>
            </Box>
          ) : activeStep === 1 ? (
            <Box className={classes.formContainer}>
              <h2>Entity Details</h2>

              <Grid container spacing={10} justifyContent="space-between">
                <Grid size={{ xs:12, sm:12, md:6}}>
                  <Box className={classes.inputContainer}>
                    <TextField label="Name" className={classes.input} />
                  </Box>
                  <Box className={classes.inputContainer}>
                    <TextField label="Tax Jurisdiction" className={classes.input} />
                  </Box>
                  <Box className={classes.inputContainer}>
                    <TextField label="City" className={classes.input} />
                  </Box>
                  <Box className={classes.inputContainer}>
                    <TextField label="Country" className={classes.input} />
                  </Box>
                </Grid>
                <Grid size={{ xs:12, sm:12, md:6}}>
                  <Box className={classes.inputContainer}>
                    <TextField label="Brand" className={classes.input} />
                  </Box>
                  <Box className={classes.inputContainer}>
                    <TextField label="Postal Code" className={classes.input} />
                  </Box>
                  <Box className={classes.inputContainer}>
                    <TextField label="State" className={classes.input} />
                  </Box>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Box className={classes.formContainer}>
              <h2>Brand Details</h2>

              <Grid container spacing={10} justifyContent="space-between">
                <Grid size={{ xs:12, sm:12, md:6}}>
                  <Box className={classes.inputContainer}>
                    <TextField label="Company Name" className={classes.input} />
                  </Box>
                  <Box className={classes.inputContainer}>
                    <TextField label="Currency" className={classes.input} />
                  </Box>
                  <Box className={classes.inputContainer}>
                    <TextField label="Postal Code" className={classes.input} />
                  </Box>
                  <Box className={classes.inputContainer}>
                    <TextField label="State" className={classes.input} />
                  </Box>
                  <Box className={classes.inputContainer}>
                    <TextField label="Communication Language" className={classes.input} />
                  </Box>
                  <Box className={classes.inputContainer}>
                    <TextField label="Mobile No." className={classes.input} />
                  </Box>
                  <Box className={classes.inputContainer}>
                    <TextField label="Communication Method" className={classes.input} />
                  </Box>
                  <Box className={classes.inputContainer}>
                    <TextField label="Requests" className={classes.input} />
                  </Box>
                </Grid>
                <Grid size={{ xs:12, sm:12, md:6}}>
                  <Box className={classes.inputContainer}>
                    <TextField label="Company Code" className={classes.input} />
                  </Box>
                  <Box className={classes.inputContainer}>
                    <TextField label="Portal Language" className={classes.input} />
                  </Box>
                  <Box className={classes.inputContainer}>
                    <TextField label="City" className={classes.input} />
                  </Box>
                  <Box className={classes.inputContainer}>
                    <TextField label="Country" className={classes.input} />
                  </Box>
                  <Box className={classes.inputContainer}>
                    <TextField label="Telephone" className={classes.input} />
                  </Box>
                  <Box className={classes.inputContainer}>
                    <TextField label="Fax" className={classes.input} />
                  </Box>
                  <Box className={classes.inputContainer}>
                    <TextField label="Comments" className={classes.input} />
                  </Box>
                  <Box className={classes.inputContainer}>
                    <TextField label="Short Description" className={classes.input} />
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
          <Box className={classes.buttonsContainer}>
            <div>
              <div>
                <div>
                  <Button disabled={activeStep === 0} onClick={handleBack} size="small" className={classes.backButton}>
                    Back
                  </Button>
                  <Button variant="contained" color="primary" size="small" onClick={handleNext}>
                    {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
                  </Button>
                </div>
              </div>
            </div>
          </Box>
        </Paper>
      </Container>
    </div>
  );
};

export default CreateBrand;
