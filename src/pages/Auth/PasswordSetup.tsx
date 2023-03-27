import React, { useState, useContext } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  Container,
  CssBaseline,
  Grid,
  Paper,
  Button,
  CircularProgress,
  TextField,
} from "@material-ui/core";
import { Formik, Form } from "formik";
import queryString from "query-string";
import { useHistory, Redirect } from "react-router-dom";

import demoImg from "../../assets/clip-hardworking-man.png";
import axiosInstance from "../../axios/axiosInstance";
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';

const useStyles = makeStyles((theme) => ({
  container: {
    marginTop: theme.spacing(5),
    [theme.breakpoints.up("xs")]: {
      marginTop: theme.spacing(10),
    },
  },
  formContainer: {
    textAlign: "center",
    padding: theme.spacing(10, 5),
  },
  form: {
    marginTop: theme.spacing(5),
    display: "flex",
    flexDirection: "column",
  },

  image: {
    display: "none",
    [theme.breakpoints.up("md")]: {
      display: "grid",
      placeItems: "center",
    },
  },
  FormControl: {
    marginBottom: theme.spacing(3),
  },
  button: {
    marginTop: theme.spacing(2),
    background: theme.palette.primary.main, //  darkBg
    color: "#fff",

    "&:hover": {
      backgroundColor: theme.palette.primary.main, //  darkBg
    },
  },
}));

const PasswordSetup = () => {
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const classes = useStyles();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { email, token } = queryString.parse(window.location.search);

  const handleSubmit = async (values) => {
    setIsSubmitting(true);

    axiosInstance(null, { Authorization: `Bearer ${token}` })
      .post(
        `/user/create-password`,
        {
          password: values.password,
        },
      )
      .then(({ data }) => {
        setIsSubmitting(false);
        toastConfig.setToastConfig({
          open: true,
          type: "success",
          message: data.message,
        });
        history.push("/login");
      })
      .catch((err) => {
        setIsSubmitting(false);
        toastConfig.setToastConfig(err);
      });
  };

  const validateForm = (values) => {
    const errors: any = {};

    if (!values.password) {
      errors.password = 'Required field';
    }
    else if (!values.confirmPassword) {
      errors.confirmPassword = 'Required field';
    }
    else if (
      !/^(?=.*?[A-Z])(?=(.*[a-z]){1,})(?=(.*[\d]){1,})(?=(.*[\W]){1,})(?!.*\s).{8,}$/.test(
        values.password,
      )
    ) {
      errors.password =
        'Minimum eight characters, at least one uppercase, one lowercase, one number and one special character';
    }
    else if (
      !/^(?=.*?[A-Z])(?=(.*[a-z]){1,})(?=(.*[\d]){1,})(?=(.*[\W]){1,})(?!.*\s).{8,}$/.test(
        values.confirmPassword,
      )
    ) {
      errors.confirmPassword =
        'Minimum eight characters, at least one uppercase, one lowercase, one number and one special character';
    }
    else if (values.confirmPassword !== values.password) {
      errors.confirmPassword = 'Password and confirm Password does not match';
    }
    return errors;
  };

  return !email && !token ? (
    <Redirect to="/login" />
  ) : (
    <React.Fragment>
      <CssBaseline />
      <Container maxWidth="md">
        <Paper elevation={1} className={classes.container}>
          <Grid container>
            <Grid item xs={12} sm={12} md={6} className={classes.formContainer}>
              <h2>Create A New Password</h2>
              <Formik
                initialValues={{
                  email,
                  password: "",
                }}
                validate={validateForm}
                onSubmit={handleSubmit}
              >
                {({ submitForm }) => (
                  <Form className={classes.form}>
                    <TextField
                      name="email"
                      type="email"
                      label="Email"
                      disabled
                      variant="outlined"
                      required
                    />
                    <br />
                    <TextField
                      type="password"
                      label="New Password"
                      name="password"
                      variant="outlined"
                      required
                    />
                    <br />
                    <TextField
                      type='password'
                      label='Confirm Password'
                      name='confirmPassword'
                      variant='outlined'
                      required
                    />
                    <br />
                    <Button
                      variant="contained"
                      className="logo-bg-color"
                      size="small"
                      disabled={isSubmitting}
                      onClick={submitForm}
                      startIcon={isSubmitting && <CircularProgress size={20} color='inherit' />}
                    >
                      Submit
                    </Button>
                  </Form>
                )}
              </Formik>
            </Grid>
            <Grid item xs={12} sm={12} md={6} className={classes.image}>
              <img src={demoImg} alt="illustration" style={{ width: "100%" }} />
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </React.Fragment>
  );
};

export default PasswordSetup;
