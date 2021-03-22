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
import axios from "axios";
import queryString from "query-string";
import { useHistory, Redirect } from "react-router-dom";

import demoImg from "../../assets/clip-hardworking-man.png";

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
  const history = useHistory();
  const classes = useStyles();
  const [isSubmitting, setSubmitting] = useState(false);
  const { email, token } = queryString.parse(window.location.search);

  console.log(email, token);

  const URL = "https://oms-backend.vebholic.com";

  const handleSubmit = async (values) => {
    setSubmitting(true);

    axios
      .post(
        `${URL}/user/create-password`,
        {
          password: values.password,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .then(({ data }) => {
        setSubmitting(false);
        console.log(data);
        history.push("/login");
      })
      .catch((err) => {
        setSubmitting(false);
        console.log(err);
      });
  };

  const validateForm = (values) => {
    const errors: any = {};

    if (!values.password) {
      errors.password = "Required field";
    } else if (
      !/^(?=.*?[A-Z])(?=(.*[a-z]){1,})(?=(.*[\d]){1,})(?=(.*[\W]){1,})(?!.*\s).{8,}$/.test(
        values.password
      )
    ) {
      errors.password =
        "Minimum eight characters, at least one uppercase, one lowercase, one number and one special character";
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
                    <Field
                      component={TextField}
                      name="email"
                      type="email"
                      label="Email"
                      disabled
                      variant="outlined"
                      required
                    />
                    <br />
                    <Field
                      component={TextField}
                      type="password"
                      label="New Password"
                      name="password"
                      variant="outlined"
                      required
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

export default PasswordSetup;
