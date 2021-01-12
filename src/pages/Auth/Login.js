import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  Container,
  CssBaseline,
  Grid,
  Paper,
  Button,
  LinearProgress,
} from "@material-ui/core";
import axios from "axios";
import { Formik, Form, Field } from "formik";
import { TextField } from "formik-material-ui";

import demoImg from "../../assets/clip-hardworking-man.png";
import { useData } from "../../StateProvider/Provider";
import { SET_USER, USER_LOADING } from "../../StateProvider/actionTypes";

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

  const handleSubmit = async (values, { setSubmitting }) => {
    dispatch({ type: USER_LOADING, payload: true });

    await axios
      .post("/user/login", {
        email: values.email,
        password: values.password,
      })
      .then((res) => {
        setSubmitting(false);
        const { data } = res.data;

        localStorage.setItem("token", data.token);
        dispatch({ type: SET_USER, payload: data });
        dispatch({ type: USER_LOADING, payload: false });
      })
      .catch((err) => {
        dispatch({ type: USER_LOADING, payload: false });
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
                  email: "", //vebholic@gmail.com
                  password: "", //fgsfdhD#@43
                }}
                validate={validateForm}
                onSubmit={handleSubmit}
              >
                {({ submitForm, isSubmitting }) => (
                  <Form className={classes.form}>
                    <Field
                      component={TextField}
                      name="email"
                      type="email"
                      label="Email"
                    />
                    <br />
                    <Field
                      component={TextField}
                      type="password"
                      label="Password"
                      name="password"
                    />
                    {isSubmitting && <LinearProgress />}
                    <br />
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
