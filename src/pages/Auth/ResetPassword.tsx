import React, { useState, useContext, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
  Container,
  CssBaseline,
  Grid,
  Paper,
  Button,
  LinearProgress,
  Box,
  Link as MuiLink,
} from '@material-ui/core';
import { Formik, Form, Field } from 'formik';
import { TextField } from 'formik-material-ui';
import queryString from 'query-string';
import { Redirect, Link } from 'react-router-dom';
import demoImg from '../../assets/clip-hardworking-man.png';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { SET_USER, USER_LOADING } from '../../StateProvider/actionTypes';
import { useData } from '../../StateProvider/Provider';

const useStyles = makeStyles((theme) => ({
  container: {
    marginTop: theme.spacing(5),
    [theme.breakpoints.up('xs')]: {
      marginTop: theme.spacing(10),
    },
  },
  formContainer: {
    textAlign: 'center',
    padding: theme.spacing(10, 5),
  },
  form: {
    marginTop: theme.spacing(5),
    display: 'flex',
    flexDirection: 'column',
  },

  image: {
    display: 'none',
    [theme.breakpoints.up('md')]: {
      display: 'grid',
      placeItems: 'center',
    },
  },
  FormControl: {
    marginBottom: theme.spacing(3),
  },
  button: {
    marginTop: theme.spacing(2),
    background: theme.palette.secondary.main,
    color: '#fff',

    '&:hover': {
      backgroundColor: theme.palette.secondary.main,
    },
  },
  bottomLinks: {
    marginTop: theme.spacing(2),
    display: 'flex',
    justifyContent: 'space-between',
  },
}));

const ResetPassword = () => {
  const toastConfig = useContext(CustomToastContext)
  const classes = useStyles();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [tokenChecking, setTokenChecking] = useState(false);
  const { email, token } = queryString.parse(window.location.search);
  const { dispatch }: any = useData();

  useEffect(() => {
    checkToken()
    // eslint-disable-next-line
  }, []);

  const checkToken = async () => {
    setTokenChecking(true)
    axiosInstance(null, { Authorization: `Bearer ${token}` })
      .get(
        `/user/check-token`)
      .then(({ data }) => {
        data.data ?
          setIsTokenValid(data.data)
          : toastConfig.setToastConfig({
            message: 'Token is invalid',
            type: 'error',
            open: true,
          });

      })
      .catch((error) => {
        console.error(error);
        toastConfig.setToastConfig(error);
      });
  };

  const handleSubmit = async (values) => {
    setIsSubmitting(true);

    axiosInstance(null, { Authorization: `Bearer ${token}` })
      .post(
        `/user/reset-password`,
        {
          password: values.password,
        },
      )
      .then(({ data }) => {
        setIsSubmitting(false);
        setIsSubmitting(false);
        localStorage.setItem("token", data.data.token);
        dispatch({ type: USER_LOADING, payload: true });
        toastConfig.setToastConfig({
          open: true,
          type: "success",
          message: data.message,
        });
        axiosInstance()
          .get(`/user/me`)
          .then(({ data }) => {
            dispatch({ type: SET_USER, payload: data.data });
            dispatch({ type: USER_LOADING, payload: false });
            toastConfig.setToastConfig({
              open: true,
              type: "success",
              message: data.message,
            });
          })
          .catch((error) => {
            localStorage.setItem('token', '');
            dispatch({ type: USER_LOADING, payload: false });
            toastConfig.setToastConfig(error);
          });
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
    <Redirect to='/login' />
  ) : (
    <React.Fragment>
      <CssBaseline />
      <Container maxWidth='md'>
        <Paper elevation={1} className={classes.container}>
          <Grid container>
            <Grid item xs={12} sm={12} md={6} className={classes.formContainer}>
              <h2>Create A New Password</h2>
              <Formik
                initialValues={{
                  email,
                  password: '',
                }}
                validate={validateForm}
                onSubmit={handleSubmit}>
                {({ submitForm }) => (
                  <Form className={classes.form}>
                    <Field
                      component={TextField}
                      name='email'
                      type='email'
                      label='Email'
                      disabled
                      variant='outlined'
                      required
                    />
                    <br />
                    <Field
                      component={TextField}
                      type='password'
                      label='New Password'
                      name='password'
                      disabled={!isTokenValid || !tokenChecking}
                      variant='outlined'
                      required
                    />
                    <br />
                    <Field
                      component={TextField}
                      type='password'
                      label='Confirm Password'
                      name='confirmPassword'
                      disabled={!isTokenValid || !tokenChecking}
                      variant='outlined'
                      required
                    />
                    <br />
                    {isSubmitting && <LinearProgress />}
                    <Button
                      variant='contained'
                      color='primary'
                      size="small"
                      disabled={isSubmitting || !isTokenValid || !tokenChecking}
                      onClick={submitForm}>
                      Submit
                    </Button>
                  </Form>
                )}
              </Formik>
              <Box className={classes.bottomLinks}>
                <MuiLink to='/login' component={Link}>
                  Go To Login
                </MuiLink>
              </Box>
            </Grid>
            <Grid item xs={12} sm={12} md={6} className={classes.image}>
              <img src={demoImg} alt='illustration' style={{ width: '100%' }} />
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </React.Fragment>
  );
};

export default ResetPassword;