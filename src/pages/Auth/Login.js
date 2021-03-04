import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  Container,
  CssBaseline,
  Grid,
  Paper,
  Button,
  LinearProgress,
} from "@material-ui/core";
import { Formik, Form, Field } from "formik";
import { TextField } from "formik-material-ui";

import demoImg from "../../assets/clip-hardworking-man.png";
import { useData } from "../../StateProvider/Provider";
import { SET_USER } from "../../StateProvider/actionTypes";

import { UserLogin } from "../../axios/index";
import axiosInstance from './../../axios/axiosInstance'

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
    background: theme.palette.darkBg,
    color: "#fff",

    "&:hover": {
      backgroundColor: theme.palette.darkBg,
    },
  },
}));

const Login = () => {
  const { dispatch } = useData();
  const classes = useStyles();
  const [isSubmitting, setSubmitting] = useState(false);

  const handleSubmit = async (values) => {
    setSubmitting(true);
    const data = {
      email: values.email,
      password: values.password,
    };
    
    axiosInstance().post("/user/login", data)
      .then((res) => {
        setSubmitting(false);
        const { data } = res;
        localStorage.setItem("token", data.token);
        dispatch({ type: SET_USER, payload: data });
      })
      .catch((err) => {
        setSubmitting(false);
        console.log(err);
      });
  };

  const validateForm = (values) => {
    const errors = {};
    if (!values.email) {
      errors.email = "Required";
    } else if (
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(values.email)
    ) {
      errors.email = "Invalid email address";
    }

    if (!values.password) {
      errors.password = "Required";
    }

    return errors;
  };

  return (
    <React.Fragment>
      <CssBaseline />
      <Container maxWidth="md">
        <Paper elevation={1} className={classes.container}>
          <Grid container>
            <Grid item xs={12} sm={12} md={6} className={classes.formContainer}>
              <h2>Login</h2>
              <Formik
                initialValues={{
                  email: "punit@gmail.com",
                  password: "soR$Tw83n92ghs2",
                }}
                validate={validateForm}
                onSubmit={handleSubmit}
              >
                {({ submitForm }) => (
                  <Form className={classes.form}>
                    <Field
                      component={TextField}
                      name="email"
                      type="email"
                      label="Email"
                      variant="outlined"
                    />
                    <br />
                    <Field
                      component={TextField}
                      type="password"
                      label="Password"
                      name="password"
                      variant="outlined"
                    />
                    <br />
                    {isSubmitting && <LinearProgress />}
                    <Button
                      variant="contained"
                      color="primary"
                      disabled={isSubmitting}
                      onClick={submitForm}
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

export default Login;
