import React, { useState, useContext } from "react";
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
import { SET_USER, SET_SELECTED_ENTITY } from "../../StateProvider/actionTypes";

import axiosInstance from './../../axios/axiosInstance'
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import firebase from 'firebase';
import { vapidKey } from "../../constants/helpers";
import { CustomNotificationCountContext } from "../../StateProvider/CustomNotificationCountContext/CustomNotificationCountContext";


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
      backgroundColor: theme.palette.primary.main,  //  darkBg
    },
  },
}));

const Login = () => {
  const notification = useContext(CustomNotificationCountContext);
  const toastConfig = useContext(CustomToastContext);
  const { dispatch }: any = useData();
  const classes = useStyles();
  const [isSubmitting, setSubmitting] = useState(false);

  const handleSubmit = async (values) => {
    setSubmitting(true);
    const data = {
      email: values.email,
      password: values.password,
    };

    axiosInstance().post("/user/login", data)
      .then(({ data: response }) => {
        setSubmitting(false);
        const { data } = response;
        localStorage.setItem("token", data.token);
        dispatch({ type: SET_USER, payload: data });
        if (data?.role?.selectedEntity?._id) {
          dispatch({ type: SET_SELECTED_ENTITY, payload: data.role.selectedEntity._id });
        }

        axiosInstance().get(`/user/notification/unseen`).then(({ data: { count } }) => {
          notification.setCount(count);
        }).catch((error) => {
          toastConfig.setToastConfig(error);
        });

        // const messaging = firebase.messaging();
        // messaging.getToken({ vapidKey: vapidKey }).then((token) => {
        //   if (token) {
        //     localStorage.setItem("notificationToken", token)
        //   } else {
        //     toastConfig.setToastConfig({
        //       open: true,
        //       type: "error",
        //       message: "No registration token available. Request permission to generate one."
        //     })
        //   }
        // }).catch((err) => {
        //   console.log('An error occurred while retrieving token. ', err);
        //   // catch error while creating client token
        // });
      })
      .catch((error) => {
        setSubmitting(false);
        toastConfig.setToastConfig(error);
      });
  };

  const validateForm = (values) => {
    const errors: any = {};
    if (!values.email) {
      errors.email = "Email is required";
    } else if (
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(values.email)
    ) {
      errors.email = "Invalid email address";
    }

    if (!values.password) {
      errors.password = "Password is required";
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
                  email: "gagan@test.com",
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
                      size="small"
                    />
                    <br />
                    <Field
                      component={TextField}
                      type="password"
                      label="Password"
                      name="password"
                      variant="outlined"
                      size="small"
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
