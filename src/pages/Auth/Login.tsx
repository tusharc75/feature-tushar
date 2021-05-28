import React, { useState, useContext, useEffect } from "react";
import { Link } from 'react-router-dom';
import { makeStyles } from "@material-ui/core/styles";
import {
  Container,
  CssBaseline,
  Grid,
  Paper,
  Button,
  LinearProgress,
  Box,
} from "@material-ui/core";
import { Formik, Form, Field } from "formik";
import { TextField } from "formik-material-ui";
import demoImg from "../../assets/clip-hardworking-man.png";
import { useData } from "../../StateProvider/Provider";
import { SET_USER, SET_SELECTED_ENTITY } from "../../StateProvider/actionTypes";
import axiosInstance from './../../axios/axiosInstance'
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import { vapidKey } from "../../constants/helpers";
import { CustomNotificationCountContext } from "../../StateProvider/CustomNotificationCountContext/CustomNotificationCountContext";
import { AuthenticatedTemplate, UnauthenticatedTemplate, useAccount, useMsal } from "@azure/msal-react";
import { isEmpty } from "lodash";
import getAzureAcessToken from "../../components/Azure/getAzureAccessToken";
import { AzureLogin } from "../../components/Azure/Azure";
import ForgetPassword from "./ForgetPassword";


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
  bottomLinks: {
    marginTop: theme.spacing(2),
    display: 'flex',
    justifyContent: 'space-between',
  },
}));

const Login = () => {
  const notification = useContext(CustomNotificationCountContext);
  const toastConfig = useContext(CustomToastContext);
  const { dispatch }: any = useData();
  const classes = useStyles();
  const [isSubmitting, setSubmitting] = useState(false);
  const { instance, accounts, inProgress } = useMsal();
  const account = useAccount(accounts[0] || {});
  const [counter, setCounter] = useState(0);
  const [invalidAzureLogin, setInvalidAzureLogin] = useState(false);
  useEffect(() => {

    if (!isEmpty(account)) {
      (async () => {
        try {
          const graphToken = await getAzureAcessToken(instance);
          const res = await axiosInstance().post('/user/login/azure', {
            "graph-token": graphToken
          })
          const { data } = res.data
          localStorage.setItem("token", data.token);
          dispatch({ type: SET_USER, payload: data });
          if (data?.role?.selectedEntity?._id) {
            dispatch({ type: SET_SELECTED_ENTITY, payload: data.role.selectedEntity._id });
          }
        } catch (e) {
          setCounter(18);
          setInvalidAzureLogin(true);
          toastConfig.setToastConfig(e);
        }
      })()

    }
  }, [account])

  useEffect(() => {
    if (invalidAzureLogin) {
      if (invalidAzureLogin && counter) {
        setTimeout(() => setCounter(counter - 1), 1000)
      }
      else {
        instance.logout();
        setInvalidAzureLogin(false);
      }
    }
  }, [invalidAzureLogin, counter])
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
                      size="small" 
                      disabled={isSubmitting}
                      onClick={submitForm}
                    >
                      Submit
                    </Button>
                  </Form>
                )}
              </Formik>
              <br />
              <Box className={classes.bottomLinks}>
                <Link to='/forget-password'>
                  Forgot Password?
                </Link>
              </Box>
              <Box >
                <AuthenticatedTemplate>
                  {invalidAzureLogin ? <span>Not authorized loging out in {counter}</span> : <Button
                    variant="contained"
                    style={{ width: "100%" }}
                    color="secondary"
                    disabled={isSubmitting}
                    onClick={() => instance.logoutPopup()}
                  >
                    Azure Log Out
                      </Button>
                  }


                </AuthenticatedTemplate>
                <UnauthenticatedTemplate>
                  <AzureLogin></AzureLogin>
                </UnauthenticatedTemplate>
              </Box>

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
